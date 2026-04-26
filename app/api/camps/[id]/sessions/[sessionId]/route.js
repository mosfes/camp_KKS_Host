import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

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

// ดึงนักเรียนทั้งหมดในค่าย
async function getAllStudentsInCamp(campId) {
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

  const studentMap = new Map();
  for (const cc of campClassrooms) {
    for (const cs of cc.classroom.classroom_students) {
      const s = cs.student;
      if (!studentMap.has(s.students_id)) {
        studentMap.set(s.students_id, {
          studentId: s.students_id,
          name: `${s.prefix_name ?? ""}${s.firstname} ${s.lastname}`,
        });
      }
    }
  }
  return Array.from(studentMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "th")
  );
}

// GET /api/camps/[id]/sessions/[sessionId] — รายชื่อนักเรียน + สถานะเช็คชื่อ
export async function GET(request, context) {
  const { teacher, error: authError } = await requireTeacher();
  if (authError) return authError;

  try {
    const params = await context.params;
    const campId = Number(params.id);
    const sessionId = Number(params.sessionId);

    if (!(await checkCampAccess(campId, teacher.teachers_id))) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    const students = await getAllStudentsInCamp(campId);

    // ดึง records ของรอบนี้ (image_url เก็บ studentId ไว้)
    const records = await prisma.attendance_record_student.findMany({
      where: { attendance_teacher_session_id: sessionId },
    });

    const checkinMap = new Map(
      records.map((r) => [Number(r.image_url), r])
    );

    const result = students.map((s) => {
      const rec = checkinMap.get(s.studentId);
      return {
        ...s,
        checkedIn: !!rec,
        recordId: rec?.record_id ?? null,
        checkedInAt: rec?.checkin_time ?? null,
      };
    });

    return NextResponse.json({
      sessionId,
      totalStudents: result.length,
      checkedInCount: result.filter((s) => s.checkedIn).length,
      students: result,
    });
  } catch (error) {
    console.error("Session detail GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/camps/[id]/sessions/[sessionId] — toggle เช็คชื่อ
// body: { studentId, checkedIn }
export async function POST(request, context) {
  const { teacher, error: authError } = await requireTeacher();
  if (authError) return authError;

  try {
    const params = await context.params;
    const campId = Number(params.id);
    const sessionId = Number(params.sessionId);
    const { studentId, checkedIn } = await request.json();

    if (!(await checkCampAccess(campId, teacher.teachers_id))) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    if (checkedIn) {
      // เช็คชื่อ: สร้าง record ใหม่ (ถ้ายังไม่มี)
      const existing = await prisma.attendance_record_student.findFirst({
        where: {
          attendance_teacher_session_id: sessionId,
          image_url: String(studentId),
        },
      });
      if (!existing) {
        const rec = await prisma.attendance_record_student.create({
          data: {
            attendance_teacher_session_id: sessionId,
            checkin_time: new Date(),
            image_url: String(studentId), // เก็บ student ID ไว้ใน image_url
          },
        });
        return NextResponse.json({ checkedIn: true, checkedInAt: rec.checkin_time });
      }
      return NextResponse.json({ checkedIn: true, checkedInAt: existing.checkin_time });
    } else {
      // ยกเลิกเช็คชื่อ: ลบ record
      await prisma.attendance_record_student.deleteMany({
        where: {
          attendance_teacher_session_id: sessionId,
          image_url: String(studentId),
        },
      });
      return NextResponse.json({ checkedIn: false });
    }
  } catch (error) {
    console.error("Session checkin POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
