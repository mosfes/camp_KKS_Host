// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";

async function verifyQRPayload(payload) {
  try {
    if (!payload || typeof payload !== "string") return null;
    const parts = payload.split(":");

    // We changed payload from 4 parts (with nonce) to 3 parts (stable)
    if (parts.length < 3 || parts[0] !== "CAMP_MISSION") return null;
    const [, missionId, campId] = parts;
    const mid = parseInt(missionId);

    return { missionId: mid, campId: parseInt(campId) };
  } catch {
    return null;
  }
}

async function verifyPin(missionId, pin) {
  const mission = await prisma.mission.findUnique({
    where: { mission_id: missionId },
  });

  if (!mission) return false;

  return String(pin).trim() === mission.qr_pin;
}

async function recordCompletion(studentId, missionId, campId) {
  const enrollment = await prisma.student_enrollment.findFirst({
    where: {
      student_students_id: studentId,
      camp_camp_id: campId,
      enrolled_at: { not: null },
    },
  });

  if (!enrollment)
    return { error: "ยังไม่ได้ลงทะเบียนเข้าร่วมค่าย", status: 403 };

  const existing = await prisma.mission_result.findFirst({
    where: {
      student_enrollment_id: enrollment.student_enrollment_id,
      mission_mission_id: missionId,
      status: "completed",
    },
  });

  if (existing)
    return {
      success: true,
      alreadyCompleted: true,
      message: "คุณได้ทำภารกิจนี้แล้ว",
    };

  await prisma.mission_result.create({
    data: {
      method: "QR",
      status: "completed",
      submitted_at: new Date(Date.now() + 7 * 60 * 60 * 1000),
      student_enrollment_id: enrollment.student_enrollment_id,
      mission_mission_id: missionId,
    },
  });

  return {
    success: true,
    alreadyCompleted: false,
    message: "สำเร็จ! ภารกิจเสร็จสิ้น",
  };
}

// POST /api/student/mission/qr-scan
// Body: { qrPayload } OR { pin, missionId }
export async function POST(req) {
  const { student, error: authError } = await requireStudent();

  if (authError) return authError;

  const studentId = student.students_id;

  try {
    const body = await req.json();
    const { qrPayload, pin, missionId: pinMissionId } = body;

    let decoded = null;

    // --- Mode 1: QR payload ---
    if (qrPayload) {
      decoded = await verifyQRPayload(qrPayload);
      if (!decoded) {
        return NextResponse.json(
          { error: "QR Code ไม่ถูกต้อง" },
          { status: 400 },
        );
      }
    }
    // --- Mode 2: PIN ---
    else if (pin && pinMissionId) {
      const missionId = parseInt(pinMissionId);

      if (!(await verifyPin(missionId, pin))) {
        return NextResponse.json(
          { error: "รหัส PIN ไม่ถูกต้อง" },
          { status: 400 },
        );
      }

      const mission = await prisma.mission.findUnique({
        where: { mission_id: missionId, deletedAt: null },
        include: { station: true },
      });

      if (!mission || mission.type !== "QR_CODE_SCANNING") {
        return NextResponse.json({ error: "ไม่พบภารกิจ" }, { status: 404 });
      }

      decoded = { missionId, campId: mission.station.camp_camp_id };
    } else {
      return NextResponse.json(
        { error: "กรุณาแสกน QR Code หรือกรอก PIN" },
        { status: 400 },
      );
    }

    const { missionId, campId } = decoded;

    // Verify mission exists and is QR type
    const mission = await prisma.mission.findUnique({
      where: { mission_id: missionId, deletedAt: null },
      include: { station: true },
    });

    if (!mission || mission.type !== "QR_CODE_SCANNING") {
      return NextResponse.json(
        { error: "ไม่พบภารกิจหรือประเภทไม่ถูกต้อง" },
        { status: 404 },
      );
    }

    if (mission.station.camp_camp_id !== campId) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ตรงกับค่ายนี้" },
        { status: 400 },
      );
    }

    const result = await recordCompletion(studentId, missionId, campId);

    if (result.error)
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 400 },
      );

    return NextResponse.json(result);
  } catch {
    //     console.error("QR scan error:", error);

    return NextResponse.json(
      { _error: "เกิดข้อผิดพลาดในการแสกน" },
      { status: 500 },
    );
  }
}
