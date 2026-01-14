import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const yearId = searchParams.get('yearId');

    const whereClause = {};

    if (yearId && yearId !== 'all') {
      whereClause.academic_years_years_id = parseInt(yearId);
    }

    const classrooms = await prisma.classrooms.findMany({
      where: whereClause,
      include: {
        academic_years: true,
        teacher: true
      },
      orderBy: { grade: 'asc' }
    });
    return NextResponse.json(classrooms);
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return NextResponse.json({ error: 'ดึงข้อมูลห้องเรียนไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    if (!body.grade || !body.type_classroom || !body.academic_year_id || !body.teacher_id) {
        return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const existing = await prisma.classrooms.findFirst({
        where: {
            grade: body.grade,
            type_classroom: body.type_classroom,
            academic_years_years_id: parseInt(body.academic_year_id),
            teachers_teachers_id: parseInt(body.teacher_id)
        }
    });

    if (existing) {
        return NextResponse.json({ error: 'ครูท่านนี้มีรายชื่อในห้องเรียนนี้และปีการศึกษานี้แล้ว' }, { status: 400 });
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

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id'));

    if (!id) return NextResponse.json({ error: 'ID ไม่ถูกต้อง' }, { status: 400 });

    await prisma.classrooms.delete({
      where: { classroom_id: id }
    });

    return NextResponse.json({ message: 'ลบห้องเรียนสำเร็จ' });
  } catch (error) {
    console.error("Delete error:", error);
    if (error.code === 'P2003') {
        return NextResponse.json({ error: 'ไม่สามารถลบได้เนื่องจากมีการใช้งานห้องเรียนนี้อยู่ (เช่น มีนักเรียนในห้อง)' }, { status: 400 });
    }
    return NextResponse.json({ error: 'ลบไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const id = parseInt(body.classroom_id);

    if (!id) return NextResponse.json({ error: 'ID ไม่ถูกต้อง' }, { status: 400 });

    // ตรวจสอบข้อมูลซ้ำตอนแก้ไข (กรณีเปลี่ยนครูเป็นคนที่ซ้ำกับที่มีอยู่แล้วในห้องเดิม)
    const existing = await prisma.classrooms.findFirst({
        where: {
            grade: body.grade,
            type_classroom: body.type_classroom,
            academic_years_years_id: parseInt(body.academic_year_id),
            teachers_teachers_id: parseInt(body.teacher_id),
            NOT: {
                classroom_id: id 
            }
        }
    });

    if (existing) {
        return NextResponse.json({ error: 'ข้อมูลซ้ำ: ครูท่านนี้มีรายชื่อในห้องนี้แล้ว' }, { status: 400 });
    }

    const updatedClassroom = await prisma.classrooms.update({
      where: { classroom_id: id },
      data: {
        grade: body.grade,
        type_classroom: body.type_classroom,
        academic_years_years_id: parseInt(body.academic_year_id),
        teachers_teachers_id: parseInt(body.teacher_id)
      }
    });

    return NextResponse.json(updatedClassroom);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: 'แก้ไขไม่สำเร็จ' }, { status: 500 });
  }
}