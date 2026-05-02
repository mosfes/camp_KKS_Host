// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getTeacherFromRequest } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getTeacherFromRequest();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teacher = await prisma.teachers.findUnique({
      where: { teachers_id: Number(session.teachers_id) },
    });

    if (!teacher)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(teacher);
  } catch {
    //     console.error("Teacher Profile GET Error:", error);

    return NextResponse.json(
      { _error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    const session = await getTeacherFromRequest();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Only allow updating safe fields
    const updateData = {};

    if (body.prefix_name !== undefined)
      updateData.prefix_name = body.prefix_name || null;
    if (body.tel !== undefined)
      updateData.tel = (body.tel || "").replace(/\D/g, "") || "";
    if (body.firstname !== undefined)
      updateData.firstname = body.firstname.trim();
    if (body.lastname !== undefined) updateData.lastname = body.lastname.trim();

    if (updateData.firstname === "")
      return NextResponse.json({ error: "ชื่อต้องไม่ว่าง" }, { status: 400 });
    if (updateData.lastname === "")
      return NextResponse.json(
        { error: "นามสกุลต้องไม่ว่าง" },
        { status: 400 },
      );
    if (
      updateData.tel !== undefined &&
      updateData.tel.length > 0 &&
      updateData.tel.length !== 10
    ) {
      return NextResponse.json(
        { error: "เบอร์โทรต้องเป็น 10 หลัก" },
        { status: 400 },
      );
    }

    const updated = await prisma.teachers.update({
      where: { teachers_id: Number(session.teachers_id) },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    //     console.error("Teacher Profile PUT Error:", error);

    return NextResponse.json(
      { _error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
