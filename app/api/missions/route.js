
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const body = await request.json();
        const { title, description, type, instructions, question, choices, questions, stationId } = body;

        // Although title/type etc are important, we might only strictly require stationId.
        // Adjust validation as needed.
        if (!stationId) {
            return NextResponse.json({ error: 'Station ID is required' }, { status: 400 });
        }

        const newMission = await prisma.mission.create({
            data: {
                title,
                description, // keeping description as it maps to "Description" field in UI
                type,
                instructions,
                station_station_id: parseInt(stationId),
            },
        });

        // Handle Question(s) based on type
        if (type === 'QUESTION_ANSWERING') {
            // for QA we stick to single question for now, or use the first one from array
            const qText = question || (questions && questions.length > 0 ? questions[0].text : null);
            if (qText) {
                await prisma.mission_question.create({
                    data: {
                        question_text: qText,
                        question_type: 'TEXT',
                        mission_mission_id: newMission.mission_id
                    }
                });
            }
        } else if (type === 'MULTIPLE_CHOICE_QUIZ') {
            // Support multiple questions from 'questions' array
            // Structure: questions: [{ text, choices: [{ text, isCorrect }] }]
            // Fallback to legacy single question/choices if 'questions' not present (backward compat if needed, but we can just require 'questions' for new UI)

            const questionsToCreate = questions || [];

            // If legacy single question/choices params are sent but 'questions' array is empty, wrap them
            if (questionsToCreate.length === 0 && question && choices) {
                questionsToCreate.push({ text: question, choices: choices });
            }

            if (questionsToCreate.length > 0) {
                for (const q of questionsToCreate) {
                    if (q.text && q.choices && q.choices.length > 0) {
                        await prisma.mission_question.create({
                            data: {
                                question_text: q.text,
                                question_type: 'MCQ',
                                mission_mission_id: newMission.mission_id,
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

        return NextResponse.json(newMission, { status: 201 });
    } catch (error) {
        console.error("Error creating mission:", error);
        return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
    }
}
