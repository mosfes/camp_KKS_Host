// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function GET(request, { params }) {
  const { teacher, error } = await requireTeacher();

  if (error) return error;

  try {
    const p = await params;
    const campId = parseInt(p.id);

    if (isNaN(campId)) {
      return NextResponse.json({ error: "Invalid camp ID" }, { status: 400 });
    }

    // Verify access
    const camp = await prisma.camp.findFirst({
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
          {
            camp_classroom: {
              some: {
                classroom: { teachers_teachers_id: teacher.teachers_id },
              },
            },
          },
          {
            camp_classroom: {
              some: {
                classroom: {
                  classroom_teacher: {
                    some: { teacher_teachers_id: teacher.teachers_id },
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        camp_classroom: true,
      },
    });

    if (!camp && teacher.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized access to this camp" },
        { status: 403 },
      );
    }

    // If Admin but not found in the above query, just fetch the basic camp
    const adminCamp =
      camp ||
      (await prisma.camp.findUnique({
        where: { camp_id: campId },
        include: { camp_classroom: true },
      }));

    if (!adminCamp) {
      return NextResponse.json({ error: "Camp not found" }, { status: 404 });
    }

    // Fetch enrollments that belong to the classrooms assigned to this camp, and ONLY if they actually enrolled
    const enrollments = await prisma.student_enrollment.findMany({
      where: {
        camp_camp_id: campId,
        enrolled_at: { not: null },
      },
      include: {
        student: {
          include: {
            classroom_students: {
              include: {
                classroom: {
                  include: {
                    classroom_types: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        enrolled_at: "asc",
      },
    });

    // Process data
    let totalShirts = 0;
    const sizeSummary = {};
    const students = [];

    const campClassroomIds = adminCamp.camp_classroom.map(
      (cc) => cc.classroom_id,
    );

    for (const enr of enrollments) {
      const size = enr.shirt_size || "รอระบุไซส์";

      if (enr.shirt_size) {
        totalShirts++;
        sizeSummary[size] = (sizeSummary[size] || 0) + 1;
      } else {
        sizeSummary["รอระบุไซส์"] = (sizeSummary["รอระบุไซส์"] || 0) + 1;
      }

      // Find which of the student's classrooms is the one participating in this camp
      let classroomStr = "-";
      const matchedCs = enr.student.classroom_students.find((cs) =>
        campClassroomIds.includes(cs.classroom_classroom_id),
      );

      if (matchedCs && matchedCs.classroom) {
        const gradeStr = String(matchedCs.classroom.grade).replace(
          "Level_",
          "",
        );
        const typeStr = matchedCs.classroom.classroom_types?.name || "";

        classroomStr = `ม.${gradeStr} ห้อง ${typeStr}`.trim();
      }

      students.push({
        enrollmentId: enr.student_enrollment_id,
        studentId: enr.student.students_id,
        name: `${enr.student.prefix_name || ""}${enr.student.firstname} ${enr.student.lastname}`,
        classroom: classroomStr,
        shirtSize: enr.shirt_size || null,
        enrolledAt: enr.enrolled_at,
      });
    }

    return NextResponse.json({
      hasShirt: adminCamp.has_shirt,
      summary: sizeSummary,
      totalShirts,
      totalStudents: students.length,
      students,
    });
  } catch {
    //     console.error("Error fetching shirt tracking data:", error);

    return NextResponse.json(
      { _error: "Failed to fetch shirt tracking data" },
      { status: 500 },
    );
  }
}
