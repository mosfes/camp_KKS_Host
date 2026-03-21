// ==========================================
// app/api/camps/stats/route.js
// ==========================================
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function GET(request) {
    // ตรวจสอบ session
    const { teacher, error: authError } = await requireTeacher();
    if (authError) return authError;

    const teacherId = teacher.teachers_id;

    try {
        // นับจำนวนค่ายทั้งหมดที่สร้าง
        const totalCamps = await prisma.camp.count({
            where: { created_by_teacher_id: teacherId, deletedAt: null },
        });

        // นับจำนวนค่ายที่ active (OPEN)
        const activeCamps = await prisma.camp.count({
            where: { created_by_teacher_id: teacherId, status: "OPEN", deletedAt: null },
        });

        // นับจำนวนนักเรียนทั้งหมดที่ลงทะเบียน
        const totalEnrollments = await prisma.student_enrollment.count({
            where: { camp: { created_by_teacher_id: teacherId, deletedAt: null } },
        });

        // นักเรียนที่ไม่ซ้ำกัน
        const uniqueStudents = await prisma.student_enrollment.findMany({
            where: { camp: { created_by_teacher_id: teacherId, deletedAt: null } },
            select: { student_students_id: true },
            distinct: ["student_students_id"],
        });

        // ครูที่ไม่ซ้ำกัน
        const uniqueTeachers = await prisma.teacher_enrollment.findMany({
            where: { camp: { created_by_teacher_id: teacherId, deletedAt: null } },
            select: { teacher_teachers_id: true },
            distinct: ["teacher_teachers_id"],
        });

        // คำนวณความพึงพอใจเฉลี่ย
        const scaleAnswers = await prisma.survey_answer.findMany({
            where: {
                survey_question: {
                    question_type: "scale",
                    survey: { camp: { created_by_teacher_id: teacherId, deletedAt: null } }
                }
            },
            select: {
                scale_value: true,
                survey_question: { select: { scale_max: true } }
            }
        });

        let avgSatisfaction = 0;
        let avgScore = 0;
        if (scaleAnswers.length > 0) {
            const sumPerc = scaleAnswers.reduce((acc, curr) => {
                const max = curr.survey_question.scale_max || 5;
                return acc + (curr.scale_value / max);
            }, 0);
            avgSatisfaction = Math.round((sumPerc / scaleAnswers.length) * 100);
            avgScore = parseFloat(((sumPerc / scaleAnswers.length) * 5).toFixed(1));
        }

        // จำนวนคนทำแบบสอบถาม
        const totalSurveyResponses = await prisma.survey_response.count({
            where: { survey: { camp: { created_by_teacher_id: teacherId, deletedAt: null } } }
        });

        // อัตราการทำแบบสอบถาม
        const surveyResponseRate = totalEnrollments > 0 ? Math.round((totalSurveyResponses / totalEnrollments) * 100) : 0;

        return NextResponse.json(
            {
                totalCamps,
                activeCamps,
                totalEnrollments,
                avgSatisfaction,
                avgScore,
                surveyResponseRate,
                totalStudents: uniqueStudents.length,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}