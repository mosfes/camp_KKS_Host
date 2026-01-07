import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const teachers = await prisma.teachers.findMany({
      orderBy: { teachers_id: 'asc' }
    });
    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json({ error: 'ดึงข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const existing = await prisma.teachers.findFirst({
      where: { email: body.email }
    });

    if (existing) {
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

    await prisma.teachers.delete({
      where: { teachers_id: id }
    });

    return NextResponse.json({ message: 'ลบข้อมูลครูสำเร็จ' });
  } catch (error) {
    console.error("Delete error:", error);
    if (error.code === 'P2003') {
        return NextResponse.json({ error: 'ไม่สามารถลบได้เนื่องจากครูท่านนี้มีข้อมูลเชื่อมโยงกับระบบอื่น (เช่น เป็นครูประจำชั้น)' }, { status: 400 });
    }
    return NextResponse.json({ error: 'ลบข้อมูลครูไม่สำเร็จ' }, { status: 500 });
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