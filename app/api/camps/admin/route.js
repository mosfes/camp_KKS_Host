import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

/** แปลง Date (UTC จาก DB) → ISO string +07:00 สำหรับแสดงผล */
const toThaiISOString = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const offset = 7 * 60;
    const localMs = d.getTime() + offset * 60 * 1000;
    const local = new Date(localMs);
    return local.toISOString().replace('Z', '+07:00');
};

/** ตรวจสอบ ADMIN role */
async function requireAdmin() {
    const { teacher, error: authError } = await requireTeacher();
    if (authError) return { teacher: null, error: authError };
    if (teacher.role !== "ADMIN") {
        return {
            teacher: null,
            error: NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" }, { status: 403 }),
        };
    }
    return { teacher, error: null };
}

export async function GET(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const showDeleted = searchParams.get("deleted") === "true";

        const skip = (page - 1) * limit;

        const where = showDeleted
            ? { deletedAt: { not: null } }
            : { deletedAt: null };

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { location: { contains: search } },
            ];
        }

        if (!showDeleted && status && (status === "OPEN" || status === "CLOSED")) {
            where.status = status;
        }

        const [camps, total] = await Promise.all([
            prisma.camp.findMany({
                where,
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
                                    teacher: {
                                        select: { firstname: true, lastname: true },
                                    },
                                    classroom_types: {
                                        select: { name: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: showDeleted
                    ? { deletedAt: "desc" }
                    : { camp_id: "desc" },
                skip,
                take: limit,
            }),
            prisma.camp.count({ where }),
        ]);

        const dateFields = [
            'start_date', 'end_date',
            'start_regis_date', 'end_regis_date',
            'start_shirt_date', 'end_shirt_date',
        ];

        const campsFormatted = camps.map(camp => {
            const updated = { ...camp };
            for (const f of dateFields) {
                if (updated[f]) updated[f] = toThaiISOString(updated[f]);
            }
            if (updated.deletedAt) {
                updated.deletedAt = toThaiISOString(updated.deletedAt);
            }
            return updated;
        });

        return NextResponse.json({
            data: campsFormatted,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("API_GET_ADMIN_CAMPS_ERROR:", error);
        return NextResponse.json(
            { error: "ไม่สามารถดึงข้อมูลค่ายได้" },
            { status: 500 }
        );
    }
}

export async function PATCH(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await request.json();
        const campId = Number(body.camp_id);

        if (!campId || isNaN(campId)) {
            return NextResponse.json({ error: "camp_id ไม่ถูกต้อง" }, { status: 400 });
        }

        const existing = await prisma.camp.findFirst({
            where: { camp_id: campId, deletedAt: { not: null } },
        });

        if (!existing) {
            return NextResponse.json({ error: "ไม่พบค่ายที่ถูกลบ" }, { status: 404 });
        }

        await prisma.camp.update({
            where: { camp_id: campId },
            data: { deletedAt: null },
        });

        return NextResponse.json({ message: "กู้คืนค่ายสำเร็จ" });
    } catch (error) {
        console.error("API_RESTORE_CAMP_ERROR:", error);
        return NextResponse.json(
            { error: "ไม่สามารถกู้คืนค่ายได้" },
            { status: 500 }
        );
    }
}


export async function DELETE(request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const campId = Number(searchParams.get("camp_id"));

        if (!campId || isNaN(campId)) {
            return NextResponse.json({ error: "camp_id ไม่ถูกต้อง" }, { status: 400 });
        }

        const existing = await prisma.camp.findFirst({
            where: { camp_id: campId, deletedAt: { not: null } },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "ไม่พบค่ายในถังขยะ (ต้อง soft delete ก่อน)" },
                { status: 404 }
            );
        }

    
        const teacherEnrollments = await prisma.teacher_enrollment.findMany({
            where: { camp_camp_id: campId },
            select: { teacher_enrollment_id: true },
        });
        const teIds = teacherEnrollments.map(te => te.teacher_enrollment_id);

        if (teIds.length > 0) {
            const sessions = await prisma.attendance_teachers.findMany({
                where: { teacher_enrollment_teacher_enrollment_id: { in: teIds } },
                select: { session_id: true },
            });
            const sessionIds = sessions.map(s => s.session_id);
            if (sessionIds.length > 0) {
                await prisma.attendance_record_student.deleteMany({
                    where: { attendance_teacher_session_id: { in: sessionIds } },
                });
            }
            await prisma.attendance_teachers.deleteMany({
                where: { camp_camp_id: campId },
            });
        }

        const evaluations = await prisma.evaluation.findMany({
            where: { camp_camp_id: campId },
            select: { evaluation_id: true },
        });
        const evalIds = evaluations.map(e => e.evaluation_id);
        if (evalIds.length > 0) {
            const evalAnswers = await prisma.evaluation_answer.findMany({
                where: { evaluation_evaluation_id: { in: evalIds } },
                select: { answer_id: true },
            });
            const evalAnswerIds = evalAnswers.map(a => a.answer_id);
            if (evalAnswerIds.length > 0) {
                await prisma.suggestion_analysis_summary.deleteMany({
                    where: { evaluation_answer_evaluation_id: { in: evalAnswerIds } },
                });
            }
            await prisma.evaluation_answer.deleteMany({
                where: { evaluation_evaluation_id: { in: evalIds } },
            });
        }
        await prisma.evaluation.deleteMany({ where: { camp_camp_id: campId } });

        const stations = await prisma.station.findMany({
            where: { camp_camp_id: campId },
            select: { station_id: true },
        });
        const stationIds = stations.map(s => s.station_id);
        if (stationIds.length > 0) {
            const missions = await prisma.mission.findMany({
                where: { station_station_id: { in: stationIds } },
                select: { mission_id: true },
            });
            const missionIds = missions.map(m => m.mission_id);

            if (missionIds.length > 0) {
                const missionResults = await prisma.mission_result.findMany({
                    where: { mission_mission_id: { in: missionIds } },
                    select: { mission_result_id: true },
                });
                const mrIds = missionResults.map(r => r.mission_result_id);
                if (mrIds.length > 0) {
                    const mAnswers = await prisma.mission_answer.findMany({
                        where: { mission_result_mission_result_id: { in: mrIds } },
                        select: { answer_id: true },
                    });
                    const maIds = mAnswers.map(a => a.answer_id);
                    if (maIds.length > 0) {
                        await prisma.mission_answer_photo.deleteMany({
                            where: { mission_answer_id: { in: maIds } },
                        });
                        await prisma.mission_answer_mcq.deleteMany({
                            where: { mission_answer_id: { in: maIds } },
                        });
                        await prisma.mission_answer_text.deleteMany({
                            where: { mission_answer_id: { in: maIds } },
                        });
                    }
                    await prisma.mission_answer.deleteMany({
                        where: { mission_result_mission_result_id: { in: mrIds } },
                    });
                }
                await prisma.mission_result.deleteMany({
                    where: { mission_mission_id: { in: missionIds } },
                });

                const mQuestions = await prisma.mission_question.findMany({
                    where: { mission_mission_id: { in: missionIds } },
                    select: { question_id: true },
                });
                const mqIds = mQuestions.map(q => q.question_id);
                if (mqIds.length > 0) {
                    await prisma.mission_question_choice.deleteMany({
                        where: { mission_question_question_id: { in: mqIds } },
                    });
                }
                await prisma.mission_question.deleteMany({
                    where: { mission_mission_id: { in: missionIds } },
                });
            }
            await prisma.mission.deleteMany({
                where: { station_station_id: { in: stationIds } },
            });
        }
        await prisma.station.deleteMany({ where: { camp_camp_id: campId } });

        const studentEnrollments = await prisma.student_enrollment.findMany({
            where: { camp_camp_id: campId },
            select: { student_enrollment_id: true },
        });
        const seIds = studentEnrollments.map(se => se.student_enrollment_id);
        if (seIds.length > 0) {
            await prisma.certificate.deleteMany({
                where: { student_enrollment_id: { in: seIds } },
            });
        }

        await prisma.student_enrollment.deleteMany({ where: { camp_camp_id: campId } });
        await prisma.teacher_enrollment.deleteMany({ where: { camp_camp_id: campId } });

        await prisma.camp_classroom.deleteMany({ where: { camp_camp_id: campId } });
        await prisma.camp_template.deleteMany({ where: { camp_camp_id: campId } });

        const schedules = await prisma.camp_daily_schedule.findMany({
            where: { camp_camp_id: campId },
            select: { daily_schedule_id: true },
        });
        const scheduleIds = schedules.map(s => s.daily_schedule_id);
        if (scheduleIds.length > 0) {
            await prisma.camp_time_slot.deleteMany({
                where: { daily_schedule_id: { in: scheduleIds } },
            });
        }
        await prisma.camp_daily_schedule.deleteMany({ where: { camp_camp_id: campId } });

        await prisma.camp.delete({ where: { camp_id: campId } });

        return NextResponse.json({ message: "ลบค่ายถาวรสำเร็จ" });
    } catch (error) {
        console.error("API_PERMANENT_DELETE_CAMP_ERROR:", error);
        return NextResponse.json(
            { error: "ไม่สามารถลบค่ายถาวรได้", details: error.message },
            { status: 500 }
        );
    }
}
