// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";

/** ตรวจสอบ QR payload จาก DB */
async function verifyQR(payload) {
  try {
    if (!payload || typeof payload !== "string") return null;
    const parts = payload.split(":");
    if (parts.length !== 3 || parts[0] !== "CAMP_ATTEND") return null;
    const [, campId, nonce] = parts;
    const cid = parseInt(campId);

    const session = await prisma.attendance_session.findFirst({
      where: {
        camp_camp_id: cid,
        nonce,
        is_closed: false,
        expires_at: { gt: new Date() },
      },
    });

    if (!session) return null;
    return { campId: cid, roundId: session.round_id, sessionId: session.id };
  } catch {
    return null;
  }
}

/** ตรวจสอบ PIN จาก DB */
async function verifyPin(campId, pin) {
  const session = await prisma.attendance_session.findFirst({
    where: {
      camp_camp_id: campId,
      pin: String(pin).trim(),
      is_closed: false,
      expires_at: { gt: new Date() },
    },
  });

  if (!session) return null;
  return { roundId: session.round_id, sessionId: session.id };
}

// POST /api/student/attendance/checkin
export async function POST(req) {
  const { student, error: authError } = await requireStudent();
  if (authError) return authError;

  const studentId = student.students_id;

  try {
    const body = await req.json();
    const { qrPayload, pin, campId: pinCampId } = body;

    let campId = null,
      roundId = null,
      sessionDbId = null;

    if (qrPayload) {
      const decoded = await verifyQR(qrPayload);
      if (!decoded)
        return NextResponse.json(
          { error: "QR Code ไม่ถูกต้องหรือหมดอายุ กรุณาให้ครูสุ่มรหัสใหม่" },
          { status: 400 },
        );
      campId = decoded.campId;
      roundId = decoded.roundId;
      sessionDbId = decoded.sessionId;
    } else if (pin && pinCampId) {
      const cid = parseInt(pinCampId);
      const result = await verifyPin(cid, pin);
      if (!result)
        return NextResponse.json(
          { error: "รหัส PIN ไม่ถูกต้อง" },
          { status: 400 },
        );
      campId = cid;
      roundId = result.roundId;
      sessionDbId = result.sessionId;
    } else {
      return NextResponse.json(
        { error: "กรุณาแสกน QR Code หรือกรอก PIN" },
        { status: 400 },
      );
    }

    // ตรวจสอบการลงทะเบียน
    const enrollment = await prisma.student_enrollment.findFirst({
      where: {
        student_students_id: studentId,
        camp_camp_id: campId,
        enrolled_at: { not: null },
      },
    });

    if (!enrollment)
      return NextResponse.json(
        { error: "คุณยังไม่ได้ลงทะเบียนเข้าร่วมค่ายนี้" },
        { status: 403 },
      );

    // หา attendance_teachers session ที่ตรงกับ round_id นี้
    const teacherSession = await prisma.attendance_teachers.findFirst({
      where: { camp_camp_id: campId, round_id: roundId, is_closed: false },
    });

    if (!teacherSession) {
      return NextResponse.json(
        { error: "ไม่พบรอบการเช็คชื่อที่ตรงกัน" },
        { status: 404 },
      );
    }

    // ตรวจว่าเช็คชื่อไปแล้วหรือยัง
    const existing = await prisma.attendance_record_student.findFirst({
      where: {
        attendance_teacher_session_id: teacherSession.session_id,
        student_students_id: studentId,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        message: "คุณเช็คชื่อไปแล้วในรอบนี้",
        checkedAt: existing.checkin_time,
      });
    }

    const checkedAt = new Date();
    await prisma.attendance_record_student.create({
      data: {
        attendance_teacher_session_id: teacherSession.session_id,
        student_students_id: studentId,
        checkin_time: checkedAt,
      },
    });

    return NextResponse.json({
      success: true,
      alreadyCheckedIn: false,
      message: "เช็คชื่อสำเร็จ!",
      checkedAt,
    });
  } catch (e) {
    console.error("Attendance check-in error:", e);
    return NextResponse.json(
      { _error: "เกิดข้อผิดพลาดในการเช็คชื่อ" },
      { status: 500 },
    );
  }
}

// GET /api/student/attendance/checkin?campId=xxx
export async function GET(req) {
  const { student, error: authError } = await requireStudent();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const campId = parseInt(searchParams.get("campId") || "0");

  if (!campId)
    return NextResponse.json({ error: "กรุณาระบุ campId" }, { status: 400 });

  // ตรวจว่าเช็คชื่อในรอบไหนของค่ายนี้แล้ว
  const record = await prisma.attendance_record_student.findFirst({
    where: {
      student_students_id: student.students_id,
      attendance_teachers_session_id: {
        camp_camp_id: campId,
      },
    },
    orderBy: { checkin_time: "desc" },
  });

  if (record) {
    return NextResponse.json({
      isCheckedIn: true,
      checkedAt: record.checkin_time,
    });
  }

  return NextResponse.json({ isCheckedIn: false, checkedAt: null });
}

