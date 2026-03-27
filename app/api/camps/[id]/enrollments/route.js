import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

// GET /api/camps/[id]/enrollments
// คืน: { totalStudents, enrolledCount, enrolled, notEnrolled }
// enrolled   = นักเรียนที่มี student_enrollment record สำหรับค่ายนี้
// notEnrolled = นักเรียนในห้องที่เชื่อมกับค่ายนี้ที่ยังไม่ได้ enroll
export async function GET(request, context) {
  const { teacher, error: authError } = await requireTeacher();
  if (authError) return authError;

  try {
    const params = await context.params;
    const campId = Number(params.id);

    // ตรวจสอบว่าครูมีสิทธิ์เข้าถึงค่ายนี้
    const camp = await prisma.camp.findFirst({
      where: {
        camp_id: campId,
        deletedAt: null,
        OR: [
          { created_by_teacher_id: teacher.teachers_id },
          { teacher_enrollment: { some: { teacher_teachers_id: teacher.teachers_id } } },
          {
            camp_classroom: {
              some: { classroom: { teachers_teachers_id: teacher.teachers_id } }
            }
          },
          {
            camp_classroom: {
              some: {
                classroom: {
                  classroom_teacher: { some: { teacher_teachers_id: teacher.teachers_id } }
                }
              }
            }
          },
        ],
      },
      select: { camp_id: true },
    });

    if (!camp) {
      return NextResponse.json({ error: "ไม่พบค่าย หรือไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    // ดึงนักเรียนทั้งหมดในห้องที่เชื่อมกับค่ายนี้ (distinct)
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

    // รวมนักเรียนทั้งหมด (deduplicate by students_id)
    const studentMap = new Map();
    for (const cc of campClassrooms) {
      for (const cs of cc.classroom.classroom_students) {
        const s = cs.student;
        if (!studentMap.has(s.students_id)) {
          studentMap.set(s.students_id, {
            students_id: s.students_id,
            name: `${s.prefix_name ?? ""}${s.firstname} ${s.lastname}`,
          });
        }
      }
    }

    // ดึง enrollment records ของค่ายนี้
    const enrollments = await prisma.student_enrollment.findMany({
      where: { camp_camp_id: campId },
      select: {
        student_students_id: true,
        enrolled_at: true,
        shirt_size: true,
      },
    });

    const enrolledMap = new Map(
      enrollments.map((e) => [e.student_students_id, e])
    );

    const enrolled = [];
    const notEnrolled = [];

    for (const [id, student] of studentMap) {
      const enr = enrolledMap.get(id);
      if (enr && enr.enrolled_at) {
        enrolled.push({
          ...student,
          enrolled_at: enr.enrolled_at,
          shirt_size: enr.shirt_size,
        });
      } else {
        notEnrolled.push(student);
      }
    }

    enrolled.sort((a, b) => a.name.localeCompare(b.name, "th"));
    notEnrolled.sort((a, b) => a.name.localeCompare(b.name, "th"));

    return NextResponse.json({
      totalStudents: studentMap.size,
      enrolledCount: enrolled.length,
      enrolled,
      notEnrolled,
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
