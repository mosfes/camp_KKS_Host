export const runtime = "nodejs";
// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("student_session");

    if (!session?.value)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload: studentSession } = await jwtVerify(session.value, secret);

    const student = await prisma.students.findUnique({
      where: { students_id: Number(studentSession.students_id) },
      include: { parents: true },
    });

    if (!student)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(student);
  } catch {
    return NextResponse.json(
      { _error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: any) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("student_session");

    if (!session?.value)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload: studentSession } = await jwtVerify(session.value, secret);
    const body = await req.json();

    const updateData: any = {
      chronic_disease: body.chronic_disease || null,
      food_allergy: body.food_allergy || null,
      birthday: body.birthday ? new Date(body.birthday) : null,
      remark: body.remark || null,
      tel: body.student_tel || null,
    };

    // อัปเดตชื่อเล่นถ้ามี
    if (body.nickname !== undefined) {
      updateData.nickname = body.nickname?.trim() || null;
    }

    // อัปเดต profile_image_url ถ้ามี
    if (body.profile_image_url !== undefined) {
      updateData.profile_image_url = body.profile_image_url || null;
    }

    const updatedStudent = await prisma.students.update({
      where: { students_id: Number(studentSession.students_id) },
      data: updateData,
    });

    // Update parent phone if parent exists, if not, create a placeholder record
    if (body.parent_tel) {
      const existingParent = await prisma.parents.findFirst({
        where: { username_student_id: Number(studentSession.students_id) },
      });

      const parentTelDigits = body.parent_tel.replace(/\D/g, "");

      if (existingParent) {
        await prisma.parents.update({
          where: { parents_id: existingParent.parents_id },
          data: { tel: parentTelDigits },
        });
      } else {
        await prisma.parents.create({
          data: {
            firstname: "รอระบุ",
            lastname: "รอระบุ",
            tel: parentTelDigits,
            password: await require("bcryptjs").hash(
              `kks${studentSession.students_id}`,
              10,
            ),
            username_student_id: Number(studentSession.students_id),
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: updatedStudent });
  } catch {
    return NextResponse.json(
      { _error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
