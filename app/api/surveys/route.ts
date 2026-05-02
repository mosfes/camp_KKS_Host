// @ts-nocheck
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

const surveySchema = z.object({
  campId: z
    .union([z.string(), z.number()])
    .transform((v) => parseInt(v.toString())),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questions: z
    .array(
      z.object({
        text: z.string(),
        type: z.enum(["text", "scale", "header"]),
        scaleMax: z.number().optional(),
      }),
    )
    .optional(),
  saveAsTemplate: z.boolean().optional(),
  templateTitle: z.string().optional(),
});

// GET /api/surveys?campId=<id>
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get("campId");

    if (!campId) {
      return NextResponse.json(
        { error: "campId is required" },
        { status: 400 },
      );
    }

    const survey = await prisma.survey.findUnique({
      where: { camp_camp_id: parseInt(campId) },
      include: {
        survey_question: {
          orderBy: { question_id: "asc" },
        },
        _count: {
          select: { survey_response: true },
        },
      },
    });

    return NextResponse.json(survey);
  } catch {
    //     console.error("Error fetching survey:", error);

    return NextResponse.json(
      { _error: "Failed to fetch survey" },
      { status: 500 },
    );
  }
}

// POST /api/surveys — สร้างแบบสอบถามใหม่สำหรับค่าย
export async function POST(request) {
  try {
    const { teacher, error: authError } = await requireTeacher();

    if (authError) return authError;

    const rawBody = await request.json();

    rawBody.teacherId = teacher.teachers_id; // force teacher id
    const body = surveySchema.parse(rawBody);
    const {
      campId,
      title,
      description,
      questions,
      saveAsTemplate,
      templateTitle,
    } = body;

    // ตรวจสอบว่าค่ายนี้มีแบบสอบถามอยู่แล้วหรือไม่ และเช็ค ownership
    const camp = await prisma.camp.findUnique({
      where: { camp_id: campId },
      include: { survey: true },
    });

    if (!camp)
      return NextResponse.json({ error: "Camp not found" }, { status: 404 });

    if (
      camp.created_by_teacher_id !== teacher.teachers_id &&
      teacher.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Unauthorized to add survey to this camp" },
        { status: 403 },
      );
    }

    if (camp.survey.length > 0) {
      return NextResponse.json(
        { error: "ค่ายนี้มีแบบสอบถามอยู่แล้ว" },
        { status: 409 },
      );
    }

    // สร้างแบบสอบถาม
    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        camp_camp_id: parseInt(campId),
        survey_question: {
          create: (questions || []).map((q) => ({
            question_text: q.text,
            question_type: q.type, // 'text' | 'scale'
            scale_max: q.type === "scale" ? q.scaleMax || 5 : null,
          })),
        },
      },
      include: {
        survey_question: true,
      },
    });

    // บันทึกเป็นเทมเพลตถ้าต้องการ
    if (saveAsTemplate) {
      await prisma.survey_template.create({
        data: {
          title: templateTitle || title,
          description,
          created_by_teacher_id: teacher.teachers_id,
          survey_template_question: {
            create: (questions || []).map((q) => ({
              question_text: q.text,
              question_type: q.type,
              scale_max: q.type === "scale" ? q.scaleMax || 5 : null,
            })),
          },
        },
      });
    }

    return NextResponse.json(survey, { status: 201 });
  } catch {
    //     console.error("Error creating survey:", error);

    return NextResponse.json(
      { _error: "Failed to create survey" },
      { status: 500 },
    );
  }
}

// PUT /api/surveys?campId=<id> — แก้ไขแบบสอบถามเดิม
export async function PUT(request) {
  try {
    const { teacher, error: authError } = await requireTeacher();

    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const rawCampId = searchParams.get("campId");
    const rawBody = await request.json();

    rawBody.campId = rawCampId; // combine for zod

    const body = surveySchema.parse(rawBody);
    const {
      campId: campIdNum,
      title,
      description,
      questions,
      saveAsTemplate,
      templateTitle,
    } = body;

    // เช็คว่ามีอยู่จริงหรือไม่ และเช็ค ownership
    const existing = await prisma.survey.findUnique({
      where: { camp_camp_id: campIdNum },
      include: { survey_question: true, camp: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบแบบสอบถาม" }, { status: 404 });
    }

    if (
      existing.camp.created_by_teacher_id !== teacher.teachers_id &&
      teacher.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Unauthorized to edit this survey" },
        { status: 403 },
      );
    }

    // อัปเดตข้อมูล survey และ questions (ลบของเก่าทิ้ง สร้างใหม่)
    const updatedSurvey = await prisma.$transaction(async (tx) => {
      // ลบข้อมูลที่ผูกอยู่ก่อน (responses, answers, suggestions) เพื่อไม่ให้ติด Foreign Key
      await tx.suggestion_analysis_summary.deleteMany({
        where: { survey_response: { survey_survey_id: existing.survey_id } },
      });
      await tx.survey_answer.deleteMany({
        where: { survey_response: { survey_survey_id: existing.survey_id } },
      });
      await tx.survey_response.deleteMany({
        where: { survey_survey_id: existing.survey_id },
      });

      // 1. ลบคำถามเก่า
      await tx.survey_question.deleteMany({
        where: { survey_survey_id: existing.survey_id },
      });

      // 2. อัปเดตข้อมูลหลัก และสร้างคำถามใหม่
      return tx.survey.update({
        where: { camp_camp_id: campIdNum },
        data: {
          title,
          description,
          survey_question: {
            create: (questions || []).map((q) => ({
              question_text: q.text,
              question_type: q.type,
              scale_max: q.type === "scale" ? q.scaleMax || 5 : null,
            })),
          },
        },
        include: {
          survey_question: true,
        },
      });
    });

    // บันทึกเป็นเทมเพลตถ้าต้องการ
    if (saveAsTemplate) {
      await prisma.survey_template.create({
        data: {
          title: templateTitle || title,
          description,
          created_by_teacher_id: teacher.teachers_id,
          survey_template_question: {
            create: (questions || []).map((q) => ({
              question_text: q.text,
              question_type: q.type,
              scale_max: q.type === "scale" ? q.scaleMax || 5 : null,
            })),
          },
        },
      });
    }

    return NextResponse.json(updatedSurvey, { status: 200 });
  } catch {
    //     console.error("Error updating survey:", error);

    return NextResponse.json(
      { _error: "Failed to update survey" },
      { status: 500 },
    );
  }
}

// DELETE /api/surveys?campId=<id>
export async function DELETE(request) {
  try {
    const { teacher, error: authError } = await requireTeacher();

    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const campId = searchParams.get("campId");

    if (!campId) {
      return NextResponse.json(
        { error: "campId is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.survey.findUnique({
      where: { camp_camp_id: parseInt(campId) },
      include: { camp: true },
    });

    if (!existing)
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });

    if (
      existing.camp.created_by_teacher_id !== teacher.teachers_id &&
      teacher.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Unauthorized to delete this survey" },
        { status: 403 },
      );
    }

    await prisma.survey.delete({
      where: { camp_camp_id: parseInt(campId) },
    });

    return NextResponse.json({ message: "Survey deleted" });
  } catch {
    //     console.error("Error deleting survey:", error);

    return NextResponse.json(
      { _error: "Failed to delete survey" },
      { status: 500 },
    );
  }
}
