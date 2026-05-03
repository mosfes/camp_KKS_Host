// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

// POST /api/attendance/[campId]/manual-checkin
export async function POST(req, { params }) {
  const { error: authError } = await requireTeacher();
  if (authError) return authError;

  const { campId } = await params;
  const cid = parseInt(campId);

  try {
    const body = await req.json();
    const { roundId, studentId, enrollmentId, action } = body;

    if (!roundId || !studentId || !action) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // หา teacherSession ที่ตรงกับ roundId
    const teacherSession = await prisma.attendance_teachers.findFirst({
      where: { camp_camp_id: cid, round_id: roundId },
    });

    if (!teacherSession) {
      return NextResponse.json(
        { error: "ไม่พบรอบการเช็คชื่อ" },
        { status: 404 },
      );
    }

    if (action === "checkin") {
      const existing = await prisma.attendance_record_student.findFirst({
        where: {
          attendance_teacher_session_id: teacherSession.session_id,
          student_students_id: studentId,
        },
      });

      if (!existing) {
        await prisma.attendance_record_student.create({
          data: {
            attendance_teacher_session_id: teacherSession.session_id,
            student_students_id: studentId,
            checkin_time: new Date(),
          },
        });
      }
    } else if (action === "uncheck") {
      await prisma.attendance_record_student.deleteMany({
        where: {
          attendance_teacher_session_id: teacherSession.session_id,
          student_students_id: studentId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Manual check-in error:", e);
    return NextResponse.json(
      { _error: "เกิดข้อผิดพลาดในการเช็คชื่อ" },
      { status: 500 },
    );
  }
}
