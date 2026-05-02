// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";

export async function POST(req) {
  const { student, error: authError } = await requireStudent();

  if (authError) return authError;

  const studentId = student.students_id;

  try {
    const body = await req.json();
    const { campId, missionId, answers, isDraft } = body;
    const newStatus = isDraft ? "pending" : "completed";

    if (!campId || !missionId || !answers) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Find Student Enrollment
    const enrollment = await prisma.student_enrollment.findFirst({
      where: {
        student_students_id: studentId,
        camp_camp_id: campId,
        enrolled_at: { not: null },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student not enrolled" },
        { status: 403 },
      );
    }

    // 2. Create/Update Result
    let result = await prisma.mission_result.findFirst({
      where: {
        student_enrollment_id: enrollment.student_enrollment_id,
        mission_mission_id: missionId,
      },
    });

    if (!result) {
      result = await prisma.mission_result.create({
        data: {
          method: "Code",
          status: newStatus,
          submitted_at: new Date(Date.now() + 7 * 60 * 60 * 1000), // Thai UTC+7
          student_enrollment_id: enrollment.student_enrollment_id,
          mission_mission_id: missionId,
        },
      });
    } else {
      // Clear existing answers first to avoid duplicates
      const oldAnswers = await prisma.mission_answer.findMany({
        where: { mission_result_mission_result_id: result.mission_result_id },
      });
      const oldAnswerIds = oldAnswers.map((a) => a.answer_id);

      if (oldAnswerIds.length > 0) {
        await prisma.mission_answer_text.deleteMany({
          where: { mission_answer_id: { in: oldAnswerIds } },
        });
        await prisma.mission_answer_mcq.deleteMany({
          where: { mission_answer_id: { in: oldAnswerIds } },
        });
        await prisma.mission_answer_photo.deleteMany({
          where: { mission_answer_id: { in: oldAnswerIds } },
        });
        await prisma.mission_answer.deleteMany({
          where: { mission_result_mission_result_id: result.mission_result_id },
        });
      }

      result = await prisma.mission_result.update({
        where: { mission_result_id: result.mission_result_id },
        data: {
          status: newStatus,
          submitted_at: new Date(Date.now() + 7 * 60 * 60 * 1000),
        },
      });
    }

    // 3. Save Answers (Optimized Batch with $transaction)
    const createAnswers = answers.map((ans) => {
      const answerData = {
        mission_result_mission_result_id: result.mission_result_id,
        mission_question_question_id: ans.questionId,
      };

      if (ans.type === "TEXT") {
        answerData.answer_text = { create: { answer_text: ans.value } };
      } else if (ans.type === "MCQ") {
        answerData.answer_mcq = { create: { question_text: ans.value } };
      } else if (ans.type === "PHOTO") {
        answerData.answer_photo = { create: { img_url: ans.value } };
      }

      return prisma.mission_answer.create({ data: answerData });
    });

    if (createAnswers.length > 0) {
      await prisma.$transaction(createAnswers);
    }

    return NextResponse.json({ success: true });
  } catch {
    //     console.error("Submit error:", error);

    return NextResponse.json({ _error: "Submit failed" }, { status: 500 });
  }
}
