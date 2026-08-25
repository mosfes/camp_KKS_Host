import { NextResponse } from "next/server";

import { requireCampTeacher } from "@/lib/attendance-auth";
import { recordStudentAttendanceOnce } from "@/lib/attendance-record";
import { prisma } from "@/lib/db";
import { parseNfcStudentId } from "@/lib/nfc-card";
import { activeCampStudentWhere } from "@/lib/active-camp-student";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campId: string }> },
) {
  const { campId: campIdParam } = await params;
  const campId = Number.parseInt(campIdParam, 10);
  const { error } = await requireCampTeacher(campId);

  if (error) return error;

  const body = await request.json().catch(() => null);
  const roundId = typeof body?.roundId === "string" ? body.roundId : "";
  const studentId = parseNfcStudentId(body?.cardData);

  if (!roundId || !studentId) {
    return NextResponse.json(
      {
        error:
          "ข้อมูลในบัตรไม่ถูกต้อง กรุณาเขียนเป็นรหัสนักเรียนหรือ KKS_STUDENT:รหัสนักเรียน",
      },
      { status: 400 },
    );
  }

  const now = new Date();
  const round = await prisma.attendance_session.findFirst({
    where: {
      camp_camp_id: campId,
      round_id: roundId,
      method: "NFC",
      is_closed: false,
      expires_at: { gt: now },
    },
    select: { round_id: true },
  });

  if (!round) {
    return NextResponse.json(
      { error: "รอบเช็คชื่อ NFC ปิดแล้วหรือหมดเวลา" },
      { status: 409 },
    );
  }

  const teacherSession = await prisma.attendance_teachers.findFirst({
    where: {
      camp_camp_id: campId,
      round_id: roundId,
      method: "NFC",
      is_closed: false,
    },
    select: { session_id: true },
  });

  if (!teacherSession) {
    return NextResponse.json(
      { error: "ไม่พบรอบเช็คชื่อ NFC ที่เปิดอยู่" },
      { status: 404 },
    );
  }

  const student = await prisma.students.findFirst({
    where: { students_id: studentId, deletedAt: null },
    select: {
      students_id: true,
      prefix_name: true,
      firstname: true,
      lastname: true,
    },
  });

  if (!student) {
    return NextResponse.json(
      { error: `ไม่พบนักเรียนรหัส ${studentId} ในระบบ` },
      { status: 404 },
    );
  }

  const enrollment = await prisma.student_enrollment.findFirst({
    where: {
      camp_camp_id: campId,
      student_students_id: student.students_id,
      enrolled_at: { not: null },
      student: activeCampStudentWhere(campId),
    },
    select: { student_enrollment_id: true },
  });

  if (!enrollment) {
    return NextResponse.json(
      { error: "เจ้าของบัตรไม่ได้ลงทะเบียนในค่ายนี้" },
      { status: 403 },
    );
  }

  const studentName = `${student.prefix_name || ""}${student.firstname} ${student.lastname}`;
  const attendance = await recordStudentAttendanceOnce({
    sessionId: teacherSession.session_id,
    studentId: student.students_id,
  });

  return NextResponse.json({
    success: true,
    alreadyCheckedIn: !attendance.created,
    studentId: student.students_id,
    studentName,
    checkedAt: attendance.checkedAt,
    message: attendance.created
      ? `เช็คชื่อ ${studentName} สำเร็จ`
      : `${studentName} เช็คชื่อในรอบนี้แล้ว`,
  });
}
