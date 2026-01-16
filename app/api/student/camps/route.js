
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// HARDCODED STUDENT ID for Demo
const STUDENT_ID = 1;

export async function GET() {
    try {
        // 1. Find classrooms for Gifted Grade 4
        // In a real app, we would find the student's classroom first.
        // For this requirement: "Assume student is Gifted Grade 4"
        const classrooms = await prisma.classrooms.findMany({
            where: {
                grade: "Level_4",
                type_classroom: "Gifted" // Assuming this string matches. If not, we might need to check available types.
            },
            select: { classroom_id: true }
        });

        const classroomIds = classrooms.map(c => c.classroom_id);

        if (classroomIds.length === 0) {
            // Fallback: If no specific "Gifted" classroom, maybe just fetch by Grade 4 for demo purposes? 
            // Or return empty if strict. Let's try to be a bit flexible for the demo.
            console.log("No Gifted Level_4 classrooms found.");
        }

        // 2. Find Camps linked to these classrooms
        const camps = await prisma.camp.findMany({
            where: {
                deletedAt: null,
                status: "OPEN", // Only show OPEN camps? Or all? User said "Available" and "My Camps" tabs.
                camp_classroom: {
                    some: {
                        classroom_classroom_id: { in: classroomIds }
                    }
                }
            },
            include: {
                student_enrollment: {
                    where: {
                        student_students_id: STUDENT_ID
                    },
                    include: {
                        mission_result: {
                            include: {
                                mission: true
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
        const studentCamps = camps.map(camp => {
            const isRegistered = camp.student_enrollment.length > 0;
            const enrollment = isRegistered ? camp.student_enrollment[0] : null;

            return {
                id: camp.camp_id,
                title: camp.name,
                description: camp.description,
                location: camp.location,
                startDate: camp.start_date.toISOString().split('T')[0],
                endDate: camp.end_date.toISOString().split('T')[0],
                status: isRegistered ? "Registered" : "Available", // Or derived from camp status
                isRegistered: isRegistered,
                shirtSize: enrollment?.shirt_size || null,
                hasShirt: camp.has_shirt,
                startShirtDate: camp.start_shirt_date,
                endShirtDate: camp.end_shirt_date,
                rawStartDate: camp.start_date,
                rawEndDate: camp.end_date,
                missionResults: enrollment?.mission_result || [], // Pass results to frontend
                station: camp.station // Pass station/mission data
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
