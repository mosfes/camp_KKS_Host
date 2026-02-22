import { NextResponse } from "next/server";
import { getTeacherFromRequest } from "@/lib/auth";

/**
 * GET /api/auth/me
 * ดึงข้อมูลครูที่กำลัง login อยู่จาก cookie
 */
export async function GET() {
    const teacher = await getTeacherFromRequest();
    if (!teacher) {
        return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }
    return NextResponse.json(teacher);
}
