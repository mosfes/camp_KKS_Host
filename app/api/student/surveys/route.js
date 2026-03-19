import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireStudent } from '@/lib/auth';

// GET /api/student/surveys?campId=<id> — ดึงแบบสอบถามเพื่อให้นักเรียนทำ (และเช็คว่าทำไปแล้วหรือยัง)
export async function GET(request) {
  const { student, error } = await requireStudent();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');

    if (!campId) {
      return NextResponse.json({ error: 'campId is required' }, { status: 400 });
    }

    // หาแบบสอบถามของค่ายนี้
    const survey = await prisma.survey.findUnique({
      where: { camp_camp_id: parseInt(campId) },
      include: {
        survey_question: { orderBy: { question_id: 'asc' } },
      },
    });

    if (!survey) {
      return NextResponse.json({ survey: null, isCompleted: false });
    }

    // หา enrollment ของนักเรียนค่ายนี้
    const enrollment = await prisma.student_enrollment.findFirst({
      where: {
        student_students_id: student.students_id,
        camp_camp_id: parseInt(campId),
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled in this camp' }, { status: 403 });
    }

    // เช็คว่าทำแบบสอบถามไปแล้วหรือยัง
    const response = await prisma.survey_response.findUnique({
      where: {
        survey_survey_id_student_enrollment_id: {
          survey_survey_id: survey.survey_id,
          student_enrollment_id: enrollment.student_enrollment_id,
        },
      },
    });

    return NextResponse.json({
      survey,
      isCompleted: !!response,
    });
  } catch (error) {
    console.error('Error fetching student survey:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST /api/student/surveys — ส่งคำตอบแบบสอบถาม
export async function POST(request) {
  const { student, error } = await requireStudent();
  if (error) return error;

  try {
    const body = await request.json();
    const { surveyId, answers, campId } = body; 
    // answers = [{ questionId, textAnswer, scaleValue }]

    if (!surveyId || !answers || !campId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const enrollment = await prisma.student_enrollment.findFirst({
      where: {
        student_students_id: student.students_id,
        camp_camp_id: parseInt(campId),
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    // สร้าง response และ answers ให้ครบใน Transaction
    const result = await prisma.$transaction(async (tx) => {
      const response = await tx.survey_response.create({
        data: {
          survey_survey_id: parseInt(surveyId),
          student_enrollment_id: enrollment.student_enrollment_id,
          survey_answer: {
            create: answers.map((ans) => ({
              question_id: parseInt(ans.questionId),
              text_answer: ans.textAnswer || null,
              scale_value: ans.scaleValue || null,
            })),
          },
        },
      });
      return response;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error submitting survey:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'คุณทำแบบสอบถามนี้ไปแล้ว' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
