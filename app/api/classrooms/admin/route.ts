// @ts-nocheck
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
 * GET - ดึงห้องเรียนที่ถูกลบ (ถังขยะ)
 */
export async function GET(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const skip = (page - 1) * limit;
        const where = { deletedAt: { not: null } };

        const [classrooms, total] = await Promise.all([
            prisma.classrooms.findMany({
                where,
                include: {
                    academic_years: true,
                    teacher: true,
                    classroom_teacher: {
                        include: { teacher: true }
                    },
                    _count: {
                        select: { classroom_students: true }
                    }
                },
                orderBy: { deletedAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.classrooms.count({ where }),
        ]);

        return NextResponse.json({
            data: classrooms,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("API_GET_TRASH_CLASSROOMS_ERROR:", error);
        return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
    }
}

/**
 * PATCH - กู้คืนห้องเรียน
 */
export async function PATCH(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await request.json();
        const id = Number(body.classroom_id);
        if (!id) return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });

        const existing = await prisma.classrooms.findFirst({
            where: { classroom_id: id, deletedAt: { not: null } },
        });
        if (!existing) return NextResponse.json({ error: "ไม่พบห้องเรียนในถังขยะ" }, { status: 404 });

        await prisma.classrooms.update({
            where: { classroom_id: id },
            data: { deletedAt: null },
        });

        return NextResponse.json({ message: "กู้คืนห้องเรียนสำเร็จ" });
    } catch (error) {
        console.error("API_RESTORE_CLASSROOM_ERROR:", error);
        return NextResponse.json({ error: "กู้คืนไม่สำเร็จ" }, { status: 500 });
    }
}

/**
 * DELETE - ลบห้องเรียนถาวร
 */
export async function DELETE(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));
        if (!id) return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });

        const existing = await prisma.classrooms.findFirst({
            where: { classroom_id: id, deletedAt: { not: null } },
        });
        if (!existing) return NextResponse.json({ error: "ไม่พบห้องเรียนในถังขยะ" }, { status: 404 });

        await prisma.$transaction(async (tx) => {
            // 1. ลบความสัมพันธ์ ครูประจำชั้น
            await tx.classroom_teacher.deleteMany({ where: { classroom_classroom_id: id } });

            // 2. ลบเฉพาะความสัมพันธ์นักเรียน-ห้องนี้ (ตัวนักเรียนยังอยู่ในระบบ ไม่ถูกลบ)
            await tx.classroom_students.deleteMany({ where: { classroom_classroom_id: id } });

            // 3. ลบความสัมพันธ์ ค่าย (ถ้ามี)
            await tx.camp_classroom.deleteMany({ where: { classroom_classroom_id: id } });

            // 4. ลบห้องเรียนถาวร
            await tx.classrooms.delete({ where: { classroom_id: id } });
        });

        return NextResponse.json({ message: "ลบห้องเรียนถาวรสำเร็จ" });
    } catch (error) {
        console.error("API_PERMANENT_DELETE_CLASSROOM_ERROR:", error);
        const errorMessage = error.code === 'P2003' 
            ? "ไม่สามารถลบได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง" 
            : "เกิดข้อผิดพลาดภายในระบบ";
        return NextResponse.json({ 
            error: "ลบถาวรไม่สำเร็จ", 
            details: errorMessage 
        }, { status: 500 });
    }
}
