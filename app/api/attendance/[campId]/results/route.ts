// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

// GET /api/attendance/[campId]/results?roundId=xxx  (ถ้าไม่ส่ง roundId → ใช้รอบที่กำลัง active หรือรอบล่าสุด)
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

  const memStore =
    globalThis._campAttendanceRecords ??
    (globalThis._campAttendanceRecords = new Map());

  let records = [];

  if (roundId) {
    records = memStore.get(`${cid}:${roundId}`) ?? [];
  } else {
    // ใช้รอบที่ active อยู่ หรือรอบล่าสุด
    const activeStore = globalThis._campAttendanceStore ?? new Map();
    const session = activeStore.get(cid);

    if (session) {
      records = memStore.get(`${cid}:${session.roundId}`) ?? [];
    } else {
      const roundsStore = globalThis._campAttendanceRounds ?? new Map();
      const allRounds = roundsStore.get(cid) ?? [];

      if (allRounds.length > 0) {
        const latest = allRounds[allRounds.length - 1];

        records = memStore.get(`${cid}:${latest.roundId}`) ?? [];
      }
    }
  }

  const checkedMap = new Map(records.map((r) => [r.studentId, r.checkedAt]));

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

// DELETE /api/attendance/[campId]/results?roundId=xxx  (ถ้าไม่ส่ง → ล้างทุกรอบ)
export async function DELETE(request, { params }) {
  const { error: authError } = await requireTeacher();

  if (authError) return authError;

  const { campId } = await params;
  const cid = parseInt(campId);
  const { searchParams } = new URL(request.url);
  const roundId = searchParams.get("roundId");

  const memStore =
    globalThis._campAttendanceRecords ??
    (globalThis._campAttendanceRecords = new Map());

  if (roundId) {
    memStore.set(`${cid}:${roundId}`, []);
  } else {
    // ล้างทุกรอบ + ประวัติรอบ
    [...memStore.keys()]
      .filter((k) => k.startsWith(`${cid}:`))
      .forEach((k) => memStore.delete(k));
    const roundsStore = globalThis._campAttendanceRounds ?? new Map();

    roundsStore.delete(cid);
  }

  return NextResponse.json({
    success: true,
    message: "ล้างข้อมูลเช็คชื่อแล้ว",
  });
}
