import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireTeacher();

  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";
    const includeSummary = searchParams.get("summary") !== "false";

    const params = await context.params;
    const campId = Number(params.id);

    if (isNaN(campId)) {
      return NextResponse.json({ error: "Invalid camp id" }, { status: 400 });
    }

    // Build base condition for student
    let studentCondition: any = search
      ? {
          OR: [
            { firstname: { contains: search } },
            { lastname: { contains: search } },
            !isNaN(Number(search))
              ? { students_id: Number(search) }
              : undefined,
          ].filter(Boolean) as any,
        }
      : {};

    // Add filter condition if applicable
    const notSignificant = (field: string) => ({
      AND: [
        { [field]: { not: null } },
        { [field]: { not: "" } },
        { [field]: { not: "-" } },
        { [field]: { not: "ไม่มี" } },
      ],
    });

    if (filter === "allergy") {
      const allergyCondition = notSignificant("food_allergy");
      studentCondition = search
        ? { AND: [studentCondition, allergyCondition] }
        : allergyCondition;
    } else if (filter === "disease") {
      const diseaseCondition = notSignificant("chronic_disease");
      studentCondition = search
        ? { AND: [studentCondition, diseaseCondition] }
        : diseaseCondition;
    } else if (filter === "remark") {
      const remarkCondition = notSignificant("remark");
      studentCondition = search
        ? { AND: [studentCondition, remarkCondition] }
        : remarkCondition;
    }

    const whereClause = {
      camp_camp_id: campId,
      ...(Object.keys(studentCondition).length > 0
        ? { student: studentCondition }
        : {}),
    };

    // Run paginated data + count in parallel (not sequential!)
    const [totalRows, students] = await Promise.all([
      prisma.student_enrollment.count({ where: whereClause }),
      prisma.student_enrollment.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          student: {
            select: {
              students_id: true,
              prefix_name: true,
              firstname: true,
              lastname: true,
              food_allergy: true,
              chronic_disease: true,
              remark: true,
              tel: true,
            },
          },
        },
        orderBy: {
          student: { firstname: "asc" },
        },
      }),
    ]);

    // Summary: use DB-level aggregation (COUNT) instead of loading all records
    let summary = null;
    if (includeSummary) {
      const significantWhere = (field: string) => ({
        camp_camp_id: campId,
        student: notSignificant(field),
      });

      const [
        totalStudents,
        allergiesCount,
        chronicDiseasesCount,
        remarksCount,
        allergySamples,
        diseaseSamples,
        remarkSamples,
      ] = await Promise.all([
        prisma.student_enrollment.count({ where: { camp_camp_id: campId } }),
        prisma.student_enrollment.count({ where: significantWhere("food_allergy") }),
        prisma.student_enrollment.count({ where: significantWhere("chronic_disease") }),
        prisma.student_enrollment.count({ where: significantWhere("remark") }),
        // Only fetch 5 samples for display chips — not all records!
        prisma.student_enrollment.findMany({
          where: significantWhere("food_allergy"),
          take: 5,
          select: { student: { select: { students_id: true, food_allergy: true } } },
        }),
        prisma.student_enrollment.findMany({
          where: significantWhere("chronic_disease"),
          take: 5,
          select: { student: { select: { students_id: true, chronic_disease: true } } },
        }),
        prisma.student_enrollment.findMany({
          where: significantWhere("remark"),
          take: 5,
          select: { student: { select: { students_id: true, remark: true } } },
        }),
      ]);

      summary = {
        totalStudents,
        allergiesCount,
        chronicDiseasesCount,
        remarksCount,
        allergies: allergySamples.map((e) => ({
          id: e.student.students_id,
          text: e.student.food_allergy,
        })),
        chronicDiseases: diseaseSamples.map((e) => ({
          id: e.student.students_id,
          text: e.student.chronic_disease,
        })),
        remarks: remarkSamples.map((e) => ({
          id: e.student.students_id,
          text: e.student.remark,
        })),
      };
    }

    return NextResponse.json(
      {
        data: students,
        pagination: {
          totalRows,
          totalPages: Math.ceil(totalRows / limit),
          currentPage: page,
          limit,
        },
        summary,
      },
      {
        status: 200,
        headers: {
          // Cache summary for 30s in browser, 60s in CDN
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { _error: "Failed to fetch student data" },
      { status: 500 },
    );
  }
}
