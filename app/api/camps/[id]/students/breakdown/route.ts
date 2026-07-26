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
    const type = searchParams.get("type"); // "allergy" | "disease" | "remark"

    const params = await context.params;
    const campId = Number(params.id);

    if (isNaN(campId)) {
      return NextResponse.json({ error: "Invalid camp id" }, { status: 400 });
    }

    if (!type || !["allergy", "disease", "remark"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be allergy, disease, or remark" },
        { status: 400 },
      );
    }

    const fieldMap: Record<string, "food_allergy" | "chronic_disease" | "remark"> = {
      allergy: "food_allergy",
      disease: "chronic_disease",
      remark: "remark",
    };

    const field = fieldMap[type];

    const notSignificant = {
      AND: [
        { [field]: { not: null } },
        { [field]: { not: "" } },
        { [field]: { not: "-" } },
        { [field]: { not: "ไม่มี" } },
      ],
    };

    // Fetch all enrollments for this camp that have a non-trivial value
    const enrollments = await prisma.student_enrollment.findMany({
      where: {
        camp_camp_id: campId,
        student: notSignificant,
      },
      select: {
        student: {
          select: {
            students_id: true,
            prefix_name: true,
            firstname: true,
            lastname: true,
            [field]: true,
          },
        },
      },
      orderBy: {
        student: { firstname: "asc" },
      },
    });

    // Group by the field value
    const groupMap = new Map<
      string,
      { text: string; count: number; students: { id: number; name: string }[] }
    >();

    for (const e of enrollments) {
      const raw = (e.student as any)[field] as string | null;
      if (!raw) continue;

      // Normalize: trim, split by common delimiters to handle "โรคA, โรคB"
      const entries = raw
        .split(/[,،、;،\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s !== "-" && s !== "ไม่มี");

      const studentName = `${e.student.prefix_name ?? ""}${e.student.firstname} ${e.student.lastname}`.trim();

      for (const entry of entries) {
        if (!groupMap.has(entry)) {
          groupMap.set(entry, { text: entry, count: 0, students: [] });
        }
        const group = groupMap.get(entry)!;
        group.count += 1;
        group.students.push({ id: e.student.students_id, name: studentName });
      }
    }

    // Sort by count descending
    const groups = Array.from(groupMap.values()).sort(
      (a, b) => b.count - a.count,
    );

    return NextResponse.json({ groups }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch breakdown data" },
      { status: 500 },
    );
  }
}
