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
        teacher: true,
        classroom_teacher: {
          include: {
            teacher: true
          }
        },
        _count: {
          select: { classroom_students: true }
        }
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
            type_classroom: parseInt(body.type_classroom),
            academic_years_years_id: parseInt(body.academic_year_id)
        }
    });

    if (existing) {
        return NextResponse.json({ error: 'มีห้องเรียนนี้ในปีการศึกษานี้แล้ว' }, { status: 400 });
    }

    if (body.teacher_id_2 && body.teacher_id_2 === body.teacher_id) {
       return NextResponse.json({ error: 'ไม่สามารถเลือกครูประจำชั้นคนที่ 2 ซ้ำกับคนที่ 1 ได้' }, { status: 400 });
    }

    const teacherIdsToCheck = [parseInt(body.teacher_id)];
    if (body.teacher_id_2) {
        teacherIdsToCheck.push(parseInt(body.teacher_id_2));
    }

    const teacherAlreadyAssigned = await prisma.classrooms.findFirst({
        where: {
            academic_years_years_id: parseInt(body.academic_year_id),
            OR: [
                { teachers_teachers_id: { in: teacherIdsToCheck } },
                {
                    classroom_teacher: {
                        some: {
                            teacher_teachers_id: { in: teacherIdsToCheck }
                        }
                    }
                }
            ]
        },
        include: { teacher: true, classroom_teacher: { include: { teacher: true } } }
    });

    if (teacherAlreadyAssigned) {
        return NextResponse.json({ error: 'ครูท่านนี้เป็นที่ปรึกษาในห้องอื่นของปีการศึกษานี้แล้ว ไม่สามารถเลือกซ้ำได้' }, { status: 400 });
    }

    const newClassroom = await prisma.classrooms.create({
      data: {
        grade: body.grade,
        type_classroom: parseInt(body.type_classroom),
        academic_years_years_id: parseInt(body.academic_year_id),
        teachers_teachers_id: parseInt(body.teacher_id)
      }
    });

    if (body.teacher_id_2) {
       await prisma.classroom_teacher.create({
         data: {
           classroom_classroom_id: newClassroom.classroom_id,
           teacher_teachers_id: parseInt(body.teacher_id_2)
         }
       });
    }

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

    await prisma.$transaction(async (prisma) => {
        await prisma.classroom_teacher.deleteMany({
            where: { classroom_classroom_id: id }
        });

        await prisma.classroom_students.deleteMany({
            where: { classroom_classroom_id: id }
        });

        await prisma.camp_classroom.deleteMany({
            where: { classroom_classroom_id: id }
        });

        await prisma.classrooms.delete({
            where: { classroom_id: id }
        });
    });

    return NextResponse.json({ message: 'ลบห้องเรียนสำเร็จ' });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: 'ลบไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const id = parseInt(body.classroom_id);

    if (!id) return NextResponse.json({ error: 'ID ไม่ถูกต้อง' }, { status: 400 });

    // ตรวจสอบข้อมูลซ้ำตอนแก้ไข (กรณีแก้ไขเป็นห้องเรียนที่ซ้ำกับที่มีอยู่แล้วในปีการศึกษานั้น)
    const existing = await prisma.classrooms.findFirst({
        where: {
            grade: body.grade,
            type_classroom: parseInt(body.type_classroom),
            academic_years_years_id: parseInt(body.academic_year_id),
            NOT: {
                classroom_id: id 
            }
        }
    });

    if (existing) {
        return NextResponse.json({ error: 'ข้อมูลซ้ำ: มีห้องเรียนนี้ในปีการศึกษานี้แล้ว' }, { status: 400 });
    }

    if (body.teacher_id_2 && body.teacher_id_2 === body.teacher_id) {
       return NextResponse.json({ error: 'ไม่สามารถเลือกครูประจำชั้นคนที่ 2 ซ้ำกับคนที่ 1 ได้' }, { status: 400 });
    }

    const teacherIdsToCheck = [parseInt(body.teacher_id)];
    if (body.teacher_id_2) {
        teacherIdsToCheck.push(parseInt(body.teacher_id_2));
    }

    const teacherAlreadyAssigned = await prisma.classrooms.findFirst({
        where: {
            academic_years_years_id: parseInt(body.academic_year_id),
            NOT: {
                classroom_id: id 
            },
            OR: [
                { teachers_teachers_id: { in: teacherIdsToCheck } },
                {
                    classroom_teacher: {
                        some: {
                            teacher_teachers_id: { in: teacherIdsToCheck }
                        }
                    }
                }
            ]
        }
    });

    if (teacherAlreadyAssigned) {
        return NextResponse.json({ error: 'ครูท่านนี้เป็นที่ปรึกษาในห้องอื่นของปีการศึกษานี้แล้ว ไม่สามารถเลือกซ้ำได้' }, { status: 400 });
    }

    const updatedClassroom = await prisma.$transaction(async (prisma) => {
        const classroom = await prisma.classrooms.update({
          where: { classroom_id: id },
          data: {
            grade: body.grade,
            type_classroom: parseInt(body.type_classroom),
            academic_years_years_id: parseInt(body.academic_year_id),
            teachers_teachers_id: parseInt(body.teacher_id)
          }
        });

        await prisma.classroom_teacher.deleteMany({
            where: { classroom_classroom_id: id }
        });

        if (body.teacher_id_2) {
            await prisma.classroom_teacher.create({
              data: {
                classroom_classroom_id: id,
                teacher_teachers_id: parseInt(body.teacher_id_2)
              }
            });
        }
        return classroom;
    });

    return NextResponse.json(updatedClassroom);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: 'แก้ไขไม่สำเร็จ' }, { status: 500 });
  }
}