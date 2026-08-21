import { NextResponse } from "next/server";
import { z } from "zod";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

const personnelSchema = z.object({
  prefix_name: z.string().trim().max(50).optional().nullable(),
  firstname: z.string().trim().min(1).max(255),
  lastname: z.string().trim().min(1).max(255),
  position: z.string().trim().min(1).max(500),
  is_active: z.boolean().optional(),
});

export async function GET(request: Request) {
  const { teacher, error } = await requireTeacher();

  if (error) return error;

  const { searchParams } = new URL(request.url);
  const includeInactive =
    teacher.role === "ADMIN" && searchParams.get("includeInactive") === "true";

  const people = await prisma.document_personnel.findMany({
    where: includeInactive ? undefined : { is_active: true },
    orderBy: [
      { is_active: "desc" },
      { position: "asc" },
      { firstname: "asc" },
      { lastname: "asc" },
    ],
  });

  return NextResponse.json(people);
}

export async function POST(request: Request) {
  const { teacher, error } = await requireTeacher();

  if (error) return error;
  if (teacher.role !== "ADMIN") {
    return NextResponse.json(
      { error: "คุณไม่มีสิทธิ์เพิ่มบุคลากร" },
      { status: 403 },
    );
  }

  const parsed = personnelSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const duplicate = await prisma.document_personnel.findFirst({
    where: {
      prefix_name: parsed.data.prefix_name || null,
      firstname: parsed.data.firstname,
      lastname: parsed.data.lastname,
      position: parsed.data.position,
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "มีบุคลากรชื่อและตำแหน่งนี้อยู่แล้ว" },
      { status: 409 },
    );
  }

  const person = await prisma.document_personnel.create({
    data: {
      ...parsed.data,
      prefix_name: parsed.data.prefix_name || null,
      is_active: parsed.data.is_active ?? true,
    },
  });

  return NextResponse.json(person, { status: 201 });
}
