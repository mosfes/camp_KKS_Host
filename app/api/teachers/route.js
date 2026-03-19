import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page');
    const limitParams = searchParams.get('limit');
    const search = searchParams.get('search');

    const whereClause = { deletedAt: null };
    if (search) {
        whereClause.OR = [
            { firstname: { contains: search } },
            { lastname: { contains: search } },
            { email: { contains: search } }
        ];
    }

    if (page) {
      const pageNum = parseInt(page) || 1;
      const limit = parseInt(limitParams) || 20;
      const skip = (pageNum - 1) * limit;

      const [teachers, totalCount] = await Promise.all([
        prisma.teachers.findMany({
          where: whereClause,
          orderBy: { teachers_id: 'asc' },
          skip: skip,
          take: limit
        }),
        prisma.teachers.count({ where: whereClause })
      ]);

      return NextResponse.json({
        data: teachers,
        pagination: {
            total: totalCount,
            page: pageNum,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
      });
    }

    const teachers = await prisma.teachers.findMany({
      where: whereClause,
      orderBy: { teachers_id: 'asc' }
    });
    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const existing = await prisma.teachers.findFirst({
      where: { email: body.email }
    });

    if (existing) {
      // ถ้าครูถูก soft-delete อยู่ในถังขยะ ให้กู้คืนและอัปเดตข้อมูลใหม่
      if (existing.deletedAt) {
        const restored = await prisma.teachers.update({
          where: { teachers_id: existing.teachers_id },
          data: {
            firstname: body.firstname,
            lastname: body.lastname,
            tel: body.tel,
            role: body.role || 'TEACHER',
            deletedAt: null, // กู้คืนออกจากถังขยะ
          }
        });
        return NextResponse.json(restored, { status: 201 });
      }
      return NextResponse.json({ error: 'อีเมลนี้มีผู้ใช้งานแล้ว' }, { status: 400 });
    }

    const newTeacher = await prisma.teachers.create({
      data: {
        firstname: body.firstname,
        lastname: body.lastname,
        email: body.email,
        tel: body.tel,
        role: body.role || 'TEACHER'
      }
    });

    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: 'เพิ่มข้อมูลครูไม่สำเร็จ' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id'));

    if (!id) {
      return NextResponse.json({ error: 'ID ไม่ถูกต้อง' }, { status: 400 });
    }

    const owningClassroom = await prisma.classrooms.findFirst({
        where: { teachers_teachers_id: id, deletedAt: null }
    });
    if (owningClassroom) {
        return NextResponse.json({ error: 'ไม่สามารถลบได้: ครูท่านนี้เป็นครูประจำชั้น (ต้องเปลี่ยนครูประจำชั้นก่อน)' }, { status: 400 });
    }

    const owningCamp = await prisma.camp.findFirst({
        where: { created_by_teacher_id: id, deletedAt: null }
    });
    if (owningCamp) {
        return NextResponse.json({ error: 'ไม่สามารถลบได้: ครูท่านนี้เป็นผู้สร้างค่าย (ต้องลบค่ายหรือโอนสิทธิ์ก่อน)' }, { status: 400 });
    }

    await prisma.teachers.update({
        where: { teachers_id: id },
        data: { deletedAt: new Date() }
    });

    return NextResponse.json({ message: 'ลบข้อมูลครูสำเร็จ' });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message || 'ลบข้อมูลครูไม่สำเร็จ' }, { status: 400 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const id = parseInt(body.teachers_id);

    if (!id) {
        return NextResponse.json({ error: 'ID ไม่ถูกต้อง' }, { status: 400 });
    }

    const updatedTeacher = await prisma.teachers.update({
      where: { teachers_id: id },
      data: {
        firstname: body.firstname,
        lastname: body.lastname,
        email: body.email,
        tel: body.tel,
        role: body.role
      }
    });

    return NextResponse.json(updatedTeacher);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: 'แก้ไขข้อมูลครูไม่สำเร็จ' }, { status: 500 });
  }
}