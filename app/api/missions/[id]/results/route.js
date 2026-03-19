import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const missionId = parseInt(params.id);

        if (!missionId) {
            return NextResponse.json({ error: 'Invalid mission ID' }, { status: 400 });
        }

        const results = await prisma.mission_result.findMany({
            where: {
                mission_mission_id: missionId,
                status: 'completed'
            },
            include: {
                student_enrollment: {
                    include: {
                        student: true
                    }
                },
                mission_answer: {
                    include: {
                        mission_question: {
                            include: {
                                choices: true
                            }
                        },
                        answer_text: true,
                        answer_mcq: true,
                        answer_photo: true
                    }
                }
            },
            orderBy: {
                submitted_at: 'desc'
            }
        });

        // Format for frontend
        const formattedResults = results.map(r => ({
            resultId: r.mission_result_id,
            studentId: r.student_enrollment.student.students_id,
            studentName: `${r.student_enrollment.student.prefix_name || ''}${r.student_enrollment.student.firstname} ${r.student_enrollment.student.lastname}`,
            submittedAt: r.submitted_at,
            answers: r.mission_answer.map(ans => {
                let answerText = '-';
                let isCorrect = null;
                const qType = ans.mission_question?.question_type;
                
                if (qType === 'TEXT' && ans.answer_text && ans.answer_text.length > 0) {
                    answerText = ans.answer_text[0].answer_text;
                } else if (qType === 'MCQ' && ans.answer_mcq && ans.answer_mcq.length > 0) {
                    const chosenLetter = ans.answer_mcq[0].question_text; // "A", "B", etc.
                    
                    const choices = ans.mission_question.choices || [];
                    const charCode = chosenLetter.charCodeAt(0) - 65; // 'A' -> 0
                    if (charCode >= 0 && charCode < choices.length) {
                        answerText = `${chosenLetter}. ${choices[charCode].choice_text}`;
                        isCorrect = choices[charCode].is_correct;
                    } else {
                        // In case of older records where full text was saved
                        answerText = chosenLetter;
                        const matchedChoice = choices.find(c => c.choice_text === chosenLetter);
                        if (matchedChoice) {
                            isCorrect = matchedChoice.is_correct;
                        }
                    }
                }

                return {
                    questionId: ans.mission_question_question_id,
                    questionText: ans.mission_question?.question_text,
                    type: qType,
                    answerText: answerText,
                    isCorrect: isCorrect
                };
            })
        }));

        return NextResponse.json(formattedResults);
    } catch (error) {
        console.error("Error fetching mission results:", error);
        return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }
}
