import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const classrooms = await prisma.classrooms.findMany({
      include: {
        academic_years: true,
        teacher: true
      },
      orderBy: { grade: 'asc' }
    });
    return NextResponse.json(classrooms);
  } catch (error) {
    return NextResponse.json({ error: 'ดึงข้อมูลห้องเรียนไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    if (!body.grade || !body.type_classroom || !body.academic_year_id || !body.teacher_id) {
        return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const newClassroom = await prisma.classrooms.create({
      data: {
        grade: body.grade,
        type_classroom: body.type_classroom,
        academic_years_years_id: parseInt(body.academic_year_id),
        teachers_teachers_id: parseInt(body.teacher_id)
      }
    });

    return NextResponse.json(newClassroom, { status: 201 });
  } catch (error) {
    console.error("Error creating classroom:", error);
    return NextResponse.json({ error: 'เพิ่มห้องเรียนไม่สำเร็จ' }, { status: 500 });
  }
}