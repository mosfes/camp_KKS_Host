// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

// GET /api/attendance/[campId]/results?roundId=xxx
export async function GET(request, { params }) {
  const { error: authError } = await requireTeacher();
  if (authError) return authError;

  const { campId } = await params;
  const cid = parseInt(campId);
  const { searchParams } = new URL(request.url);
  const roundId = searchParams.get("roundId");

  // ดึงรายชื่อนักเรียนที่ลงทะเบียน
  const enrollments = await prisma.student_enrollment.findMany({
    where: { camp_camp_id: cid, enrolled_at: { not: null } },
    include: { student: true },
  });

  // หา teacherSession ที่ตรงกับ roundId (หรือ active/ล่าสุด)
  let teacherSession = null;

  if (roundId) {
    teacherSession = await prisma.attendance_teachers.findFirst({
      where: { camp_camp_id: cid, round_id: roundId },
    });
  } else {
    // ใช้ session ที่ยังเปิดอยู่ หรือล่าสุด
    teacherSession = await prisma.attendance_teachers.findFirst({
      where: { camp_camp_id: cid, is_closed: false },
      orderBy: { session_id: "desc" },
    });

    if (!teacherSession) {
      teacherSession = await prisma.attendance_teachers.findFirst({
        where: { camp_camp_id: cid },
        orderBy: { session_id: "desc" },
      });
    }
  }

  let checkedMap = new Map();

  if (teacherSession) {
    const records = await prisma.attendance_record_student.findMany({
      where: { attendance_teacher_session_id: teacherSession.session_id },
    });
    checkedMap = new Map(
      records.map((r) => [r.student_students_id, r.checkin_time]),
    );
  }

  const results = enrollments.map((e) => ({
    enrollmentId: e.student_enrollment_id,
    studentId: e.student.students_id,
    studentName: `${e.student.prefix_name || ""}${e.student.firstname} ${e.student.lastname}`,
    isCheckedIn: checkedMap.has(e.student.students_id),
    checkedAt: checkedMap.get(e.student.students_id) ?? null,
  }));

  results.sort((a, b) => {
    if (a.isCheckedIn && !b.isCheckedIn) return -1;
    if (!a.isCheckedIn && b.isCheckedIn) return 1;
    if (a.isCheckedIn && b.isCheckedIn)
      return new Date(b.checkedAt) - new Date(a.checkedAt);
    return a.studentId - b.studentId;
  });

  return NextResponse.json({
    results,
    totalCheckedIn: results.filter((r) => r.isCheckedIn).length,
    total: results.length,
  });
}

// DELETE /api/attendance/[campId]/results?roundId=xxx (ล้างการเช็คชื่อ)
export async function DELETE(request, { params }) {
  const { error: authError } = await requireTeacher();
  if (authError) return authError;

  const { campId } = await params;
  const cid = parseInt(campId);
  const { searchParams } = new URL(request.url);
  const roundId = searchParams.get("roundId");

  if (roundId) {
    // ล้างเฉพาะรอบนั้น
    const teacherSession = await prisma.attendance_teachers.findFirst({
      where: { camp_camp_id: cid, round_id: roundId },
    });
    if (teacherSession) {
      await prisma.attendance_record_student.deleteMany({
        where: { attendance_teacher_session_id: teacherSession.session_id },
      });
    }
  } else {
    // ล้างทุกรอบ + ปิด attendance_session ทั้งหมด
    const sessions = await prisma.attendance_teachers.findMany({
      where: { camp_camp_id: cid },
      select: { session_id: true },
    });
    const sessionIds = sessions.map((s) => s.session_id);

    if (sessionIds.length > 0) {
      await prisma.attendance_record_student.deleteMany({
        where: { attendance_teacher_session_id: { in: sessionIds } },
      });
    }

    // ปิด attendance_session ทั้งหมด
    await prisma.attendance_session.updateMany({
      where: { camp_camp_id: cid },
      data: { is_closed: true, closed_at: new Date() },
    });

    // ลบ attendance_teachers ทั้งหมด (reset รอบ)
    await prisma.attendance_teachers.deleteMany({
      where: { camp_camp_id: cid },
    });

    // ลบ attendance_session ทั้งหมด (reset ประวัติ)
    await prisma.attendance_session.deleteMany({
      where: { camp_camp_id: cid },
    });
  }

  return NextResponse.json({
    success: true,
    message: "ล้างข้อมูลเช็คชื่อแล้ว",
  });
}
