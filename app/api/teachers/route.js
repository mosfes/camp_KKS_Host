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