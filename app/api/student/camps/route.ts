// @ts-nocheck
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
                    include: {
                        mission_result: {
                            include: {
                                mission_answer: {
                                    include: {
                                        answer_text: true,
                                        answer_mcq: true,
                                        answer_photo: true,
                                    }
                                }
                            }
                        }
                    }
                },
                camp_classroom: {
                    include: {
                        classroom: {
                            include: {
                                _count: {
                                    select: { classroom_students: true }
                                }
                            }
                        }
                    }
                },
                camp_daily_schedule: {
                    include: { time_slots: true },
                    orderBy: { day: 'asc' },
                },
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
                camp_id: 'desc'
            }
        });

        // 3. Transform data for frontend
        const now = new Date();
        const studentCamps = camps.map(camp => {
            const enrollments = camp.student_enrollment;
            const myEnrollment = enrollments.find(e => e.student_students_id === studentId);
            
            const isRegistered = !!myEnrollment?.enrolled_at;
            const isEnded = camp.end_date < now;

            // Total capacity = sum of students in all linked classrooms
            const totalCapacity = camp.camp_classroom.reduce((sum, cc) => sum + (cc.classroom?._count?.classroom_students || 0), 0);
            const totalEnrolled = enrollments.filter(e => e.enrolled_at).length;

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
                shirtSize: myEnrollment?.shirt_size || null,
                hasShirt: camp.has_shirt,
                startShirtDate: camp.start_shirt_date,
                endShirtDate: camp.end_shirt_date,
                rawStartDate: camp.start_date,
                rawEndDate: camp.end_date,
                missionResults: myEnrollment?.mission_result || [],
                station: camp.station,
                img_camp_url: camp.img_camp_url,
                img_shirt_url: camp.img_shirt_url,
                enrolledAt: myEnrollment?.enrolled_at,
                startRegisDate: camp.start_regis_date,
                endRegisDate: camp.end_regis_date,
                totalCapacity,
                totalEnrolled,
                academicYear: camp.camp_classroom[0]?.classroom?.academic_years_years_id,
                camp_daily_schedule: camp.camp_daily_schedule
                    ? camp.camp_daily_schedule.map(s => ({
                          daily_schedule_id: s.daily_schedule_id,
                          day: s.day,
                          time_slots: (s.time_slots || []).map(slot => ({
                              time_slot_id: slot.time_slot_id,
                              startTime: slot.startTime,
                              endTime: slot.endTime,
                              activity: slot.activity,
                          })),
                      }))
                    : [],
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
