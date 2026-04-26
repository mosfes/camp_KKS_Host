import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

// GET /api/camps/[id]/attendance
// ดึงรายชื่อนักเรียนทั้งหมดในค่าย พร้อมสถานะ enrolled_at (เช็คชื่อ)
export async function GET(request, context) {
  const { teacher, error: authError } = await requireTeacher();
  if (authError) return authError;

  try {
    const params = await context.params;
    const campId = Number(params.id);

    // ตรวจสอบสิทธิ์: เจ้าของหรือครูที่ลงทะเบียน
    const checkAccess = await prisma.camp.findFirst({
      where: {
        camp_id: campId,
        deletedAt: null,
        OR: [
          { created_by_teacher_id: teacher.teachers_id },
          { teacher_enrollment: { some: { teacher_teachers_id: teacher.teachers_id } } },
        ],
      },
    });

    if (!checkAccess) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงค่ายนี้" }, { status: 403 });
    }

    // ดึงนักเรียนทั้งหมดใน classroom ที่ผูกกับค่าย
    const campClassrooms = await prisma.camp_classroom.findMany({
      where: { camp_camp_id: campId },
      include: {
        classroom: {
          include: {
            classroom_students: {
              include: {
                student: {
                  select: {
                    students_id: true,
                    prefix_name: true,
                    firstname: true,
                    lastname: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // รวบรวม students_id ทั้งหมด (ไม่ซ้ำ)
    const studentIds = new Set();
    const studentMap = new Map();
    for (const cc of campClassrooms) {
      for (const cs of cc.classroom.classroom_students) {
        const s = cs.student;
        if (!studentMap.has(s.students_id)) {
          studentIds.add(s.students_id);
          studentMap.set(s.students_id, {
            studentId: s.students_id,
            name: `${s.prefix_name ?? ""}${s.firstname} ${s.lastname}`,
          });
        }
      }
    }

    // ดึง enrollment ของทุกคน เพื่อดูสถานะ enrolled_at
    const enrollments = await prisma.student_enrollment.findMany({
      where: {
        camp_camp_id: campId,
        student_students_id: { in: Array.from(studentIds) },
      },
      select: {
        student_enrollment_id: true,
        student_students_id: true,
        enrolled_at: true,
      },
    });

    const enrollmentMap = new Map(enrollments.map((e) => [e.student_students_id, e]));

    const students = Array.from(studentMap.values()).map((s) => {
      const enr = enrollmentMap.get(s.studentId);
      return {
        ...s,
        enrollmentId: enr?.student_enrollment_id ?? null,
        checkedIn: enr?.enrolled_at != null,
        checkedInAt: enr?.enrolled_at ?? null,
      };
    });

    // เรียงชื่อ
    students.sort((a, b) => a.name.localeCompare(b.name, "th"));

    return NextResponse.json({
      campId,
      totalStudents: students.length,
      checkedInCount: students.filter((s) => s.checkedIn).length,
      students,
    });
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PATCH /api/camps/[id]/attendance
// body: { enrollmentId, checkedIn: true/false }
// toggle เช็คชื่อนักเรียน โดยตั้ง/ล้าง enrolled_at
export async function PATCH(request, context) {
  const { teacher, error: authError } = await requireTeacher();
  if (authError) return authError;

  try {
    const params = await context.params;
    const campId = Number(params.id);
    const { enrollmentId, checkedIn } = await request.json();

    if (!enrollmentId) {
      return NextResponse.json({ error: "ไม่พบข้อมูล enrollment" }, { status: 400 });
    }

    // ตรวจสิทธิ์
    const checkAccess = await prisma.camp.findFirst({
      where: {
        camp_id: campId,
        deletedAt: null,
        OR: [
          { created_by_teacher_id: teacher.teachers_id },
          { teacher_enrollment: { some: { teacher_teachers_id: teacher.teachers_id } } },
        ],
      },
    });

    if (!checkAccess) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงค่ายนี้" }, { status: 403 });
    }

    const updated = await prisma.student_enrollment.update({
      where: { student_enrollment_id: enrollmentId },
      data: { enrolled_at: checkedIn ? new Date() : null },
    });

    return NextResponse.json({
      success: true,
      enrolled_at: updated.enrolled_at,
    });
  } catch (error) {
    console.error("Attendance PATCH error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
