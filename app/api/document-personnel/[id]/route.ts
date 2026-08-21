import { NextResponse } from "next/server";
import { z } from "zod";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  prefix_name: z.string().trim().max(50).optional().nullable(),
  firstname: z.string().trim().min(1).max(255).optional(),
  lastname: z.string().trim().min(1).max(255).optional(),
  position: z.string().trim().min(1).max(500).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { teacher, error } = await requireTeacher();

  if (error) return error;
  if (teacher.role !== "ADMIN") {
    return NextResponse.json(
      { error: "คุณไม่มีสิทธิ์แก้ไขบุคลากร" },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const personId = Number(id);
  const parsed = updateSchema.safeParse(await request.json());

  if (!Number.isInteger(personId) || personId <= 0 || !parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const person = await prisma.document_personnel.update({
      where: { document_personnel_id: personId },
      data: parsed.data,
    });

    return NextResponse.json(person);
  } catch {
    return NextResponse.json(
      { error: "ไม่พบบุคลากรที่ต้องการแก้ไข" },
      { status: 404 },
    );
  }
}
