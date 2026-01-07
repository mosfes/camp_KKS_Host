// app/api/academic_years/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const years = await prisma.academic_years.findMany({
      orderBy: { year: 'desc' }
    });
    return NextResponse.json(years);
  } catch (error) {
    return NextResponse.json({ error: 'ดึงข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const year = parseInt(body.year);

    const existing = await prisma.academic_years.findFirst({
      where: { year: year }
    });

    if (existing) {
      return NextResponse.json({ error: 'มีปีการศึกษานี้อยู่แล้ว' }, { status: 400 });
    }

    const newYear = await prisma.academic_years.create({
      data: { year: year }
    });

    return NextResponse.json(newYear, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'เพิ่มปีการศึกษาไม่สำเร็จ' }, { status: 500 });
  }
}