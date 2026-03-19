import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * GET /api/auth/parent/me
 * อ่าน parent_session cookie → คืนข้อมูลนักเรียนพร้อมห้องเรียนและค่าย
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("parent_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const studentId = sessionData.students_id;

    const student = await prisma.students.findFirst({
      where: {
        students_id: studentId,
        deletedAt: null,
      },
      select: {
        students_id: true,
        prefix_name: true,
        firstname: true,
        lastname: true,
        classroom_students: {
          orderBy: {
            classroom: {
              academic_years_years_id: "desc",
            },
          },
          take: 1,
          select: {
            classroom: {
              select: {
                classroom_id: true,
                grade: true,
                academic_years_years_id: true,
                classroom_types: {
                  select: { name: true },
                },
                classroom_teacher: {
                  select: {
                    teacher: {
                      select: {
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
        },
        student_enrollment: {
          where: {
            enrolled_at: { not: null },
            camp: { deletedAt: null },
          },
          select: {
            enrolled_at: true,
            shirt_size: true,
            camp: {
              select: {
                camp_id: true,
                name: true,
                start_date: true,
                end_date: true,
                location: true,
                status: true,
                img_camp_url: true,
              },
            },
          },
          orderBy: {
            enrolled_at: "desc",
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักเรียน" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Parent me error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
