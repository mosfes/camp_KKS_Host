// ==========================================
// app/api/camps/[id]/route.js
// ==========================================
import { NextResponse } from "next/server";
import { prisma } from '@/lib/db';

// GET - ดึงข้อมูลค่ายเดียว
export async function GET(request, { params }) {
    try {
        const campId = parseInt(params.id);

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

// PUT - อัพเดทข้อมูลค่าย
export async function PUT(request, { params }) {
    try {
        const campId = parseInt(params.id);
        const body = await request.json();

        const updatedCamp = await prisma.camp.update({
            where: {
                camp_id: campId,
            },
            data: {
                name: body.name,
                location: body.location,
                start_date: body.start_date ? new Date(body.start_date) : undefined,
                end_date: body.end_date ? new Date(body.end_date) : undefined,
                start_regis_date: body.start_regis_date ? new Date(body.start_regis_date) : undefined,
                end_regis_date: body.end_regis_date ? new Date(body.end_regis_date) : undefined,
                start_shirt_date: body.start_shirt_date ? new Date(body.start_shirt_date) : undefined,
                end_shirt_date: body.end_shirt_date ? new Date(body.end_shirt_date) : undefined,
                description: body.description,
                status: body.status,
                has_shirt: body.has_shirt,
            },
        });

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

        await prisma.$transaction(async (tx) => {

            // 1. time slots (อิง daily_schedule)
            await tx.camp_time_slot.deleteMany({
                where: {
                    daily_schedule: {
                        camp_camp_id: campId
                    }
                }
            });

            // 2. daily schedules
            await tx.camp_daily_schedule.deleteMany({
                where: { camp_camp_id: campId }
            });

            // 3. templates
            await tx.camp_template.deleteMany({
                where: { camp_camp_id: campId }
            });

            // 4. student enrollments
            await tx.student_enrollment.deleteMany({
                where: { camp_camp_id: campId }
            });

            // 5. teacher enrollments
            await tx.teacher_enrollment.deleteMany({
                where: { camp_camp_id: campId }
            });

            // 6. classroom mapping
            await tx.camp_classroom.deleteMany({
                where: { camp_camp_id: campId }
            });

            // 7. attendance teachers
            await tx.attendance_teachers.deleteMany({
                where: { camp_camp_id: campId }
            });

            // 8. stations
            await tx.station.deleteMany({
                where: { camp_camp_id: campId }
            });

            // 9. evaluations
            await tx.evaluation.deleteMany({
                where: { camp_camp_id: campId }
            });

            // 10. finally delete camp
            await tx.camp.delete({
                where: { camp_id: campId }
            });
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


// export async function DELETE(req, { params }) {
//     try {
//         const campId = parseInt(params.id);

//         await prisma.$transaction([
//             // time slots
//             prisma.camp_time_slot.deleteMany({
//                 where: { daily_schedule: { camp_camp_id: campId } }
//             }),

//             prisma.camp_template.deleteMany({
//                 where: { camp_camp_id: campId }
//             }),

//             // daily schedules
//             prisma.camp_daily_schedule.deleteMany({
//                 where: { camp_camp_id: campId }
//             }),

//             // student enrollments
//             prisma.student_enrollment.deleteMany({
//                 where: { camp_camp_id: campId }
//             }),

//             // teacher enrollments
//             prisma.teacher_enrollment.deleteMany({
//                 where: { camp_camp_id: campId }
//             }),

//             // classroom mapping
//             prisma.camp_classroom.deleteMany({
//                 where: { camp_camp_id: campId }
//             }),

//             // attendance
//             prisma.attendance_teachers.deleteMany({
//                 where: { camp_camp_id: campId }
//             }),

//             // stations
//             prisma.station.deleteMany({
//                 where: { camp_camp_id: campId }
//             }),

//             // evaluations
//             prisma.evaluation.deleteMany({
//                 where: { camp_camp_id: campId }
//             }),

//             // finally delete camp
//             prisma.camp.delete({
//                 where: { camp_id: campId }
//             })
//         ]);

//         return NextResponse.json({ success: true });

//     } catch (error) {
//         console.error("DELETE CAMP ERROR:", error);
//         return NextResponse.json({ error: "ไม่สามารถลบค่ายได้" }, { status: 500 });
//     }
// }