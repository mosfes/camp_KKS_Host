import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

const templateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(500).optional().nullable(),
  template_data: z.record(z.string(), z.unknown()),
});

const reusableKeys = [
  "project_type",
  "standards",
  "strategy",
  "department",
  "rationale",
  "objectives",
  "quantitative_targets",
  "qualitative_targets",
  "procedures",
  "budget_source",
  "budget_total",
  "budget_items",
  "evaluations",
  "expected_results",
  "signatories",
] as const;

function reusableData(source: Record<string, unknown>) {
  return Object.fromEntries(
    reusableKeys
      .filter((key) => source[key] !== undefined)
      .map((key) => [key, source[key]]),
  );
}

export async function GET() {
  const { teacher, error } = await requireTeacher();
  if (error) return error;

  const teacherId = Number(teacher.teachers_id);
  const templates = await prisma.project_document_template.findMany({
    where: { created_by_teacher_id: teacherId },
    orderBy: [{ updated_at: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const { teacher, error } = await requireTeacher();
  if (error) return error;

  const parsed = templateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "ข้อมูลเทมเพลตไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const teacherId = Number(teacher.teachers_id);
  const templateData = JSON.parse(
    JSON.stringify(reusableData(parsed.data.template_data)),
  ) as Prisma.InputJsonValue;
  const template = await prisma.project_document_template.upsert({
    where: {
      created_by_teacher_id_name: {
        created_by_teacher_id: teacherId,
        name: parsed.data.name,
      },
    },
    create: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      template_data: templateData,
      created_by_teacher_id: teacherId,
    },
    update: {
      description: parsed.data.description || null,
      template_data: templateData,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
