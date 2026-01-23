// ==========================================
// app/api/camps/stats/route.js
// ==========================================
import { NextResponse } from "next/server";
import { prisma } from '@/lib/db';

export async function GET(request) {
    try {
        // TODO: ดึง teacher_id จาก session/auth
        const teacherId = 1;

        // นับจำนวนค่ายทั้งหมดที่สร้าง
        const totalCamps = await prisma.camp.count({
            where: {
                created_by_teacher_id: teacherId,
                deletedAt: null
            },
        });

        // นับจำนวนค่ายที่ active (OPEN)
        const activeCamps = await prisma.camp.count({
            where: {
                created_by_teacher_id: teacherId,
                status: "OPEN",
                deletedAt: null
            },
        });

        // นับจำนวนนักเรียนทั้งหมดที่ลงทะเบียน
        const totalEnrollments = await prisma.student_enrollment.count({
            where: {
                camp: {
                    created_by_teacher_id: teacherId,
                    deletedAt: null
                },
            },
        });

        // นับจำนวนนักเรียนที่ไม่ซ้ำกัน
        const uniqueStudents = await prisma.student_enrollment.findMany({
            where: {
                camp: {
                    created_by_teacher_id: teacherId,
                    deletedAt: null
                },
            },
            select: {
                student_students_id: true,
            },
            distinct: ["student_students_id"],
        });

        const uniqueTeachers = await prisma.teacher_enrollment.findMany({
            where: {
                camp: {
                    created_by_teacher_id: teacherId,
                    deletedAt: null
                },
            },
            select: {
                teacher_teachers_id: true,
            },
            distinct: ["teacher_teachers_id"],
        });

        const totalTeachers = uniqueTeachers.length;

        // คำนวณค่าเฉลี่ยการลงทะเบียนต่อค่าย
        const avgEnrollment =
            totalCamps > 0 ? Math.round(totalEnrollments / totalCamps) : 0;

        return NextResponse.json(
            {
                totalCamps,
                activeCamps,
                totalStudents: uniqueStudents.length,
                totalTeachers: uniqueTeachers.length,
                totalEnrollments,
                avgEnrollment,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}