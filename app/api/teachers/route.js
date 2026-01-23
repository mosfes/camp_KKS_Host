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

    await prisma.$transaction(async (prisma) => {
        const owningClassroom = await prisma.classrooms.findFirst({
            where: { teachers_teachers_id: id }
        });
        if (owningClassroom) {
            throw new Error('ไม่สามารถลบได้: ครูท่านนี้เป็นครูประจำชั้น (ต้องเปลี่ยนครูประจำชั้นก่อน)');
        }

        const owningCamp = await prisma.camp.findFirst({
            where: { created_by_teacher_id: id }
        });
        if (owningCamp) {
             throw new Error('ไม่สามารถลบได้: ครูท่านนี้เป็นผู้สร้างค่าย (ต้องลบค่ายหรือโอนสิทธิ์ก่อน)');
        }

        await prisma.classroom_teacher.deleteMany({
            where: { teacher_teachers_id: id }
        });

        const enrollments = await prisma.teacher_enrollment.findMany({
            where: { teacher_teachers_id: id },
            select: { teacher_enrollment_id: true }
        });

        if (enrollments.length > 0) {
            const enrollmentIds = enrollments.map(e => e.teacher_enrollment_id);
            
            const attendanceSessions = await prisma.attendance_teachers.findMany({
                where: { teacher_enrollment_teacher_enrollment_id: { in: enrollmentIds } },
                select: { session_id: true }
            });

            if (attendanceSessions.length > 0) {
                const sessionIds = attendanceSessions.map(s => s.session_id);
                await prisma.attendance_record_student.deleteMany({
                    where: { attendance_teacher_session_id: { in: sessionIds } }
                });
                await prisma.attendance_teachers.deleteMany({
                     where: { session_id: { in: sessionIds } }
                });
            }

            await prisma.teacher_enrollment.deleteMany({
                where: { teacher_enrollment_id: { in: enrollmentIds } }
            });
        }

        await prisma.teachers.delete({
            where: { teachers_id: id }
        });
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