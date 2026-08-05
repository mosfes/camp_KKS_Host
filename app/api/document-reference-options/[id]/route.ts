import { NextResponse } from "next/server";
import { z } from "zod";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  category: z.enum(["STANDARD", "STRATEGY"]).optional(),
  label: z.string().trim().min(1).max(700).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { teacher, error } = await requireTeacher();
  if (error) return error;
  if (teacher.role !== "ADMIN") {
    return NextResponse.json(
      { error: "คุณไม่มีสิทธิ์แก้ไขตัวเลือกเอกสาร" },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const optionId = Number(id);
  const parsed = updateSchema.safeParse(await request.json());
  if (!Number.isInteger(optionId) || !parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const option = await prisma.document_reference_option.update({
      where: { document_reference_option_id: optionId },
      data: parsed.data,
    });
    return NextResponse.json(option);
  } catch {
    return NextResponse.json(
      { error: "ไม่พบรายการหรือมีตัวเลือกซ้ำ" },
      { status: 409 },
    );
  }
}
