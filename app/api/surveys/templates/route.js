import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET /api/surveys/templates?teacherId=<id>  — ดึงรายการเทมเพลตของครู
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    const templates = await prisma.survey_template.findMany({
      where: teacherId ? { created_by_teacher_id: parseInt(teacherId) } : undefined,
      include: {
        survey_template_question: { orderBy: { question_id: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching survey templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
