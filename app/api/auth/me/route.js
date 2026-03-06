import { NextResponse } from "next/server";
import { getTeacherFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/auth/me
 * ดึงข้อมูลครูที่ login อยู่ + คำนวณ roles[] จาก DB
 *   - "HEADTEACHER" ถ้าเป็น created_by ของค่ายใดก็ตาม
 *   - "TEACHER"     ถ้ามีใน teacher_enrollment ของค่ายที่ตัวเองไม่ได้สร้าง
 *                   หรือเป็นครูประจำชั้น (classroom_teacher / classrooms.teacher)
 */
export async function GET() {
    const teacher = await getTeacherFromRequest();
    if (!teacher) {
        return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const roles = new Set();

    // เป็นหัวหน้าค่าย (ผู้สร้างค่าย)
    const createdCamp = await prisma.camp.findFirst({
        where: { created_by_teacher_id: teacher.teachers_id, deletedAt: null },
        select: { camp_id: true },
    });
    if (createdCamp) roles.add("HEADTEACHER");

    // เป็นครูประจำชั้น (classroom_teacher หรือ classrooms.teacher)
    const isClassroomTeacher = await prisma.classrooms.findFirst({
        where: {
            deletedAt: null,
            OR: [
                { teachers_teachers_id: teacher.teachers_id },
                { classroom_teacher: { some: { teacher_teachers_id: teacher.teachers_id } } },
            ],
        },
        select: { classroom_id: true },
    });
    if (isClassroomTeacher) roles.add("TEACHER");

    // ถ้าไม่มีบทบาทเลย ใช้ role จาก cookie เป็น fallback
    if (roles.size === 0 && teacher.role) roles.add(teacher.role);

    return NextResponse.json({
        ...teacher,
        roles: [...roles],
    });
}
