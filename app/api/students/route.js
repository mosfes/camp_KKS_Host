import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const yearId = searchParams.get('yearId');
    const grade = searchParams.get('grade');
    const roomType = searchParams.get('roomType');
    const search = searchParams.get('search');
    const page = searchParams.get('page');
    const limitParams = searchParams.get('limit');

    const whereClause = { deletedAt: null };
    const classroomIncludeClause = {
      orderBy: {
        classroom_students_id: 'desc'
      },
      include: {
        classroom: {
          include: {
            teacher: true,
            academic_years: true
          }
        }
      }
    };

    const classroomConditions = {};
    if (yearId && yearId !== 'all') {
        classroomConditions.academic_years_years_id = parseInt(yearId);
    }
    if (grade && grade !== 'all') {
        classroomConditions.grade = grade;
    }
    if (roomType && roomType !== 'all') {
        classroomConditions.type_classroom = parseInt(roomType);
    }

    if (Object.keys(classroomConditions).length > 0) {
        whereClause.classroom_students = {
            some: {
                classroom: classroomConditions
            }
        };
        classroomIncludeClause.where = {
            classroom: classroomConditions
        };
    }

    if (search) {
        const searchConditions = [
            { firstname: { contains: search } },
            { lastname: { contains: search } }
        ];
        if (/^\d+$/.test(search)) {
            const matchingIds = await prisma.$queryRawUnsafe(
                `SELECT students_id FROM students WHERE CAST(students_id AS CHAR) LIKE ?`,
                `${search}%`
            );
            if (matchingIds.length > 0) {
                searchConditions.push({
                    students_id: { in: matchingIds.map(r => r.students_id) }
                });
            }
        }
        whereClause.OR = searchConditions;
    }

    if (page) {
      const pageNum = parseInt(page) || 1;
      const limit = parseInt(limitParams) || 20;
      const skip = (pageNum - 1) * limit;

      const [students, totalCount] = await Promise.all([
        prisma.students.findMany({
          where: whereClause,
          include: {
            classroom_students: classroomIncludeClause
          },
          orderBy: { students_id: 'asc' },
          skip: skip,
          take: limit
        }),
        prisma.students.count({
          where: whereClause
        })
      ]);

      return NextResponse.json({
        data: students,
        pagination: {
            total: totalCount,
            page: pageNum,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
      });
    }

    const students = await prisma.students.findMany({
      where: whereClause,
      include: {
        classroom_students: classroomIncludeClause
      },
      orderBy: { students_id: 'asc' }
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      try {
        const ids = body.map(item => parseInt(item.students_id));
        const existingStudents = await prisma.students.findMany({
          where: { students_id: { in: ids } },
          select: { students_id: true }
        });
        const existingIds = new Set(existingStudents.map(s => s.students_id));

        const uniqueItems = new Map();
        for (const item of body) {
            const id = parseInt(item.students_id);
            if (!existingIds.has(id) && !Number.isNaN(id)) {
                uniqueItems.set(id, item);
            }
        }

        const studentsToCreate = Array.from(uniqueItems.values());

        if (studentsToCreate.length > 0) {
            const result = await prisma.$transaction(async (prisma) => {
                const studentsData = studentsToCreate.map(item => ({
                    students_id: parseInt(item.students_id),
                    prefix_name: item.prefix_name || null,
                    firstname: item.firstname,
                    lastname: item.lastname,
                    email: item.email || "",
                    tel: item.tel || "",
                }));

                await prisma.students.createMany({
                    data: studentsData,
                    skipDuplicates: true
                });

                const classroomStudentsData = studentsToCreate
                    .filter(item => item.classroom_id)
                    .map(item => ({
                        student_students_id: parseInt(item.students_id),
                        classroom_classroom_id: parseInt(item.classroom_id)
                    }));

                if (classroomStudentsData.length > 0) {
                    await prisma.classroom_students.createMany({
                        data: classroomStudentsData,
                        skipDuplicates: true
                    });
                }
                
                return studentsToCreate;
            }, { timeout: 30000 });
            return NextResponse.json(result, { status: 201 });
        }
        return NextResponse.json([], { status: 201 });
      } catch (e) {
        console.error("Bulk Insert Error:", e);
        return NextResponse.json({ error: 'Bulk insert failed' }, { status: 500 });
      }
    }

    const id = parseInt(body.students_id); 

    const existing = await prisma.students.findUnique({
      where: { students_id: id }
    });

    if (existing) {
      // ถ้านักเรียนถูก soft-delete อยู่ในถังขยะ ให้กู้คืนและอัปเดตข้อมูลใหม่
      if (existing.deletedAt) {
        const result = await prisma.$transaction(async (prisma) => {
          const restored = await prisma.students.update({
            where: { students_id: id },
            data: {
              prefix_name: body.prefix_name || null,
              firstname: body.firstname,
              lastname: body.lastname,
              email: body.email,
              tel: body.tel,
              deletedAt: null, // กู้คืนออกจากถังขยะ
            }
          });

          if (body.classroom_id) {
            // เช็คว่ามีอยู่ในห้องนั้นแล้วหรือเปล่า (กันซ้ำ)
            const alreadyInRoom = await prisma.classroom_students.findFirst({
              where: {
                student_students_id: id,
                classroom_classroom_id: parseInt(body.classroom_id)
              }
            });
            if (!alreadyInRoom) {
              await prisma.classroom_students.create({
                data: {
                  student_students_id: id,
                  classroom_classroom_id: parseInt(body.classroom_id)
                }
              });
            }
          }

          return restored;
        });

        return NextResponse.json(result, { status: 201 });
      }
      return NextResponse.json({ error: 'Student ID already exists' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (prisma) => {
        const newStudent = await prisma.students.create({
            data: {
                students_id: id,
                prefix_name: body.prefix_name || null,
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
    return NextResponse.json({ error: 'Failed to add student' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id'));
    const classroomId = searchParams.get('classroomId') ? parseInt(searchParams.get('classroomId')) : null;

    if (!id) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // ถ้าระบุ classroomId → ลบออกจากห้องเรียนนั้นก่อน
      if (classroomId) {
        await tx.classroom_students.deleteMany({
          where: {
            student_students_id: id,
            classroom_classroom_id: classroomId,
          },
        });
      }

      // Soft-delete ตัวนักเรียน (ย้ายไปที่เก็บถาวร)
      await tx.students.update({
        where: { students_id: id },
        data: { deletedAt: new Date() },
      });
    });

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
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
          prefix_name: body.prefix_name || null,
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
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}