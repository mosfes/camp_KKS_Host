import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const yearId = searchParams.get('yearId');

    const whereClause = {};
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

    if (yearId && yearId !== 'all') {

      whereClause.classroom_students = {
        some: {
          classroom: {
            academic_years_years_id: parseInt(yearId)
          }
        }
      };

      classroomIncludeClause.where = {
        classroom: {
            academic_years_years_id: parseInt(yearId)
        }
      };
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
        // 1. Delete Parents
        await prisma.parents.deleteMany({
            where: { Student_student_id: id }
        });

        // 2. Handle Student Enrollments and related activity data
        const enrollments = await prisma.student_enrollment.findMany({
            where: { student_students_id: id },
            select: { student_enrollment_id: true }
        });

        if (enrollments.length > 0) {
            const enrollmentIds = enrollments.map(e => e.student_enrollment_id);

            // 2.1 Mission Results cascade
            const missionResults = await prisma.mission_result.findMany({
                where: { student_enrollment_id: { in: enrollmentIds } },
                select: { mission_result_id: true }
            });

            if (missionResults.length > 0) {
                const resultIds = missionResults.map(r => r.mission_result_id);
                
                // Find answers
                const answers = await prisma.mission_answer.findMany({
                    where: { mission_result_mission_result_id: { in: resultIds } },
                    select: { answer_id: true }
                });

                if (answers.length > 0) {
                    const answerIds = answers.map(a => a.answer_id);
                    await prisma.mission_answer_mcq.deleteMany({ where: { mission_answer_id: { in: answerIds } } });
                    await prisma.mission_answer_text.deleteMany({ where: { mission_answer_id: { in: answerIds } } });
                    await prisma.mission_answer.deleteMany({ where: { answer_id: { in: answerIds } } });
                }
                
                await prisma.mission_result.deleteMany({ where: { mission_result_id: { in: resultIds } } });
            }

            // 2.2 Evaluation cascade
             const evaluations = await prisma.evaluation.findMany({
                where: { student_enrollment_id: { in: enrollmentIds } },
                select: { evaluation_id: true }
            });

            if (evaluations.length > 0) {
                const evalIds = evaluations.map(e => e.evaluation_id);
                
                // Find eval answers
                const evalAnswers = await prisma.evaluation_answer.findMany({
                    where: { evaluation_evaluation_id: { in: evalIds } },
                    select: { answer_id: true }
                });

                 if (evalAnswers.length > 0) {
                    const evalAnswerIds = evalAnswers.map(a => a.answer_id);
                    await prisma.suggestion_analysis_summary.deleteMany({ where: { evaluation_answer_evaluation_id: { in: evalAnswerIds } } });
                    await prisma.evaluation_answer.deleteMany({ where: { answer_id: { in: evalAnswerIds } } });
                }

                await prisma.evaluation.deleteMany({ where: { evaluation_id: { in: evalIds } } });
            }

            // 2.3 Certificates
            await prisma.certificate.deleteMany({ where: { student_enrollment_id: { in: enrollmentIds } } });

            // 2.4 Delete Enrollments
            await prisma.student_enrollment.deleteMany({ where: { student_enrollment_id: { in: enrollmentIds } } });
        }


        // 3. Delete Classroom Students (already here)
        await prisma.classroom_students.deleteMany({
            where: { student_students_id: id }
        });

        // 4. Delete Student
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
    