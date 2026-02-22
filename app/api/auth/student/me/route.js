import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/auth/student/me
 * ดึงข้อมูลนักเรียนที่กำลัง login อยู่จาก cookie
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get("student_session");
        if (!session?.value) {
            return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
        }
        const student = JSON.parse(session.value);
        return NextResponse.json(student);
    } catch {
        return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }
}
