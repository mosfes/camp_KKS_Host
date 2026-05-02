// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const { error: authError } = await requireTeacher();

  if (authError) return authError;

  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { word, is_ai } = body;

    const dataToUpdate = {};

    if (word !== undefined) dataToUpdate.word = word.trim();
    if (is_ai !== undefined) dataToUpdate.is_ai = is_ai;

    const updatedWord = await prisma.vulgar_words.update({
      where: { vulgar_word_id: id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedWord);
  } catch {
    //     console.error("Error updating vulgar word:", error);

    return NextResponse.json(
      { _error: "ไม่สามารถอัปเดตคำหยาบได้" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const { error: authError } = await requireTeacher();

  if (authError) return authError;

  try {
    const id = parseInt(params.id);

    await prisma.vulgar_words.delete({
      where: { vulgar_word_id: id },
    });

    return NextResponse.json({ success: true });
  } catch {
    //     console.error("Error deleting vulgar word:", error);

    return NextResponse.json(
      { _error: "ไม่สามารถลบคำหยาบได้" },
      { status: 500 },
    );
  }
}
