import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * GET /api/parent/profile
 * ดึงข้อมูล parent ที่ผูกกับ studentId ใน session
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("parent_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const studentId = sessionData.students_id;

    const parent = await prisma.parents.findFirst({
      where: { username_student_id: studentId },
      select: {
        parents_id: true,
        firstname: true,
        lastname: true,
        tel: true,
      },
    });

    return NextResponse.json({ parent, hasProfile: !!parent });
  } catch (error) {
    console.error("Parent profile GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

/**
 * POST /api/parent/profile
 * บันทึกข้อมูลผู้ปกครอง (สร้างใหม่ หรืออัปเดต)
 * Body: { firstname, lastname, tel }
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("parent_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const studentId = sessionData.students_id;

    const body = await req.json();
    const { firstname, lastname, tel } = body;

    // Validate
    if (!firstname?.trim() || !lastname?.trim() || !tel?.trim()) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const telDigits = tel.replace(/\D/g, "");
    if (telDigits.length !== 10) {
      return NextResponse.json(
        { error: "เบอร์โทรต้องมี 10 หลัก" },
        { status: 400 }
      );
    }

    // upsert: ถ้ามีแล้ว update, ถ้ายังไม่มี create
    const existing = await prisma.parents.findFirst({
      where: { username_student_id: studentId },
    });

    let parent;
    if (existing) {
      parent = await prisma.parents.update({
        where: { parents_id: existing.parents_id },
        data: {
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          tel: telDigits,
        },
      });
    } else {
      parent = await prisma.parents.create({
        data: {
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          tel: telDigits,
          password: `kks${studentId}`, // default password
          username_student_id: studentId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      parent: {
        parents_id: parent.parents_id,
        firstname: parent.firstname,
        lastname: parent.lastname,
        tel: parent.tel,
      },
    });
  } catch (error) {
    console.error("Parent profile POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
