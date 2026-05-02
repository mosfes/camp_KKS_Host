// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function POST(req) {
  try {
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const existingTeachers = await prisma.teachers.findMany({
      where: { email: { in: emails } },
      select: { email: true, teachers_id: true, deletedAt: true },
    });

    const existingStudents = await prisma.students.findMany({
      where: { email: { in: emails } },
      select: { email: true, students_id: true, deletedAt: true },
    });

    const combined = [
      ...existingTeachers.map((t) => ({ ...t, type: "teacher" })),
      ...existingStudents.map((s) => ({ ...s, type: "student" })),
    ];

    return NextResponse.json(combined);
  } catch {
    //     console.error("Error checking existing teachers:", error);

    return NextResponse.json(
      { _error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
