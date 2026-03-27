import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

/** แปลง Date (UTC จาก DB) → ISO string +07:00 สำหรับแสดงผล */
const toThaiISOString = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const offset = 7 * 60; // +07:00 in minutes
    const localMs = d.getTime() + offset * 60 * 1000;
    const local = new Date(localMs);
    return local.toISOString().replace('Z', '+07:00');
};

/** คืนค่า Date ปัจจุบันในโซนเวลาไทย (+07:00) */
const thaiNow = () => new Date(Date.now() + 7 * 60 * 60 * 1000);


/**
 * POST - สร้างค่ายใหม่ พร้อม enroll students และ teachers จาก classrooms (รองรับหลายห้อง)
 */
export async function POST(req) {
    // ตรวจสอบ session
    const { teacher, error: authError } = await requireTeacher();
    if (authError) return authError;

    try {
        const body = await req.json();

        // Validation
        if (!body.name || !body.location) {
            return NextResponse.json({ error: "กรุณากรอกชื่อค่ายและสถานที่" }, { status: 400 });
        }

        if (!body.classroom_ids || !Array.isArray(body.classroom_ids) || body.classroom_ids.length === 0) {
            return NextResponse.json({ error: "กรุณาเลือกห้องเรียนอย่างน้อย 1 ห้อง" }, { status: 400 });
        }

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
                    : thaiNow(),
                end_shirt_date: body.hasShirt && body.shirtEndDate
                    ? new Date(body.shirtEndDate)
                    : thaiNow(),
                status: "OPEN",
                img_camp_url: body.img_camp_url || "",
                img_shirt_url: body.img_shirt_url || "",
                created_by_teacher_id: teacher.teachers_id,
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

        // เชื่อมค่ายกับห้องเรียนทั้งหมด + สร้าง enrollment record ให้นักเรียน (ยังไม่เข้าร่วม = null)
        for (const classroomId of body.classroom_ids) {
            await prisma.camp_classroom.create({
                data: {
                    camp_camp_id: newCamp.camp_id,
                    classroom_classroom_id: classroomId,
                },
            });

            // สร้าง enrollment record ให้นักเรียนทุกคนในห้อง (enrolled_at = null จนกว่าจะกดเข้าร่วม)
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
                            student: { connect: { students_id: cs.student_students_id } },
                            camp: { connect: { camp_id: newCamp.camp_id } },
                            enrolled_at: null,
                            shirt_size: null,
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
 * GET - ดึงรายการค่ายที่ครูมีส่วนเกี่ยวข้อง
 *   - ผู้สร้าง (created_by_teacher_id) → isOwner: true
 *   - ครูที่เกี่ยวข้อง (teacher_enrollment) → isOwner: false
 */
export async function GET(request) {
    const { teacher, error: authError } = await requireTeacher();
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');

        let dateFilter = {};
        if (year) {
            dateFilter.start_date = {
                gte: new Date(`${year}-01-01T00:00:00.000Z`),
                lte: new Date(`${year}-12-31T23:59:59.999Z`),
            };
        }

        let camps = await prisma.camp.findMany({
            where: {
                deletedAt: null,
                ...dateFilter,
                OR: [
                    // ผู้สร้างค่าย
                    { created_by_teacher_id: teacher.teachers_id },
                    // ครูชั่วคราวที่ถูกระบุในค่าย
                    {
                        teacher_enrollment: {
                            some: { teacher_teachers_id: teacher.teachers_id }
                        }
                    },
                    // ครูประจำชั้นคนที่ 1 ของห้องเรียนที่เชื่อมกับค่ายนี้
                    {
                        camp_classroom: {
                            some: {
                                classroom: {
                                    teachers_teachers_id: teacher.teachers_id
                                }
                            }
                        }
                    },
                    // ครูประจำชั้นคนที่ 2 ของห้องเรียนที่เชื่อมกับค่ายนี้
                    {
                        camp_classroom: {
                            some: {
                                classroom: {
                                    classroom_teacher: {
                                        some: { teacher_teachers_id: teacher.teachers_id }
                                    }
                                }
                            }
                        }
                    },
                ],
            },
            include: {
                created_by: {
                    select: { firstname: true, lastname: true },
                },
                _count: {
                    select: {
                        student_enrollment: true,
                        teacher_enrollment: true,
                    },
                },
                camp_classroom: {
                    include: {
                        classroom: {
                            include: {
                                classroom_types: true,
                                teacher: {
                                    select: { firstname: true, lastname: true },
                                },
                                classroom_teacher: {
                                    include: {
                                        teacher: {
                                            select: { firstname: true, lastname: true }
                                        }
                                    }
                                }
                            },
                        },
                    },
                },
                teacher_enrollment: true,
            },
            orderBy: { camp_id: "desc" },
        });

        // ==========================================
        // Explicitly double check the access in JS
        // ==========================================
        camps = camps.filter(camp => {
            if (camp.created_by_teacher_id === teacher.teachers_id) return true;
            
            const isEnrolled = camp.teacher_enrollment?.some(t => t.teacher_teachers_id === teacher.teachers_id);
            if (isEnrolled) return true;

            let isHomeroom = false;
            camp.camp_classroom?.forEach(cc => {
                if (cc.classroom?.teachers_teachers_id === teacher.teachers_id) isHomeroom = true;
                if (cc.classroom?.classroom_teacher?.some(ct => ct.teacher_teachers_id === teacher.teachers_id)) isHomeroom = true;
            });
            if (isHomeroom) return true;

            return false;
        });


        console.log("=== DEBUG /api/camps ===");
        console.log("Teacher ID:", teacher.teachers_id);
        console.log("Total camps fetched:", camps.length);
        console.log("Camp IDs:", camps.map(c => c.camp_id).join(', '));
        console.log("========================");

        const dateFields = [
            'start_date', 'end_date',
            'start_regis_date', 'end_regis_date',
            'start_shirt_date', 'end_shirt_date',
        ];
        const campsWithMeta = camps.map(camp => {
            const updated = { ...camp };
            for (const f of dateFields) {
                if (updated[f]) updated[f] = toThaiISOString(updated[f]);
            }
            updated.isOwner = camp.created_by_teacher_id === teacher.teachers_id;
            
            // Extract Grades and Types
            const typeMap = new Map();
            const allGrades = new Set();
            
            if (camp.camp_classroom) {
                camp.camp_classroom.forEach(cc => {
                    if (cc.classroom) {
                        const g = cc.classroom.grade;
                        const typeName = cc.classroom.classroom_types?.name || cc.classroom.type_classroom;
                        if (g) {
                            const gradeStr = g.replace('Level_', 'ม.');
                            allGrades.add(gradeStr);
                            
                            if (typeName) {
                                if (!typeMap.has(typeName)) {
                                    typeMap.set(typeName, new Set());
                                }
                                typeMap.get(typeName).add(gradeStr);
                            }
                        }
                    }
                });
            }
            
            const sortedGrades = Array.from(allGrades).sort((a, b) => a.localeCompare(b));
            updated.grades = sortedGrades;
            
            updated.gradeDisplay = Array.from(typeMap.entries())
                .sort((a, b) => a[0].toString().localeCompare(b[0].toString()))
                .map(([type, typeGrades]) => {
                    const sortedTypeGrades = Array.from(typeGrades).sort((a, b) => a.localeCompare(b));
                    return `${type}(${sortedTypeGrades.join(', ')})`;
                })
                .join(' ');
            
            return updated;
        });

        return NextResponse.json(campsWithMeta, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });
    } catch (error) {
        console.error("API_GET_CAMPS_ERROR:", error);
        return NextResponse.json(
            { error: "ไม่สามารถดึงข้อมูลค่ายได้" },
            { status: 500 }
        );
    }
}

