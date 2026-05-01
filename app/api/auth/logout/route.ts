// @ts-nocheck
import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * ลบ cookie teacher_session
 */
export async function POST() {
    const response = NextResponse.json({ success: true, message: "ออกจากระบบสำเร็จ" });
    response.cookies.set("teacher_session", "", {
        httpOnly: true,
        path: "/",
        maxAge: 0, // ลบ cookie ทันที
    });
    return response;
}
