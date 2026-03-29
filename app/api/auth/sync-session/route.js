import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/auth/sync-session?to=/headteacher/dashboard
 * อ่าน Clerk session → หา teacher/student ใน DB → set HttpOnly cookie → redirect
 */
export async function GET(req) {
    const { userId } = await auth();
    const to = new URL(req.url).searchParams.get("to") || "/";

    if (!userId) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    try {
        const user = await currentUser();
        const email = user?.emailAddresses?.[0]?.emailAddress;

        if (!email) {
            return NextResponse.redirect(new URL("/", req.url));
        }
ต
        const response = NextResponse.redirect(new URL(to, req.url));

        // หา teacher
        const teacher = await prisma.teachers.findFirst({
            where: { email, deletedAt: null },
            select: { teachers_id: true, firstname: true, lastname: true, email: true, role: true },
        });

        if (teacher) {
            response.cookies.set("teacher_session", JSON.stringify(teacher), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            });
            return response;
        }

        // หา student
        const student = await prisma.students.findFirst({
            where: { email, deletedAt: null },
            select: { students_id: true, firstname: true, lastname: true, email: true },
        });

        if (student) {
            response.cookies.set("student_session", JSON.stringify(student), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            });
            return response;
        }

        // ไม่พบในระบบ
        return NextResponse.redirect(new URL("/", req.url));
    } catch (error) {
        console.error("sync-session error:", error);
        return NextResponse.redirect(new URL("/", req.url));
    }
}
