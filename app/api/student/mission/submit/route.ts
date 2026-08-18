// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { isBangkokDateBefore } from "@/lib/bangkok-date";
import { getVideoSource, supportedVideoUrlMessage } from "@/lib/video";
import {
  cloudinaryUrlContainsPublicId,
  isCloudinaryPublicId,
  isCloudinaryUploadUrl,
  missionSubmitSchema,
  validationErrorMessage,
} from "@/lib/api-validation";

export async function POST(req) {
  const { student, error: authError } = await requireStudent();

  if (authError) return authError;

  const studentId = student.students_id;

  try {
    const body = await req.json();
    const parsed = missionSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: validationErrorMessage(parsed.error) },
        { status: 400 },
      );
    }

    const { campId, missionId, answers, isDraft } = parsed.data;
    const newStatus = isDraft ? "pending" : "completed";

    const mission = await prisma.mission.findUnique({
      where: { mission_id: missionId },
      select: {
        type: true,
        mission_question: {
          select: {
            question_id: true,
            question_type: true,
            choices: { select: { choice_id: true, choice_text: true } },
          },
        },
        station: {
          select: {
            camp_camp_id: true,
            camp: { select: { start_date: true } },
          },
        },
      },
    });

    if (!mission || mission.station.camp_camp_id !== campId) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (isBangkokDateBefore(new Date(), mission.station.camp.start_date)) {
      return NextResponse.json(
        { error: "ค่ายยังไม่เริ่ม ไม่สามารถทำภารกิจได้" },
        { status: 403 },
      );
    }

    const questionsById = new Map(
      mission.mission_question.map((question) => [question.question_id, question]),
    );
    const submittedQuestionIds = new Set<number>();

    for (const answer of answers) {
      if (submittedQuestionIds.has(answer.questionId)) {
        return NextResponse.json(
          { error: "ส่งคำตอบของคำถามซ้ำกันไม่ได้" },
          { status: 400 },
        );
      }

      submittedQuestionIds.add(answer.questionId);
      const question = questionsById.get(answer.questionId);

      if (!question) {
        return NextResponse.json(
          { error: "คำถามนี้ไม่อยู่ในภารกิจที่กำลังส่ง" },
          { status: 400 },
        );
      }

      if (answer.type !== question.question_type) {
        return NextResponse.json(
          { error: "ชนิดคำตอบไม่ตรงกับคำถาม" },
          { status: 400 },
        );
      }

      const value = answer.value.trim();

      if (!value) {
        return NextResponse.json(
          { error: "คำตอบต้องไม่เป็นค่าว่าง" },
          { status: 400 },
        );
      }

      if (answer.type === "TEXT" && value.length > 10_000) {
        return NextResponse.json(
          { error: "คำตอบข้อความยาวเกินกำหนด" },
          { status: 400 },
        );
      }

      if (answer.type === "MCQ") {
        const choiceIndex = value.charCodeAt(0) - 65;

        if (
          value.length !== 1 ||
          choiceIndex < 0 ||
          choiceIndex >= question.choices.length
        ) {
          return NextResponse.json(
            { error: "ตัวเลือกคำตอบไม่ถูกต้อง" },
            { status: 400 },
          );
        }
      }

      if (answer.type === "PHOTO") {
        const expectedPrefix = `camp-submissions/${campId}/${missionId}/${studentId}`;

        if (
          (answer.publicId &&
            !isCloudinaryPublicId(answer.publicId, expectedPrefix)) ||
          !isCloudinaryUploadUrl(value, expectedPrefix) ||
          (answer.publicId &&
            !cloudinaryUrlContainsPublicId(value, answer.publicId))
        ) {
          return NextResponse.json(
            { error: "รูปคำตอบไม่ถูกต้องหรือไม่ได้มาจากพื้นที่ของนักเรียน" },
            { status: 400 },
          );
        }
      }
    }

    if (!isDraft && answers.length !== mission.mission_question.length) {
      return NextResponse.json(
        { error: "กรุณาตอบคำถามให้ครบก่อนส่งภารกิจ" },
        { status: 400 },
      );
    }

    // A photo mission with one question is a direct submission. It must not
    // be saved as a draft; drafts are only useful when several photo
    // questions can be completed incrementally.
    const photoQuestionCount = mission.mission_question.filter(
      (question) => question.question_type === "PHOTO",
    ).length;

    if (
      mission.type === "PHOTO_SUBMISSION" &&
      photoQuestionCount === 1 &&
      isDraft
    ) {
      return NextResponse.json(
        { error: "ภารกิจนี้ต้องอัปโหลดรูปให้เสร็จแล้วจึงส่งได้" },
        { status: 400 },
      );
    }

    if (mission.type === "VIDEO_SUBMISSION") {
      const invalidVideo = answers.some(
        (answer) =>
          answer.type !== "TEXT" ||
          typeof answer.value !== "string" ||
          !getVideoSource(answer.value),
      );

      if (invalidVideo) {
        return NextResponse.json(
          { error: supportedVideoUrlMessage },
          { status: 400 },
        );
      }
    }

    // 1. Find Student Enrollment
    const enrollment = await prisma.student_enrollment.findFirst({
      where: {
        student_students_id: studentId,
        camp_camp_id: campId,
        enrolled_at: { not: null },
      },
      select: { student_enrollment_id: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student not enrolled" },
        { status: 403 },
      );
    }

    // Lock the enrollment row before reading or writing the result. This
    // serializes submissions for the same student across tabs/processes
    // without requiring a schema change or an in-memory lock.
    const savedResult = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT student_enrollment_id
        FROM student_enrollment
        WHERE student_enrollment_id = ${enrollment.student_enrollment_id}
        FOR UPDATE
      `;

      let result = await tx.mission_result.findFirst({
        where: {
          student_enrollment_id: enrollment.student_enrollment_id,
          mission_mission_id: missionId,
        },
        orderBy: { mission_result_id: "desc" },
      });

      if (result?.status === "completed") {
        const error = new Error("MISSION_ALREADY_COMPLETED");

        error.code = "MISSION_ALREADY_COMPLETED";
        throw error;
      }

      if (!result) {
        result = await tx.mission_result.create({
          data: {
            method: "Code",
            status: newStatus,
            submitted_at: new Date(),
            student_enrollment_id: enrollment.student_enrollment_id,
            mission_mission_id: missionId,
          },
        });
      } else {
        // Clear existing answers first to avoid duplicates. All related
        // changes stay in the same transaction as the result update.
        const oldAnswers = await tx.mission_answer.findMany({
          where: {
            mission_result_mission_result_id: result.mission_result_id,
          },
        });
        const oldAnswerIds = oldAnswers.map((a) => a.answer_id);

        if (oldAnswerIds.length > 0) {
          await tx.mission_answer_text.deleteMany({
            where: { mission_answer_id: { in: oldAnswerIds } },
          });
          await tx.mission_answer_mcq.deleteMany({
            where: { mission_answer_id: { in: oldAnswerIds } },
          });
          await tx.mission_answer_photo.deleteMany({
            where: { mission_answer_id: { in: oldAnswerIds } },
          });
          await tx.mission_answer.deleteMany({
            where: {
              mission_result_mission_result_id: result.mission_result_id,
            },
          });
        }

        result = await tx.mission_result.update({
          where: { mission_result_id: result.mission_result_id },
          data: {
            status: newStatus,
            submitted_at: new Date(),
          },
        });
      }

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

        return tx.mission_answer.create({ data: answerData });
      });

      if (createAnswers.length > 0) {
        await Promise.all(createAnswers);
      }

      return result;
    });

    return NextResponse.json({
      success: true,
      missionId,
      status: newStatus,
      resultId: savedResult.mission_result_id,
    });
  } catch (error) {
    //     console.error("Submit error:", error);

    if (error?.code === "MISSION_ALREADY_COMPLETED") {
      return NextResponse.json(
        { error: "คุณทำภารกิจนี้แล้ว", code: "MISSION_ALREADY_COMPLETED" },
        { status: 409 },
      );
    }

    return NextResponse.json({ _error: "Submit failed" }, { status: 500 });
  }
}
