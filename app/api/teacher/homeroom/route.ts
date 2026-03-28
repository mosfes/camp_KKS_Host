import { NextResponse } from "next/server";
import { getTeacherFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const teacher = await getTeacherFromRequest();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the active classroom for this teacher
    const classroom = await prisma.classrooms.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { teachers_teachers_id: teacher.teachers_id },
          { classroom_teacher: { some: { teacher_teachers_id: teacher.teachers_id } } },
        ],
      },
      include: {
        classroom_types: true,
        academic_years: true,
        classroom_students: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({
        hasHomeroom: false,
        students: [],
        classroomName: null,
      });
    }

    let gradeStr = classroom.grade?.replace("Level_", "") || "";
    const roomType = classroom.classroom_types?.name || "";
    const classroomName = `ม.${gradeStr} ห้อง ${roomType}`;

    const rawStudents = classroom.classroom_students.map(cs => cs.student);

    const activeStudents = rawStudents.filter(s => !s.deletedAt).map(s => {
      // Determine if they need special care
      const hasAllergy = s.food_allergy && s.food_allergy.trim() !== "" && s.food_allergy.trim() !== "-";
      const hasDisease = s.chronic_disease && s.chronic_disease.trim() !== "" && s.chronic_disease.trim() !== "-";
      const hasRemark = s.remark && s.remark.trim() !== "" && s.remark.trim() !== "-";
      
      const isSpecialCare = hasAllergy || hasDisease || hasRemark;

      return {
        id: s.students_id,
        prefix: s.prefix_name || "",
        firstname: s.firstname,
        lastname: s.lastname,
        foodAllergy: s.food_allergy || "-",
        chronicDisease: s.chronic_disease || "-",
        remark: s.remark || "-",
        isSpecialCare,
      };
    });

    // Sort by integer id
    activeStudents.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    return NextResponse.json({
      hasHomeroom: true,
      classroomName,
      students: activeStudents,
    });
  } catch (error: any) {
    console.error("Failed to fetch homeroom data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
