import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const students = await prisma.students.findMany({
      include: {
        // ดึงข้อมูลห้องเรียนและครูที่เชื่อมโยงอยู่มาด้วย
        classroom_students: {
          include: {
            classroom: {
              include: {
                teacher: true,
                academic_years: true
              }
            }
          }
        }
      },
      orderBy: { students_id: 'asc' }
    });
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: 'ดึงข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const id = parseInt(body.students_id); 

    const existing = await prisma.students.findUnique({
      where: { students_id: id }
    });

    if (existing) {
      return NextResponse.json({ error: 'รหัสนักเรียนนี้มีอยู่แล้ว' }, { status: 400 });
    }


    const result = await prisma.$transaction(async (prisma) => {
        const newStudent = await prisma.students.create({
            data: {
                students_id: id,
                firstname: body.firstname,
                lastname: body.lastname,
                email: body.email,
                tel: body.tel,
            }
        });

        if (body.classroom_id) {
            await prisma.classroom_students.create({
                data: {
                    student_students_id: id,
                    classroom_classroom_id: parseInt(body.classroom_id)
                }
            });
        }
        
        return newStudent;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: 'เพิ่มนักเรียนไม่สำเร็จ' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id'));

    if (!id){
      return NextResponse.json({ error: 'รหัสนักเรียนไม่ถูกต้อง' }, { status: 400 });
    }

    await prisma.$transaction(async (prisma) => {
        await prisma.classroom_students.deleteMany({
            where: { student_students_id: id }
        });

    await prisma.students.delete({
        where: { students_id: id }
    });
    });

    return NextResponse.json({ message: 'ลบนักเรียนสำเร็จ' }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: 'ลบนักเรียนไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const id = parseInt(body.students_id);

    const result = await prisma.$transaction(async (prisma) => {

      const updatedStudent = await prisma.students.update({
        where: { students_id: id },
        data: {
          firstname: body.firstname,
          lastname: body.lastname,
          email: body.email,
          tel: body.tel,
        }
      });

      if (body.classroom_id) {
        await prisma.classroom_students.deleteMany({
            where: { student_students_id: id }
        });
        
        await prisma.classroom_students.create({
            data: {
                student_students_id: id,
                classroom_classroom_id: parseInt(body.classroom_id)
            }
        });
      }

      return updatedStudent;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: 'แก้ไขข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}
    