// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/auth/login
 * Body: { email: string }
 * ค้นหาครูด้วย email → set HttpOnly cookie → return teacher info
 */
export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "กรุณากรอก Email" }, { status: 400 });
    }

    const teacher = await prisma.teachers.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        deletedAt: null,
      },
      select: {
        teachers_id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "ไม่พบบัญชีครูนี้ในระบบ" }, { status: 404 });
    }

    // สร้าง session payload ด้วย JWT
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const token = await new SignJWT(teacher)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      teacher,
    });

    // Set HttpOnly cookie (7 วัน)
    response.cookies.set("teacher_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
  }
}
