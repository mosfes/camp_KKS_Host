// @ts-nocheck

import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, type, question, questions } = body;

    const updatedMission = await prisma.mission.update({
      where: { mission_id: parseInt(id) },
      data: {
        title,
        description,
        type,
      },
    });

    // Handle Questions Update
    // Strategy: Delete all existing questions and recreation is safest/easiest for multi-question sets
    // especially to handle reordering or removals without complex diffing.

    if (type === "QUESTION_ANSWERING") {
      const questionsToUpdate = questions || [];

      if (questionsToUpdate.length === 0 && question) {
        questionsToUpdate.push({ text: question });
      }

      if (questionsToUpdate.length > 0) {
        // Delete existing questions for this mission
        // To be safe, also delete any choices if they existed (e.g. type switch)
        const oldQuestions = await prisma.mission_question.findMany({
          where: { mission_mission_id: parseInt(id) },
        });
        const oldQIds = oldQuestions.map((q) => q.question_id);

        await prisma.mission_question_choice.deleteMany({
          where: { mission_question_question_id: { in: oldQIds } },
        });

        await prisma.mission_question.deleteMany({
          where: { mission_mission_id: parseInt(id) },
        });

        // Create new ones
        for (const q of questionsToUpdate) {
          if (q.text) {
            await prisma.mission_question.create({
              data: {
                question_text: q.text,
                question_type: "TEXT",
                mission_mission_id: parseInt(id),
              },
            });
          }
        }
      }
    } else if (
      type === "MULTIPLE_CHOICE_QUIZ" ||
      type === "PRE_TEST" ||
      type === "POST_TEST"
    ) {
      if (questions && questions.length > 0) {
        // Delete all existing questions for this mission
        // This automatically cascades choices because of our schema setup (if onDelete Cascade is set)
        // If not set in schema, we need to delete choices first.
        // Let's assume we need to be safe.

        // Get all question IDs
        const oldQuestions = await prisma.mission_question.findMany({
          where: { mission_mission_id: parseInt(id) },
        });
        const oldQIds = oldQuestions.map((q) => q.question_id);

        // Delete choices for these questions
        await prisma.mission_question_choice.deleteMany({
          where: { mission_question_question_id: { in: oldQIds } },
        });

        // Delete questions
        await prisma.mission_question.deleteMany({
          where: { mission_mission_id: parseInt(id) },
        });

        // Create new ones
        for (const q of questions) {
          if (q.text && q.choices && q.choices.length > 0) {
            await prisma.mission_question.create({
              data: {
                question_text: q.text,
                question_type: "MCQ",
                mission_mission_id: parseInt(id),
                choices: {
                  create: q.choices.map((c) => ({
                    choice_text: c.text,
                    is_correct: c.isCorrect,
                  })),
                },
              },
            });
          }
        }
      }
    } else if (type === "PHOTO_SUBMISSION") {
      const questionsToUpdate = questions || [];

      if (questionsToUpdate.length === 0 && question) {
        questionsToUpdate.push({ text: question });
      }

      if (questionsToUpdate.length > 0) {
        const oldQuestions = await prisma.mission_question.findMany({
          where: { mission_mission_id: parseInt(id) },
        });
        const oldQIds = oldQuestions.map((q) => q.question_id);

        await prisma.mission_question_choice.deleteMany({
          where: { mission_question_question_id: { in: oldQIds } },
        });

        await prisma.mission_question.deleteMany({
          where: { mission_mission_id: parseInt(id) },
        });

        for (const q of questionsToUpdate) {
          if (q.text) {
            await prisma.$executeRawUnsafe(
              "INSERT INTO mission_question (question_text, question_type, mission_mission_id) VALUES (?, ?, ?)",
              q.text,
              "PHOTO",
              parseInt(id),
            );
          }
        }
      }
    }

    return NextResponse.json(updatedMission);
  } catch {
    //     console.error("Error updating mission:", error);

    return NextResponse.json(
      { _error: "Failed to update mission" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Soft delete the mission
    await prisma.mission.update({
      where: { mission_id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Mission deleted successfully" });
  } catch {
    //     console.error("Error deleting mission:", error);

    return NextResponse.json(
      { _error: "Failed to delete mission" },
      { status: 500 },
    );
  }
}
