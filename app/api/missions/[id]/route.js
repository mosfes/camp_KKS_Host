
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, description, type, instructions, question, questions } = body;

        const updatedMission = await prisma.mission.update({
            where: { mission_id: parseInt(id) },
            data: {
                title,
                description,
                type,
                instructions
            },
        });

        // Handle Questions Update
        // Strategy: Delete all existing questions and recreation is safest/easiest for multi-question sets
        // especially to handle reordering or removals without complex diffing.

        if (type === 'QUESTION_ANSWERING') {
            // Check if there's a question provided.
            const qText = question || (questions && questions.length > 0 ? questions[0].text : null);

            if (qText) {
                // Delete existing MCQ questions if any (type switch scenario)
                const existingMCQ = await prisma.mission_question.findMany({
                    where: {
                        mission_mission_id: parseInt(id),
                        question_type: 'MCQ'
                    }
                });
                if (existingMCQ.length > 0) {
                    await prisma.mission_question.deleteMany({
                        where: { mission_mission_id: parseInt(id) }
                    });
                }

                // Check for existing TEXT question
                const existingQuestion = await prisma.mission_question.findFirst({
                    where: { mission_mission_id: parseInt(id), question_type: 'TEXT' }
                });

                if (existingQuestion) {
                    await prisma.mission_question.update({
                        where: { question_id: existingQuestion.question_id },
                        data: { question_text: qText }
                    });
                } else {
                    await prisma.mission_question.create({
                        data: {
                            question_text: qText,
                            question_type: 'TEXT',
                            mission_mission_id: parseInt(id)
                        }
                    });
                }
            }
        } else if (type === 'MULTIPLE_CHOICE_QUIZ') {
            if (questions && questions.length > 0) {
                // Delete all existing questions for this mission
                // This automatically cascades choices because of our schema setup (if onDelete Cascade is set)
                // If not set in schema, we need to delete choices first. 
                // Let's assume we need to be safe.

                // Get all question IDs
                const oldQuestions = await prisma.mission_question.findMany({
                    where: { mission_mission_id: parseInt(id) }
                });
                const oldQIds = oldQuestions.map(q => q.question_id);

                // Delete choices for these questions
                await prisma.mission_question_choice.deleteMany({
                    where: { mission_question_question_id: { in: oldQIds } }
                });

                // Delete questions
                await prisma.mission_question.deleteMany({
                    where: { mission_mission_id: parseInt(id) }
                });

                // Create new ones
                for (const q of questions) {
                    if (q.text && q.choices && q.choices.length > 0) {
                        await prisma.mission_question.create({
                            data: {
                                question_text: q.text,
                                question_type: 'MCQ',
                                mission_mission_id: parseInt(id),
                                choices: {
                                    create: q.choices.map((c) => ({
                                        choice_text: c.text,
                                        is_correct: c.isCorrect
                                    }))
                                }
                            }
                        });
                    }
                }
            }
        }

        return NextResponse.json(updatedMission);
    } catch (error) {
        console.error("Error updating mission:", error);
        return NextResponse.json({ error: 'Failed to update mission' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        // Soft delete the mission
        await prisma.mission.update({
            where: { mission_id: parseInt(id) },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ message: 'Mission deleted successfully' });
    } catch (error) {
        console.error("Error deleting mission:", error);
        return NextResponse.json({ error: 'Failed to delete mission' }, { status: 500 });
    }
}
