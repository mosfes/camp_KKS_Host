import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/surveys/results?campId=<id>
export async function GET(request) {
  const { teacher, error } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');

    if (!campId) {
      return NextResponse.json({ error: 'campId is required' }, { status: 400 });
    }

    const cId = parseInt(campId);

    // Verify if teacher is the owner of the camp
    const camp = await prisma.camp.findUnique({
      where: { camp_id: cId, deletedAt: null },
      select: { created_by_teacher_id: true }
    });

    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    if (camp.created_by_teacher_id !== teacher.teachers_id) {
       return NextResponse.json({ error: 'Unauthorized to view these results' }, { status: 403 });
    }

    const survey = await prisma.survey.findUnique({
      where: { camp_camp_id: cId },
      include: {
        _count: {
          select: { survey_response: true },
        },
        survey_question: {
          orderBy: { question_id: 'asc' },
          include: {
            survey_answer: true,
          },
        },
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found for this camp' }, { status: 404 });
    }

    const totalResponses = survey._count.survey_response;

    const summaryQuestions = survey.survey_question.map((q) => {
      if (q.question_type === 'scale') {
        const validAnswers = q.survey_answer.filter((a) => a.scale_value !== null);
        const total = validAnswers.length;
        const sum = validAnswers.reduce((acc, a) => acc + (a.scale_value || 0), 0);
        const average = total > 0 ? (sum / total).toFixed(1) : "0.0";
        
        // Distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        validAnswers.forEach((a) => {
          if (a.scale_value && distribution[a.scale_value] !== undefined) {
            distribution[a.scale_value]++;
          }
        });

        return {
          id: q.question_id,
          text: q.question_text,
          type: 'scale',
          average: parseFloat(average),
          total,
          distribution,
        };
      } else {
        // text
        const answers = q.survey_answer
          .filter((a) => a.text_answer && String(a.text_answer).trim() !== '')
          .map((a) => String(a.text_answer).trim());
          
        return {
          id: q.question_id,
          text: q.question_text,
          type: 'text',
          total: answers.length,
          answers,
        };
      }
    });

    const summaryData = {
      surveyId: survey.survey_id,
      title: survey.title,
      totalResponses,
      questions: summaryQuestions,
    };

    return NextResponse.json(summaryData);
  } catch (err) {
    console.error('Error fetching survey results:', err);
    return NextResponse.json({ error: 'Failed to fetch survey results' }, { status: 500 });
  }
}
