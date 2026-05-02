// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

// GET /api/surveys/templates?teacherId=<id>  — ดึงรายการเทมเพลตของครู
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");

    const templates = await prisma.survey_template.findMany({
      where: teacherId
        ? { created_by_teacher_id: parseInt(teacherId) }
        : undefined,
      include: {
        survey_template_question: { orderBy: { question_id: "asc" } },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(templates);
  } catch {
    //     console.error("Error fetching survey templates:", error);

    return NextResponse.json(
      { _error: "Failed to fetch templates" },
      { status: 500 },
    );
  }
}

// DELETE /api/surveys/templates?templateId=<id>
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 },
      );
    }

    await prisma.survey_template.delete({
      where: { template_id: parseInt(templateId) },
    });

    return NextResponse.json({ message: "Template deleted" });
  } catch {
    //     console.error("Error deleting template:", error);

    return NextResponse.json(
      { _error: "Failed to delete template" },
      { status: 500 },
    );
  }
}
