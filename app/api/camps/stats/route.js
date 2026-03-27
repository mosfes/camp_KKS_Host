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
        const rawCamps = await prisma.camp.findMany({
            where: { deletedAt: null },
            select: {
                camp_id: true,
                created_by_teacher_id: true,
                teacher_enrollment: { select: { teacher_teachers_id: true } },
                camp_classroom: {
                    select: {
                        classroom: {
                            select: {
                                teachers_teachers_id: true,
                                classroom_teacher: { select: { teacher_teachers_id: true } }
                            }
                        }
                    }
                }
            }
        });

        const allowedCampIds = rawCamps.filter(camp => {
            if (camp.created_by_teacher_id === teacherId) return true;
            if (camp.teacher_enrollment?.some(t => t.teacher_teachers_id === teacherId)) return true;
            let isHomeroom = false;
            camp.camp_classroom?.forEach(cc => {
                if (cc.classroom?.teachers_teachers_id === teacherId) isHomeroom = true;
                if (cc.classroom?.classroom_teacher?.some(ct => ct.teacher_teachers_id === teacherId)) isHomeroom = true;
            });
            return isHomeroom;
        }).map(c => c.camp_id);

        const campFilter = { camp_id: { in: allowedCampIds } };

        // นับจำนวนค่ายทั้งหมดที่ดูแล
        const totalCamps = allowedCampIds.length;

        // นับจำนวนค่ายที่ active (OPEN)
        const activeCamps = await prisma.camp.count({
            where: { camp_id: { in: allowedCampIds }, status: "OPEN" },
        });

        // นับจำนวนนักเรียนทั้งหมดที่ลงทะเบียน (เฉพาะคนที่กดลงทะเบียนแล้ว)
        const totalEnrollments = await prisma.student_enrollment.count({
            where: { 
                camp_camp_id: { in: allowedCampIds },
                enrolled_at: { not: null }
            },
        });

        // นักเรียนที่ไม่ซ้ำกัน (เฉพาะคนที่กดลงทะเบียนแล้ว)
        const uniqueStudents = await prisma.student_enrollment.findMany({
            where: { 
                camp_camp_id: { in: allowedCampIds },
                enrolled_at: { not: null }
            },
            select: { student_students_id: true },
            distinct: ["student_students_id"],
        });

        // ครูที่ไม่ซ้ำกัน
        const uniqueTeachers = await prisma.teacher_enrollment.findMany({
            where: { camp: campFilter },
            select: { teacher_teachers_id: true },
            distinct: ["teacher_teachers_id"],
        });

        // คำนวณความพึงพอใจเฉลี่ย
        const scaleAnswers = await prisma.survey_answer.findMany({
            where: {
                survey_question: {
                    question_type: "scale",
                    survey: { camp: campFilter }
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
            where: { survey: { camp: campFilter } }
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
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, max-age=0'
                }
            }
        );
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}