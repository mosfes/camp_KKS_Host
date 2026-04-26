import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

// ตรวจสิทธิ์ครูเข้าถึงค่าย (เจ้าของหรือครูที่ลงทะเบียน)
async function checkCampAccess(campId, teacherId) {
  return prisma.camp.findFirst({
    where: {
      camp_id: campId,
      deletedAt: null,
      OR: [
        { created_by_teacher_id: teacherId },
        { teacher_enrollment: { some: { teacher_teachers_id: teacherId } } },
      ],
    },
  });
}

// หรือสร้าง teacher_enrollment ถ้ายังไม่มี (สำหรับเจ้าของค่าย)
async function ensureTeacherEnrollment(teacherId, campId) {
  let enrollment = await prisma.teacher_enrollment.findFirst({
    where: { teacher_teachers_id: teacherId, camp_camp_id: campId },
  });
  if (!enrollment) {
    enrollment = await prisma.teacher_enrollment.create({
      data: { teacher_teachers_id: teacherId, camp_camp_id: campId },
    });
  }
  return enrollment;
}

// GET /api/camps/[id]/sessions — รายการรอบเช็คชื่อทั้งหมด
export async function GET(request, context) {
  const { teacher, error: authError } = await requireTeacher();
  if (authError) return authError;

  try {
    const params = await context.params;
    const campId = Number(params.id);

    if (!(await checkCampAccess(campId, teacher.teachers_id))) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงค่ายนี้" }, { status: 403 });
    }

    // นับจำนวนนักเรียนทั้งหมดในค่าย (สำหรับแสดง % progress)
    const campClassrooms = await prisma.camp_classroom.findMany({
      where: { camp_camp_id: campId },
      include: {
        classroom: { select: { classroom_students: { select: { student_students_id: true } } } },
      },
    });
    const totalStudents = new Set(
      campClassrooms.flatMap((cc) =>
        cc.classroom.classroom_students.map((cs) => cs.student_students_id)
      )
    ).size;

    // ดึงรอบเช็คชื่อทั้งหมด
    const sessions = await prisma.attendance_teachers.findMany({
      where: { camp_camp_id: campId },
      include: {
        attendance_record_student: { select: { record_id: true } },
        teacher_enrollment: {
          include: {
            teacher: { select: { prefix_name: true, firstname: true, lastname: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const result = sessions.map((s) => ({
      sessionId: s.session_id,
      description: s.description,
      createdAt: s.created_at,
      teacherName: `${s.teacher_enrollment.teacher.prefix_name ?? ""}${s.teacher_enrollment.teacher.firstname} ${s.teacher_enrollment.teacher.lastname}`,
      checkedInCount: s.attendance_record_student.length,
      totalStudents,
    }));

    return NextResponse.json({ sessions: result, totalStudents });
  } catch (error) {
    console.error("Sessions GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/camps/[id]/sessions — สร้างรอบเช็คชื่อใหม่
export async function POST(request, context) {
  const { teacher, error: authError } = await requireTeacher();
  if (authError) return authError;

  try {
    const params = await context.params;
    const campId = Number(params.id);
    const { description } = await request.json();

    if (!description?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อรอบเช็คชื่อ" }, { status: 400 });
    }

    if (!(await checkCampAccess(campId, teacher.teachers_id))) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงค่ายนี้" }, { status: 403 });
    }

    // หรือสร้าง enrollment ถ้าเจ้าของค่ายยังไม่มี
    const enrollment = await ensureTeacherEnrollment(teacher.teachers_id, campId);

    const session = await prisma.attendance_teachers.create({
      data: {
        description: description.trim(),
        methed: "default",
        camp_camp_id: campId,
        teacher_enrollment_teacher_enrollment_id: enrollment.teacher_enrollment_id,
      },
    });

    return NextResponse.json({ sessionId: session.session_id, description: session.description, createdAt: session.created_at });
  } catch (error) {
    console.error("Sessions POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/camps/[id]/sessions?sessionId=X — ลบรอบเช็คชื่อ
export async function DELETE(request, context) {
  const { teacher, error: authError } = await requireTeacher();
  if (authError) return authError;

  try {
    const params = await context.params;
    const campId = Number(params.id);
    const { searchParams } = new URL(request.url);
    const sessionId = Number(searchParams.get("sessionId"));

    if (!(await checkCampAccess(campId, teacher.teachers_id))) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    // ลบ records ก่อน แล้วค่อยลบ session
    await prisma.attendance_record_student.deleteMany({
      where: { attendance_teacher_session_id: sessionId },
    });
    await prisma.attendance_teachers.delete({ where: { session_id: sessionId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sessions DELETE error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
