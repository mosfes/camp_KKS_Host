// @ts-nocheck
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

  return local.toISOString().replace("Z", "+07:00");
};

/** ตรวจสอบ ADMIN role */
async function requireAdmin() {
  const { teacher, error: authError } = await requireTeacher();

  if (authError) return { teacher: null, error: authError };
  if (teacher.role !== "ADMIN") {
    return {
      teacher: null,
      error: NextResponse.json(
        { error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" },
        { status: 403 },
      ),
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

    const now = new Date();

    if (!showDeleted && status && status !== "all") {
      if (status === "FINISHED") {
        where.end_date = { lt: now };
      } else if (status === "ACTIVE") {
        where.start_date = { lte: now };
        where.end_date = { gte: now };
      } else if (status === "REGISTRATION_OPEN") {
        where.start_regis_date = { lte: now };
        where.end_regis_date = { gte: now };
      } else if (status === "PREPARING") {
        where.end_regis_date = { lt: now };
        where.start_date = { gt: now };
      } else if (status === "REGISTRATION_PENDING") {
        where.start_regis_date = { gt: now };
      } else if (status === "OPEN" || status === "CLOSED") {
        where.status = status;
      }
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
        orderBy: showDeleted ? { deletedAt: "desc" } : { camp_id: "desc" },
        skip,
        take: limit,
      }),
      prisma.camp.count({ where }),
    ]);

    const dateFields = [
      "start_date",
      "end_date",
      "start_regis_date",
      "end_regis_date",
      "start_shirt_date",
      "end_shirt_date",
    ];

    const campsFormatted = camps.map((camp) => {
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
  } catch {
    //     console.error("API_GET_ADMIN_CAMPS_ERROR:", error);

    return NextResponse.json(
      { _error: "ไม่สามารถดึงข้อมูลค่ายได้" },
      { status: 500 },
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
      return NextResponse.json(
        { error: "camp_id ไม่ถูกต้อง" },
        { status: 400 },
      );
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
  } catch {
    //     console.error("API_RESTORE_CAMP_ERROR:", error);

    return NextResponse.json(
      { _error: "ไม่สามารถกู้คืนค่ายได้" },
      { status: 500 },
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
      return NextResponse.json(
        { error: "camp_id ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const existing = await prisma.camp.findFirst({
      where: { camp_id: campId, deletedAt: { not: null } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "ไม่พบค่ายในถังขยะ (ต้อง soft delete ก่อน)" },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Attendance
      const sessions = await tx.attendance_teachers.findMany({
        where: { camp_camp_id: campId },
        select: { session_id: true },
      });
      const sessionIds = sessions.map((s) => s.session_id);

      if (sessionIds.length > 0) {
        await tx.attendance_record_student.deleteMany({
          where: { attendance_teacher_session_id: { in: sessionIds } },
        });
      }
      await tx.attendance_teachers.deleteMany({
        where: { camp_camp_id: campId },
      });

      // 2. Evaluation
      const evaluations = await tx.evaluation.findMany({
        where: { camp_camp_id: campId },
        select: { evaluation_id: true },
      });
      const evalIds = evaluations.map((e) => e.evaluation_id);

      if (evalIds.length > 0) {
        const evalAnswers = await tx.evaluation_answer.findMany({
          where: { evaluation_evaluation_id: { in: evalIds } },
          select: { answer_id: true },
        });
        const evalAnswerIds = evalAnswers.map((a) => a.answer_id);

        if (evalAnswerIds.length > 0) {
          await tx.suggestion_analysis_summary.deleteMany({
            where: { evaluation_answer_evaluation_id: { in: evalAnswerIds } },
          });
        }
        await tx.evaluation_answer.deleteMany({
          where: { evaluation_evaluation_id: { in: evalIds } },
        });
        await tx.evaluation.deleteMany({
          where: { camp_camp_id: campId },
        });
      }

      // 3. Survey (MANDATORY FIX)
      const surveys = await tx.survey.findMany({
        where: { camp_camp_id: campId },
        select: { survey_id: true },
      });
      const surveyIds = surveys.map((s) => s.survey_id);

      if (surveyIds.length > 0) {
        // Delete survey answers via responses or questions
        await tx.survey_answer.deleteMany({
          where: {
            OR: [
              { survey_response: { survey_survey_id: { in: surveyIds } } },
              { survey_question: { survey_survey_id: { in: surveyIds } } },
            ],
          },
        });
        await tx.survey_response.deleteMany({
          where: { survey_survey_id: { in: surveyIds } },
        });
        await tx.survey_question.deleteMany({
          where: { survey_survey_id: { in: surveyIds } },
        });
        await tx.survey.deleteMany({
          where: { camp_camp_id: campId },
        });
      }

      // 4. Station, Mission, Result
      const stations = await tx.station.findMany({
        where: { camp_camp_id: campId },
        select: { station_id: true },
      });
      const stationIds = stations.map((s) => s.station_id);

      if (stationIds.length > 0) {
        const missions = await tx.mission.findMany({
          where: { station_station_id: { in: stationIds } },
          select: { mission_id: true },
        });
        const missionIds = missions.map((m) => m.mission_id);

        if (missionIds.length > 0) {
          const missionResults = await tx.mission_result.findMany({
            where: { mission_mission_id: { in: missionIds } },
            select: { mission_result_id: true },
          });
          const mrIds = missionResults.map((r) => r.mission_result_id);

          if (mrIds.length > 0) {
            const mAnswers = await tx.mission_answer.findMany({
              where: { mission_result_mission_result_id: { in: mrIds } },
              select: { answer_id: true },
            });
            const maIds = mAnswers.map((a) => a.answer_id);

            if (maIds.length > 0) {
              await tx.mission_answer_photo.deleteMany({
                where: { mission_answer_id: { in: maIds } },
              });
              await tx.mission_answer_mcq.deleteMany({
                where: { mission_answer_id: { in: maIds } },
              });
              await tx.mission_answer_text.deleteMany({
                where: { mission_answer_id: { in: maIds } },
              });
            }
            await tx.mission_answer.deleteMany({
              where: { mission_result_mission_result_id: { in: mrIds } },
            });
            await tx.mission_result.deleteMany({
              where: { mission_mission_id: { in: missionIds } },
            });
          }

          const mQuestions = await tx.mission_question.findMany({
            where: { mission_mission_id: { in: missionIds } },
            select: { question_id: true },
          });
          const mqIds = mQuestions.map((q) => q.question_id);

          if (mqIds.length > 0) {
            await tx.mission_question_choice.deleteMany({
              where: { mission_question_question_id: { in: mqIds } },
            });
          }
          await tx.mission_question.deleteMany({
            where: { mission_mission_id: { in: missionIds } },
          });
          await tx.mission.deleteMany({
            where: { station_station_id: { in: stationIds } },
          });
        }
        await tx.station.deleteMany({ where: { camp_camp_id: campId } });
      }

      const enrollments = await tx.student_enrollment.findMany({
        where: { camp_camp_id: campId },
        select: { student_enrollment_id: true },
      });
      const seIds = enrollments.map((e) => e.student_enrollment_id);

      if (seIds.length > 0) {
        await tx.certificate.deleteMany({
          where: { student_enrollment_id: { in: seIds } },
        });
      }
      await tx.student_enrollment.deleteMany({
        where: { camp_camp_id: campId },
      });
      await tx.teacher_enrollment.deleteMany({
        where: { camp_camp_id: campId },
      });

      // 6. Classroom, Template, Schedule
      await tx.camp_classroom.deleteMany({ where: { camp_camp_id: campId } });
      await tx.camp_template.deleteMany({ where: { camp_camp_id: campId } });

      const schedules = await tx.camp_daily_schedule.findMany({
        where: { camp_camp_id: campId },
        select: { daily_schedule_id: true },
      });
      const scheduleIds = schedules.map((s) => s.daily_schedule_id);

      if (scheduleIds.length > 0) {
        await tx.camp_time_slot.deleteMany({
          where: { daily_schedule_id: { in: scheduleIds } },
        });
      }
      await tx.camp_daily_schedule.deleteMany({
        where: { camp_camp_id: campId },
      });

      // 7. Finally the Camp record
      await tx.camp.delete({ where: { camp_id: campId } });
    });

    return NextResponse.json({ message: "ลบค่ายถาวรสำเร็จ" });
  } catch {
    //     console.error("API_PERMANENT_DELETE_CAMP_ERROR:", error);

    return NextResponse.json(
      { _error: "ไม่สามารถลบค่ายถาวรได้" },
      { status: 500 },
    );
  }
}
