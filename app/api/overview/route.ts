// @ts-nocheck
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearId = searchParams.get("yearId");
    
    if (!yearId) {
      return NextResponse.json({ error: "Missing yearId" }, { status: 400 });
    }

    const year = parseInt(yearId, 10);

    // 1. Total Teachers (Active)
    const totalTeachers = await prisma.teachers.count({
      where: { deletedAt: null },
    });

    // 2. Total Classrooms (Active & specific year)
    const totalClassrooms = await prisma.classrooms.count({
      where: { 
        deletedAt: null,
        academic_years_years_id: year 
      },
    });

    // 3. Total Students (Active)
    const totalStudents = await prisma.students.count({
      where: { deletedAt: null },
    });

    // 4. Total Camps (Active)
    const totalCamps = await prisma.camp.count({
      where: { deletedAt: null },
    });

    // 5. Students by Grade Level (for specific year)
    const activeClassrooms = await prisma.classrooms.findMany({
      where: {
        deletedAt: null,
        academic_years_years_id: year
      },
      include: {
        classroom_students: true,
      }
    });

    const studentDataObj = {
      "ม.1": 0, "ม.2": 0, "ม.3": 0, "ม.4": 0, "ม.5": 0, "ม.6": 0
    };

    activeClassrooms.forEach(c => {
      let gradeName = "";
      if (c.grade === "Level_1") gradeName = "ม.1";
      else if (c.grade === "Level_2") gradeName = "ม.2";
      else if (c.grade === "Level_3") gradeName = "ม.3";
      else if (c.grade === "Level_4") gradeName = "ม.4";
      else if (c.grade === "Level_5") gradeName = "ม.5";
      else if (c.grade === "Level_6") gradeName = "ม.6";

      if (gradeName) {
        studentDataObj[gradeName] += c.classroom_students.length;
      }
    });

    const studentData = Object.keys(studentDataObj).map(key => ({
      name: key,
      students: studentDataObj[key]
    }));

    // 6. Class Types (for specific year)
    const classroomsWithType = await prisma.classrooms.findMany({
      where: {
        deletedAt: null,
        academic_years_years_id: year
      },
      include: {
        classroom_types: true
      }
    });

    const classTypesObj = {};
    classroomsWithType.forEach(c => {
      if (c.classroom_types && c.classroom_types.name) {
        const typeName = c.classroom_types.name;
        classTypesObj[typeName] = (classTypesObj[typeName] || 0) + 1;
      }
    });

    const typeColors = ["#8e6ba8", "#e07a5f", "#5a9da0", "#f4a261", "#2a9d8f", "#e76f51"];
    let colorIndex = 0;
    const classTypesData = Object.keys(classTypesObj).map(key => {
      const color = typeColors[colorIndex % typeColors.length];
      colorIndex++;
      return {
        name: key,
        value: classTypesObj[key],
        color
      };
    });

    // 7. Teacher Roles
    // get all active teachers and their classrooms for the year to see if they are homeroom teachers
    const activeTeachers = await prisma.teachers.findMany({
      where: { deletedAt: null },
      include: {
        classrooms: {
          where: {
            deletedAt: null,
            academic_years_years_id: year
          }
        }
      }
    });

    let adminCount = 0;
    let homeroomCount = 0;
    let normalTeacherCount = 0;

    activeTeachers.forEach(t => {
      if (t.role === "ADMIN") {
        adminCount++;
      } else {
        if (t.classrooms && t.classrooms.length > 0) {
          homeroomCount++;
        } else {
          normalTeacherCount++;
        }
      }
    });

    const teacherRolesData = [
      { name: "ครูทั่วไป", value: normalTeacherCount, color: "#5d7c6f" },
      { name: "ครูประจำชั้น", value: homeroomCount, color: "#4a90e2" },
      { name: "ผู้ดูแลระบบ", value: adminCount, color: "#8e6ba8" },
    ].filter(r => r.value > 0);

    return NextResponse.json({
      totalTeachers,
      totalClassrooms,
      totalStudents,
      totalCamps,
      studentData,
      classTypesData,
      teacherRolesData
    });

  } catch (error) {
    console.error("Overview API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
