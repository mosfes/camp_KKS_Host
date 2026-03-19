import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET /api/surveys?campId=<id>
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');

    if (!campId) {
      return NextResponse.json({ error: 'campId is required' }, { status: 400 });
    }

    const survey = await prisma.survey.findUnique({
      where: { camp_camp_id: parseInt(campId) },
      include: {
        survey_question: {
          orderBy: { question_id: 'asc' },
        },
        _count: {
          select: { survey_response: true },
        },
      },
    });

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json({ error: 'Failed to fetch survey' }, { status: 500 });
  }
}

// POST /api/surveys — สร้างแบบสอบถามใหม่สำหรับค่าย
export async function POST(request) {
  try {
    const body = await request.json();
    const { campId, title, description, questions, saveAsTemplate, templateTitle, teacherId } = body;

    if (!campId || !title) {
      return NextResponse.json({ error: 'campId and title are required' }, { status: 400 });
    }

    // ตรวจสอบว่าค่ายนี้มีแบบสอบถามอยู่แล้วหรือไม่
    const existing = await prisma.survey.findUnique({
      where: { camp_camp_id: parseInt(campId) },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'ค่ายนี้มีแบบสอบถามอยู่แล้ว' },
        { status: 409 }
      );
    }

    // สร้างแบบสอบถาม
    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        camp_camp_id: parseInt(campId),
        survey_question: {
          create: (questions || []).map((q) => ({
            question_text: q.text,
            question_type: q.type, // 'text' | 'scale'
            scale_max: q.type === 'scale' ? (q.scaleMax || 5) : null,
          })),
        },
      },
      include: {
        survey_question: true,
      },
    });

    // บันทึกเป็นเทมเพลตถ้าต้องการ
    if (saveAsTemplate && teacherId) {
      await prisma.survey_template.create({
        data: {
          title: templateTitle || title,
          description,
          created_by_teacher_id: parseInt(teacherId),
          survey_template_question: {
            create: (questions || []).map((q) => ({
              question_text: q.text,
              question_type: q.type,
              scale_max: q.type === 'scale' ? (q.scaleMax || 5) : null,
            })),
          },
        },
      });
    }

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}

// PUT /api/surveys?campId=<id> — แก้ไขแบบสอบถามเดิม
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');
    const body = await request.json();
    const { title, description, questions, saveAsTemplate, templateTitle, teacherId } = body;

    if (!campId || !title) {
      return NextResponse.json({ error: 'campId and title are required' }, { status: 400 });
    }

    const campIdNum = parseInt(campId);

    // เช็คว่ามีอยู่จริงหรือไม่
    const existing = await prisma.survey.findUnique({
      where: { camp_camp_id: campIdNum },
      include: { survey_question: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบแบบสอบถาม' }, { status: 404 });
    }

    // อัปเดตข้อมูล survey และ questions (ลบของเก่าทิ้ง สร้างใหม่)
    const updatedSurvey = await prisma.$transaction(async (tx) => {
      // 1. ลบคำถามเก่า
      await tx.survey_question.deleteMany({
        where: { survey_survey_id: existing.survey_id },
      });

      // 2. อัปเดตข้อมูลหลัก และสร้างคำถามใหม่
      return tx.survey.update({
        where: { camp_camp_id: campIdNum },
        data: {
          title,
          description,
          survey_question: {
            create: (questions || []).map((q) => ({
              question_text: q.text,
              question_type: q.type,
              scale_max: q.type === 'scale' ? (q.scaleMax || 5) : null,
            })),
          },
        },
        include: {
          survey_question: true,
        },
      });
    });

    // บันทึกเป็นเทมเพลตถ้าต้องการ
    if (saveAsTemplate && teacherId) {
      await prisma.survey_template.create({
        data: {
          title: templateTitle || title,
          description,
          created_by_teacher_id: parseInt(teacherId),
          survey_template_question: {
            create: (questions || []).map((q) => ({
              question_text: q.text,
              question_type: q.type,
              scale_max: q.type === 'scale' ? (q.scaleMax || 5) : null,
            })),
          },
        },
      });
    }

    return NextResponse.json(updatedSurvey, { status: 200 });
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 });
  }
}

// DELETE /api/surveys?campId=<id>
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');

    if (!campId) {
      return NextResponse.json({ error: 'campId is required' }, { status: 400 });
    }

    await prisma.survey.delete({
      where: { camp_camp_id: parseInt(campId) },
    });

    return NextResponse.json({ message: 'Survey deleted' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 });
  }
}
