// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

// GET /api/surveys/templates  — ดึงรายการเทมเพลตของครู
export async function GET(request) {
  try {
    const { teacher, error: authError } = await requireTeacher();

    if (authError) return authError;

    const templates = await prisma.survey_template.findMany({
      where: { created_by_teacher_id: teacher.teachers_id },
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
    const { teacher, error: authError } = await requireTeacher();

    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.survey_template.findUnique({
      where: { template_id: parseInt(templateId) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    if (
      existing.created_by_teacher_id !== teacher.teachers_id &&
      teacher.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Unauthorized to delete this template" },
        { status: 403 },
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
