import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";

export async function GET() {
    const { student, error: authError } = await requireStudent();
    if (authError) return authError;

    const studentId = student.students_id;

    try {
        // 1. Find classrooms for the student
        const classrooms = await prisma.classrooms.findMany({
            where: {
                classroom_students: {
                    some: {
                        student_students_id: studentId
                    }
                }
            },
            select: { classroom_id: true }
        });

        let classroomIds = classrooms.map(c => c.classroom_id);

        // Fallback: หากยังไม่ได้ link ห้องเรียนใน DB (สำหรับ Demo) ให้หาตาม Grade 4 (Level_4) เหมือนเดิม
        if (classroomIds.length === 0) {
            const demoClassrooms = await prisma.classrooms.findMany({
                where: { grade: "Level_4" },
                select: { classroom_id: true }
            });
            classroomIds = demoClassrooms.map(c => c.classroom_id);
        }

        // 2. Find Camps linked to these classrooms (รวมทั้งที่จบแล้วด้วย)
        const camps = await prisma.camp.findMany({
            where: {
                deletedAt: null,
                camp_classroom: {
                    some: {
                        classroom_classroom_id: { in: classroomIds }
                    }
                }
            },
            include: {
                student_enrollment: {
                    where: {
                        student_students_id: studentId
                    },
                    include: {
                        mission_result: {
                            include: {
                                mission: true,
                                mission_answer: {
                                    include: {
                                        answer_text: true,
                                        answer_mcq: true
                                    }
                                }
                            }
                        }
                    }
                },
                camp_daily_schedule: true,
                station: {
                    where: { deletedAt: null },
                    include: {
                        mission: {
                            where: { deletedAt: null },
                            include: {
                                mission_question: {
                                    include: { choices: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                start_date: 'asc'
            }
        });

        // 3. Transform data for frontend
        const now = new Date();
        const studentCamps = camps.map(camp => {
            const enrollment = camp.student_enrollment.length > 0 ? camp.student_enrollment[0] : null;
            const isRegistered = !!enrollment?.enrolled_at;
            const isEnded = camp.end_date < now;

            return {
                id: camp.camp_id,
                title: camp.name,
                description: camp.description,
                location: camp.location,
                startDate: camp.start_date.toISOString().split('T')[0],
                endDate: camp.end_date.toISOString().split('T')[0],
                status: isRegistered ? "Registered" : "Available",
                isRegistered: isRegistered,
                isEnded: isEnded,
                shirtSize: enrollment?.shirt_size || null,
                hasShirt: camp.has_shirt,
                startShirtDate: camp.start_shirt_date,
                endShirtDate: camp.end_shirt_date,
                rawStartDate: camp.start_date,
                rawEndDate: camp.end_date,
                missionResults: enrollment?.mission_result || [],
                station: camp.station
            };
        });

        return NextResponse.json(studentCamps);

    } catch (error) {
        console.error("Error fetching student camps:", error);
        return NextResponse.json(
            { error: "Failed to fetch camps" },
            { status: 500 }
        );
    }
}
