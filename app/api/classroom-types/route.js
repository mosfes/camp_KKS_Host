import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const types = await prisma.classroom_types.findMany({
        orderBy: { name: 'asc' }
    });
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, valid_grades } = body;

    const newType = await prisma.classroom_types.create({
      data: {
        name,
        valid_grades
      }
    });

    return NextResponse.json(newType);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.classroom_types.delete({
            where: { classroom_type_id: parseInt(id) }
        });

        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
