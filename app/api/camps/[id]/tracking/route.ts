// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function GET(request, context) {
  const { teacher, error: authError } = await requireTeacher();

  if (authError) return authError;

  try {
    const params = await context.params;
    const campId = Number(params.id);

    // Verify access (basic ownership or enrolled)
    const checkAccess = await prisma.camp.findFirst({
      where: {
        camp_id: campId,
        deletedAt: null,
        OR: [
          { created_by_teacher_id: teacher.teachers_id },
          {
            teacher_enrollment: {
              some: { teacher_teachers_id: teacher.teachers_id },
            },
          },
        ],
      },
    });

    if (!checkAccess) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึงค่ายนี้" },
        { status: 403 },
      );
    }

    // 1. Get total missions for the camp
    const missions = await prisma.mission.findMany({
      where: {
        deletedAt: null,
        station: {
          camp_camp_id: campId,
          deletedAt: null,
        },
      },
      select: { mission_id: true },
    });
    const totalMissions = missions.length;

    // 2. Fetch all students in camp_classrooms
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

    // Deduplicate students
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

    // 3. Get enrollments and mission results (only for students who have actually enrolled)
    const enrollments = await prisma.student_enrollment.findMany({
      where: {
        camp_camp_id: campId,
        enrolled_at: { not: null },
      },
      include: {
        mission_result: {
          where: { status: "completed" },
          select: { mission_result_id: true },
        },
        certificate: {
          select: { certificate_id: true },
        },
      },
    });

    const enrollmentMap = new Map(
      enrollments.map((enr) => [enr.student_students_id, enr]),
    );

    const studentsProgress = [];

    for (const [id, student] of studentMap) {
      const enr = enrollmentMap.get(id);
      const completedMissions = enr ? enr.mission_result.length : 0;
      const progressPercentage =
        totalMissions > 0
          ? Math.round((completedMissions / totalMissions) * 100)
          : 0;

      studentsProgress.push({
        ...student,
        completedMissions,
        totalMissions,
        progressPercentage,
        hasCertificate: enr ? enr.certificate.length > 0 : false,
      });
    }

    // Sort by progress descending, then by name
    studentsProgress.sort((a, b) => {
      if (b.progressPercentage !== a.progressPercentage) {
        return b.progressPercentage - a.progressPercentage;
      }

      return a.name.localeCompare(b.name, "th");
    });

    return NextResponse.json({
      campId,
      totalMissions,
      students: studentsProgress,
    });
  } catch (error) {
    console.error("Tracking API Error:", error);

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 },
    );
  }
}
