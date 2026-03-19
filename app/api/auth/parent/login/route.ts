import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/auth/parent/login
 * Body: { username: string, password: string }
 * username = รหัสนักเรียน, password = "kks" + รหัสนักเรียน
 */
export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    const studentId = parseInt(username);
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: "รหัสนักเรียนต้องเป็นตัวเลข" },
        { status: 400 }
      );
    }

    // ตรวจสอบรหัสผ่าน: ต้องเป็น "kks" + รหัสนักเรียน
    const expectedPassword = `kks${studentId}`;
    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: "รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // ค้นหานักเรียนพร้อมข้อมูลห้องเรียนและค่าย (ปีการศึกษาล่าสุด)
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
      return NextResponse.json(
        { error: "รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // เตรียม session data
    const sessionData = {
      students_id: student.students_id,
      prefix_name: student.prefix_name,
      firstname: student.firstname,
      lastname: student.lastname,
    };

    const response = NextResponse.json({
      success: true,
      student: sessionData,
    });

    response.cookies.set("parent_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
    });

    return response;
  } catch (error) {
    console.error("Parent login error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 }
    );
  }
}
