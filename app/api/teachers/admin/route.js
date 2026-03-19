import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

async function requireAdmin() {
    const { teacher, error: authError } = await requireTeacher();
    if (authError) return { teacher: null, error: authError };
    if (teacher.role !== "ADMIN") {
        return {
            teacher: null,
            error: NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" }, { status: 403 }),
        };
    }
    return { teacher, error: null };
}

/**
 * GET - ดึงครูที่ถูกลบ (ถังขยะ)
 */
export async function GET(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";

        const skip = (page - 1) * limit;
        const where = { deletedAt: { not: null } };

        if (search) {
            where.OR = [
                { firstname: { contains: search } },
                { lastname: { contains: search } },
                { email: { contains: search } },
            ];
        }

        const [teachers, total] = await Promise.all([
            prisma.teachers.findMany({
                where,
                orderBy: { deletedAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.teachers.count({ where }),
        ]);

        return NextResponse.json({
            data: teachers,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("API_GET_TRASH_TEACHERS_ERROR:", error);
        return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
    }
}

/**
 * PATCH - กู้คืนครู
 */
export async function PATCH(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await request.json();
        const id = Number(body.teachers_id);
        if (!id) return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });

        const existing = await prisma.teachers.findFirst({
            where: { teachers_id: id, deletedAt: { not: null } },
        });
        if (!existing) return NextResponse.json({ error: "ไม่พบครูในถังขยะ" }, { status: 404 });

        await prisma.teachers.update({
            where: { teachers_id: id },
            data: { deletedAt: null },
        });

        return NextResponse.json({ message: "กู้คืนครูสำเร็จ" });
    } catch (error) {
        console.error("API_RESTORE_TEACHER_ERROR:", error);
        return NextResponse.json({ error: "กู้คืนไม่สำเร็จ" }, { status: 500 });
    }
}

/**
 * DELETE - ลบครูถาวร
 */
export async function DELETE(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));
        if (!id) return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });

        const existing = await prisma.teachers.findFirst({
            where: { teachers_id: id, deletedAt: { not: null } },
        });
        if (!existing) return NextResponse.json({ error: "ไม่พบครูในถังขยะ" }, { status: 404 });

        await prisma.$transaction(async (tx) => {
            await tx.classroom_teacher.deleteMany({ where: { teacher_teachers_id: id } });

            const enrollments = await tx.teacher_enrollment.findMany({
                where: { teacher_teachers_id: id },
                select: { teacher_enrollment_id: true },
            });

            if (enrollments.length > 0) {
                const eIds = enrollments.map(e => e.teacher_enrollment_id);

                const sessions = await tx.attendance_teachers.findMany({
                    where: { teacher_enrollment_teacher_enrollment_id: { in: eIds } },
                    select: { session_id: true },
                });
                if (sessions.length > 0) {
                    const sIds = sessions.map(s => s.session_id);
                    await tx.attendance_record_student.deleteMany({
                        where: { attendance_teacher_session_id: { in: sIds } },
                    });
                    await tx.attendance_teachers.deleteMany({
                        where: { session_id: { in: sIds } },
                    });
                }

                await tx.teacher_enrollment.deleteMany({
                    where: { teacher_enrollment_id: { in: eIds } },
                });
            }

            await tx.teachers.delete({ where: { teachers_id: id } });
        });

        return NextResponse.json({ message: "ลบครูถาวรสำเร็จ" });
    } catch (error) {
        console.error("API_PERMANENT_DELETE_TEACHER_ERROR:", error);
        return NextResponse.json({ error: "ลบถาวรไม่สำเร็จ", details: error.message }, { status: 500 });
    }
}
