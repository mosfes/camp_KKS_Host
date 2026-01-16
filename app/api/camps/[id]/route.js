
import { NextResponse } from "next/server";
import { prisma } from '@/lib/db';

// GET - ดึงข้อมูลค่ายเดียว
export async function GET(request, context) {
    try {
        const params = await context.params;
        const campId = Number(params.id);

        const camp = await prisma.camp.findUnique({
            where: {
                camp_id: campId,
            },
            include: {
                plan_type: true,
                created_by: {
                    select: {
                        firstname: true,
                        lastname: true,
                        email: true,
                    },
                },
                student_enrollment: {
                    include: {
                        student: {
                            select: {
                                students_id: true,
                                firstname: true,
                                lastname: true,
                                email: true,
                            },
                        },
                    },
                },
                teacher_enrollment: {
                    include: {
                        teacher: {
                            select: {
                                teachers_id: true,
                                firstname: true,
                                lastname: true,
                                email: true,
                            },
                        },
                    },
                },
                camp_classroom: {
                    include: {
                        classroom: {
                            include: {
                                academic_years: true,
                            },
                        },
                    },
                },
                camp_template: true,
                // ⭐ เพิ่ม camp_daily_schedule พร้อม time_slots
                camp_daily_schedule: {
                    include: {
                        time_slots: true,
                    },
                    orderBy: {
                        day: 'asc',
                    },
                },
                station: {
                    where: { deletedAt: null }
                },
            },
        });

        if (!camp) {
            return NextResponse.json({ error: "Camp not found" }, { status: 404 });
        }

        return NextResponse.json(camp, { status: 200 });
    } catch (error) {
        console.error("Error fetching camp:", error);
        return NextResponse.json(
            { error: "Failed to fetch camp" },
            { status: 500 }
        );
    }
}


export async function PUT(request, context) {
    const params = await context.params;
    const campId = Number(params.id);
    try {
        // const { id } = await params;
        // const campId = parseInt(id);
        const body = await request.json();

        // อัพเดทข้อมูลค่าย
        const updatedCamp = await prisma.camp.update({
            where: {
                camp_id: campId,
            },
            data: {
                name: body.name,
                location: body.location,
                start_date: body.start_date ? new Date(body.start_date) : undefined,
                end_date: body.end_date ? new Date(body.end_date) : undefined,
                start_regis_date: body.start_regis_date
                    ? new Date(body.start_regis_date)
                    : undefined,
                end_regis_date: body.end_regis_date
                    ? new Date(body.end_regis_date)
                    : undefined,
                start_shirt_date: body.start_shirt_date
                    ? new Date(body.start_shirt_date)
                    : undefined,
                end_shirt_date: body.end_shirt_date
                    ? new Date(body.end_shirt_date)
                    : undefined,
                description: body.description,
                status: body.status || "OPEN",
                has_shirt: body.has_shirt,
            },
        });

        // Delete existing time slots first (foreign key constraint)
        // Find schedules for this camp first
        const schedules = await prisma.camp_daily_schedule.findMany({
            where: { camp_camp_id: campId },
            select: { daily_schedule_id: true }
        });

        const scheduleIds = schedules.map(s => s.daily_schedule_id);

        if (scheduleIds.length > 0) {
            await prisma.camp_time_slot.deleteMany({
                where: { daily_schedule_id: { in: scheduleIds } }
            });
        }

        // Now delete daily schedules
        await prisma.camp_daily_schedule.deleteMany({
            where: { camp_camp_id: campId }
        });

        // เพิ่ม daily schedule ใหม่
        if (body.dailySchedule && body.dailySchedule.length > 0) {
            for (const daySchedule of body.dailySchedule) {
                const createdSchedule = await prisma.camp_daily_schedule.create({
                    data: {
                        camp_camp_id: campId,
                        day: daySchedule.day,
                    }
                });

                // เพิ่ม time slots
                if (daySchedule.timeSlots && daySchedule.timeSlots.length > 0) {
                    for (const timeSlot of daySchedule.timeSlots) {
                        await prisma.camp_time_slot.create({
                            data: {
                                daily_schedule_id: createdSchedule.daily_schedule_id,
                                startTime: timeSlot.startTime,
                                endTime: timeSlot.endTime,
                                activity: timeSlot.activity,
                            }
                        });
                    }
                }
            }
        }

        // อัพเดทห้องเรียน
        if (body.classroom_ids && body.classroom_ids.length > 0) {
            // ลบความสัมพันธ์เก่า
            await prisma.camp_classroom.deleteMany({
                where: { camp_camp_id: campId }
            });

            // เพิ่มความสัมพันธ์ใหม่
            for (const classroomId of body.classroom_ids) {
                await prisma.camp_classroom.create({
                    data: {
                        camp_camp_id: campId,
                        classroom_classroom_id: classroomId,
                    }
                });
            }
        }

        return NextResponse.json(updatedCamp, { status: 200 });
    } catch (error) {
        console.error("Error updating camp:", error);
        return NextResponse.json(
            { error: "Failed to update camp" },
            { status: 500 }
        );
    }
}



export async function DELETE(req, context) {
    try {
        const params = await context.params;
        const campId = Number(params.id);

        if (isNaN(campId)) {
            return NextResponse.json({ error: "Invalid camp id" }, { status: 400 });
        }

        // Soft delete the camp
        await prisma.camp.update({
            where: { camp_id: campId },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ message: "Deleted successfully" });

    } catch (error) {
        console.error("DELETE CAMP ERROR:", error);
        return NextResponse.json(
            { error: "ไม่สามารถลบค่ายได้", detail: error.message },
            { status: 500 }
        );
    }
}
