import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { teacher, error } = await requireTeacher();

  if (error) return error;
  const { id } = await context.params;
  const templateId = Number(id);
  const teacherId = Number(teacher.teachers_id);

  const deleted = await prisma.project_document_template.deleteMany({
    where: {
      project_document_template_id: templateId,
      created_by_teacher_id: teacherId,
    },
  });

  if (!deleted.count) {
    return NextResponse.json({ error: "ไม่พบเทมเพลต" }, { status: 404 });
  }

  return NextResponse.json({ message: "ลบเทมเพลตแล้ว" });
}
