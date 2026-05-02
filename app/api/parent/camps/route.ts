export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db";

/**
 * GET /api/parent/camps
 * ดึงค่ายทั้งหมดที่นักเรียน (ลูก) เข้าร่วม – format เดียวกับ /api/student/camps
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("parent_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload: sessionData } = await jwtVerify(
      sessionCookie.value,
      secret,
    );
    const studentId = sessionData.students_id as number;

    // 1. Find classrooms for the student
    const classrooms = await prisma.classrooms.findMany({
      where: {
        classroom_students: {
          some: {
            student_students_id: studentId,
          },
        },
      },
      select: { classroom_id: true },
    });

    const classroomIds = classrooms.map((c) => c.classroom_id);

    if (classroomIds.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Find Camps linked to these classrooms
    const camps = await prisma.camp.findMany({
      where: {
        deletedAt: null,
        camp_classroom: {
          some: {
            classroom_classroom_id: { in: classroomIds },
          },
        },
      },
      include: {
        student_enrollment: true,
        camp_classroom: {
          include: {
            classroom: {
              include: {
                _count: {
                  select: { classroom_students: true },
                },
              },
            },
          },
        },
        station: {
          where: { deletedAt: null },
          include: {
            mission: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: {
        camp_id: "desc",
      },
    });

    // 3. Transform – same shape as student camps
    const now = new Date();
    const parentCamps = camps.map((camp) => {
      const enrollments = camp.student_enrollment;
      const myEnrollment = enrollments.find(
        (e) => e.student_students_id === studentId,
      );

      const isRegistered = !!myEnrollment?.enrolled_at;
      const isEnded = camp.end_date < now;

      const totalCapacity = camp.camp_classroom.reduce(
        (sum, cc) => sum + (cc.classroom?._count?.classroom_students || 0),
        0,
      );
      const totalEnrolled = enrollments.filter((e) => e.enrolled_at).length;

      // Count missions
      const totalMissions =
        camp.station?.reduce((acc, s) => acc + (s.mission?.length || 0), 0) ||
        0;

      return {
        id: camp.camp_id,
        title: camp.name,
        description: camp.description,
        location: camp.location,
        startDate: camp.start_date.toISOString().split("T")[0],
        endDate: camp.end_date.toISOString().split("T")[0],
        isRegistered,
        isEnded,
        rawStartDate: camp.start_date,
        rawEndDate: camp.end_date,
        station: camp.station,
        img_camp_url: camp.img_camp_url,
        totalCapacity,
        totalEnrolled,
        totalMissions,
        shirtSize: myEnrollment?.shirt_size || null,
        startRegisDate: camp.start_regis_date,
        endRegisDate: camp.end_regis_date,
        academicYear:
          camp.camp_classroom[0]?.classroom?.academic_years_years_id,
      };
    });

    return NextResponse.json(parentCamps);
  } catch {
    //     console.error("Parent camps error:", error);

    return NextResponse.json(
      { _error: "Failed to fetch camps" },
      { status: 500 },
    );
  }
}
