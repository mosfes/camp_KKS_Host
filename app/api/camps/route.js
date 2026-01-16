import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST - สร้างค่ายใหม่ พร้อม enroll students และ teachers จาก classrooms (รองรับหลายห้อง)
 */
export async function POST(req) {
    try {
        const body = await req.json();

        // Validation
        if (!body.name || !body.location) {
            return NextResponse.json({ error: "กรุณากรอกชื่อค่ายและสถานที่" }, { status: 400 });
        }

        if (!body.classroom_ids || !Array.isArray(body.classroom_ids) || body.classroom_ids.length === 0) {
            return NextResponse.json({ error: "กรุณาเลือกห้องเรียนอย่างน้อย 1 ห้อง" }, { status: 400 });
        }

        // ตรวจสอบและสร้าง plan_type ถ้ายังไม่มี
        let planTypeNew = await prisma.plan_type.findFirst({
            where: { name: "new" }
        });

        if (!planTypeNew) {
            planTypeNew = await prisma.plan_type.create({
                data: { name: "new" }
            });
        }

        let planTypeContinue = await prisma.plan_type.findFirst({
            where: { name: "continue" }
        });

        if (!planTypeContinue) {
            planTypeContinue = await prisma.plan_type.create({
                data: { name: "continue" }
            });
        }

        // เลือก plan_type_id ตาม projectType
        const planTypeId = body.projectType === "continue"
            ? planTypeContinue.plane_id
            : planTypeNew.plane_id;

        // สร้าง camp
        const newCamp = await prisma.camp.create({
            data: {
                name: body.name,
                location: body.location,
                start_date: new Date(body.campStartDate),
                end_date: new Date(body.campEndDate),
                start_regis_date: new Date(body.registrationStartDate),
                end_regis_date: new Date(body.registrationEndDate),
                description: body.description || "",
                has_shirt: body.hasShirt || false,
                start_shirt_date: body.hasShirt && body.shirtStartDate
                    ? new Date(body.shirtStartDate)
                    : new Date(),
                end_shirt_date: body.hasShirt && body.shirtEndDate
                    ? new Date(body.shirtEndDate)
                    : new Date(),
                status: "OPEN",
                plan_type_plane_id: planTypeId,
                created_by_teacher_id: 1, // TODO: ใช้จาก session เดี๋ยวทำล้อคอินละมาแก้
                camp_daily_schedule: {
                    create: body.dailySchedule.map(day => ({
                        day: day.day,
                        time_slots: {
                            create: day.timeSlots.map(slot => ({
                                startTime: slot.startTime,
                                endTime: slot.endTime,
                                activity: slot.activity
                            }))
                        }
                    }))
                }
            },
        });

        // เชื่อมค่ายกับห้องเรียนทั้งหมด
        for (const classroomId of body.classroom_ids) {
            await prisma.camp_classroom.create({
                data: {
                    camp_camp_id: newCamp.camp_id,
                    classroom_classroom_id: classroomId,
                },
            });

            // Enroll students จากห้องนี้
            const classroomStudents = await prisma.classroom_students.findMany({
                where: { classroom_classroom_id: classroomId },
            });

            for (const cs of classroomStudents) {
                const existingEnrollment = await prisma.student_enrollment.findFirst({
                    where: {
                        student_students_id: cs.student_students_id,
                        camp_camp_id: newCamp.camp_id,
                    },
                });

                if (!existingEnrollment) {
                    await prisma.student_enrollment.create({
                        data: {
                            student_students_id: cs.student_students_id,
                            camp_camp_id: newCamp.camp_id,
                            shirt_size: "M",
                        },
                    });
                }
            }

            // Enroll teachers จากห้องนี้
            const classroomTeachers = await prisma.classroom_teacher.findMany({
                where: { classroom_classroom_id: classroomId },
            });

            for (const ct of classroomTeachers) {
                const existingEnrollment = await prisma.teacher_enrollment.findFirst({
                    where: {
                        teacher_teachers_id: ct.teacher_teachers_id,
                        camp_camp_id: newCamp.camp_id,
                    },
                });

                if (!existingEnrollment) {
                    await prisma.teacher_enrollment.create({
                        data: {
                            teacher_teachers_id: ct.teacher_teachers_id,
                            camp_camp_id: newCamp.camp_id,
                        },
                    });
                }
            }
        }

        // Enroll ครูหัวหน้าค่าย
        const existingHeadTeacher = await prisma.teacher_enrollment.findFirst({
            where: {
                teacher_teachers_id: 1,
                camp_camp_id: newCamp.camp_id,
            },
        });

        if (!existingHeadTeacher) {
            await prisma.teacher_enrollment.create({
                data: {
                    teacher_teachers_id: 1,
                    camp_camp_id: newCamp.camp_id,
                },
            });
        }

        // ถ้ามีการบันทึกเป็น template
        if (body.saveAsTemplate && body.templateName) {
            await prisma.camp_template.create({
                data: {
                    name: body.templateName,
                    camp_camp_id: newCamp.camp_id,
                },
            });
        }

        return NextResponse.json(
            {
                message: "สร้างค่ายสำเร็จ",
                camp: newCamp
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating camp:", error);
        return NextResponse.json(
            {
                error: "สร้างค่ายไม่สำเร็จ",
                details: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * GET - ดึงรายการค่ายทั้งหมด พร้อมจำนวน student_enrollment
 */
export async function GET() {
    try {
        const camps = await prisma.camp.findMany({
            where: { deleted_at: null },
            include: {
                plan_type: true,
                created_by: {
                    select: {
                        firstname: true,
                        lastname: true,
                    },
                },
                _count: {
                    select: {
                        student_enrollment: true,
                        teacher_enrollment: true,
                    }
                },
                camp_classroom: {
                    include: {
                        classroom: {
                            include: {
                                teacher: {
                                    select: {
                                        firstname: true,
                                        lastname: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                camp_id: "desc",
            },
        });

        return NextResponse.json(camps);
    } catch (error) {
        console.error("API_GET_CAMPS_ERROR:", error);
        return NextResponse.json(
            { error: "ไม่สามารถดึงข้อมูลค่ายได้" },
            { status: 500 }
        );
    }
}

