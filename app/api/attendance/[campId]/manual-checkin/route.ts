// @ts-nocheck
import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";

const recordsStore =
  globalThis._campAttendanceRecords ??
  (globalThis._campAttendanceRecords = new Map());

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

    const roundKey = `${cid}:${roundId}`;
    let records = recordsStore.get(roundKey) ?? [];

    if (action === "checkin") {
      const alreadyChecked = records.find((r) => r.studentId === studentId);

      if (!alreadyChecked) {
        const checkedAt = new Date(Date.now() + 7 * 60 * 60 * 1000);

        records.push({ studentId, enrollmentId, checkedAt });
        recordsStore.set(roundKey, records);
      }
    } else if (action === "uncheck") {
      records = records.filter((r) => r.studentId !== studentId);
      recordsStore.set(roundKey, records);
    }

    return NextResponse.json({ success: true });
  } catch {
    //     console.error("Manual check-in error:", error);

    return NextResponse.json(
      { _error: "เกิดข้อผิดพลาดในการเช็คชื่อ" },
      { status: 500 },
    );
  }
}
