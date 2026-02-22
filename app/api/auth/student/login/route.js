import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/auth/student/login
 * Body: { studentId: number }
 * ค้นหานักเรียนด้วย students_id → set HttpOnly cookie student_session
 */
export async function POST(req) {
    try {
        const { studentId } = await req.json();

        if (!studentId) {
            return NextResponse.json({ error: "กรุณากรอกรหัสนักเรียน" }, { status: 400 });
        }

        const student = await prisma.students.findFirst({
            where: {
                students_id: parseInt(studentId),
                deletedAt: null,
            },
            select: {
                students_id: true,
                firstname: true,
                lastname: true,
                email: true,
            },
        });

        if (!student) {
            return NextResponse.json({ error: "ไม่พบรหัสนักเรียนนี้ในระบบ" }, { status: 404 });
        }

        const sessionData = JSON.stringify(student);

        const response = NextResponse.json({ success: true, student });

        response.cookies.set("student_session", sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 วัน
        });

        return response;
    } catch (error) {
        console.error("Student login error:", error);
        return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
    }
}
