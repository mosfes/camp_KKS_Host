
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STUDENT_ID = 1;

export async function POST(req) {
    try {
        const body = await req.json();
        const { campId, missionId, answers } = body;
        // answers array: [{ questionId, type: "TEXT"|"MCQ", value: "some text" | "A" }]

        if (!campId || !missionId || !answers) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Find Student Enrollment
        const enrollment = await prisma.student_enrollment.findFirst({
            where: {
                student_students_id: STUDENT_ID,
                camp_camp_id: campId
            }
        });

        if (!enrollment) {
            return NextResponse.json({ error: "Student not enrolled" }, { status: 403 });
        }

        // 2. Create/Update Result
        let result = await prisma.mission_result.findFirst({
            where: {
                student_enrollment_id: enrollment.student_enrollment_id,
                mission_mission_id: missionId
            }
        });

        if (!result) {
            result = await prisma.mission_result.create({
                data: {
                    mothod: "Code",
                    status: "completed",
                    submitted_at: new Date(),
                    student_enrollment_id: enrollment.student_enrollment_id,
                    mission_mission_id: missionId
                }
            });
        } else {
            result = await prisma.mission_result.update({
                where: { mission_result_id: result.mission_result_id },
                data: { status: "completed", submitted_at: new Date() }
            });
        }

        // 3. Save Answers
        for (const ans of answers) {
            // Create mission_answer link
            const missionAnswer = await prisma.mission_answer.create({
                data: {
                    mission_result_mission_result_id: result.mission_result_id,
                    mission_question_question_id: ans.questionId
                }
            });

            // Save specific type based on new schema models
            if (ans.type === "TEXT") {
                await prisma.mission_answer_text.create({
                    data: {
                        mission_answer_id: missionAnswer.answer_id,
                        answer_text: ans.value
                    }
                });
            } else if (ans.type === "MCQ") {
                await prisma.mission_answer_mcq.create({
                    data: {
                        mission_answer_id: missionAnswer.answer_id,
                        question_text: ans.value
                    }
                });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Submit error:", error);
        return NextResponse.json({ error: "Submit failed" }, { status: 500 });
    }
}
