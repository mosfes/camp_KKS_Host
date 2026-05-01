// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireStudent } from '@/lib/auth';

const attendanceStore = globalThis._campAttendanceStore ?? (globalThis._campAttendanceStore = new Map());
const recordsStore = globalThis._campAttendanceRecords ?? (globalThis._campAttendanceRecords = new Map());

function verifyQR(payload) {
    try {
        if (!payload || typeof payload !== 'string') return null;
        const parts = payload.split(':');
        if (parts.length !== 3 || parts[0] !== 'CAMP_ATTEND') return null;
        const [, campId, nonce] = parts;
        const cid = parseInt(campId);
        const stored = attendanceStore.get(cid);
        if (!stored || stored.nonce !== nonce) return null;
        if (stored.expiresAt && new Date() > new Date(stored.expiresAt)) return null;
        return { campId: cid, roundId: stored.roundId };
    } catch { return null; }
}

function verifyPin(campId, pin) {
    const stored = attendanceStore.get(campId);
    if (!stored) return null;
    if (stored.expiresAt && new Date() > new Date(stored.expiresAt)) return null;
    if (String(pin).trim() !== stored.pin) return null;
    return { roundId: stored.roundId };
}

// POST /api/student/attendance/checkin
export async function POST(req) {
    const { student, error: authError } = await requireStudent();
    if (authError) return authError;

    const studentId = student.students_id;

    try {
        const body = await req.json();
        const { qrPayload, pin, campId: pinCampId } = body;

        let campId = null, roundId = null;

        if (qrPayload) {
            const decoded = verifyQR(qrPayload);
            if (!decoded) return NextResponse.json({ error: 'QR Code ไม่ถูกต้องหรือหมดอายุ กรุณาให้ครูสุ่มรหัสใหม่' }, { status: 400 });
            campId = decoded.campId;
            roundId = decoded.roundId;
        } else if (pin && pinCampId) {
            const cid = parseInt(pinCampId);
            const result = verifyPin(cid, pin);
            if (!result) return NextResponse.json({ error: 'รหัส PIN ไม่ถูกต้อง' }, { status: 400 });
            campId = cid;
            roundId = result.roundId;
        } else {
            return NextResponse.json({ error: 'กรุณาแสกน QR Code หรือกรอก PIN' }, { status: 400 });
        }

        // ตรวจสอบการลงทะเบียน
        const enrollment = await prisma.student_enrollment.findFirst({
            where: { student_students_id: studentId, camp_camp_id: campId, enrolled_at: { not: null } },
        });
        if (!enrollment) return NextResponse.json({ error: 'คุณยังไม่ได้ลงทะเบียนเข้าร่วมค่ายนี้' }, { status: 403 });

        // Key = "campId:roundId" → รองรับหลายรอบต่อค่าย
        const roundKey = `${campId}:${roundId}`;
        const records = recordsStore.get(roundKey) ?? [];
        const alreadyChecked = records.find(r => r.studentId === studentId);

        if (alreadyChecked) {
            return NextResponse.json({
                success: true, alreadyCheckedIn: true,
                message: 'คุณเช็คชื่อไปแล้วในรอบนี้',
                checkedAt: alreadyChecked.checkedAt,
            });
        }

        const checkedAt = new Date(Date.now() + 7 * 60 * 60 * 1000);
        records.push({ studentId, enrollmentId: enrollment.student_enrollment_id, checkedAt });
        recordsStore.set(roundKey, records);

        return NextResponse.json({ success: true, alreadyCheckedIn: false, message: 'เช็คชื่อสำเร็จ!', checkedAt });

    } catch (error) {
        console.error('Attendance check-in error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเช็คชื่อ' }, { status: 500 });
    }
}

// GET /api/student/attendance/checkin?campId=xxx
export async function GET(req) {
    const { student, error: authError } = await requireStudent();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const campId = parseInt(searchParams.get('campId') || '0');
    if (!campId) return NextResponse.json({ error: 'กรุณาระบุ campId' }, { status: 400 });

    // ตรวจทุกรอบของค่ายนี้
    const allKeys = [...recordsStore.keys()].filter(k => k.startsWith(`${campId}:`));
    let isCheckedIn = false, checkedAt = null;
    for (const key of allKeys) {
        const record = (recordsStore.get(key) ?? []).find(r => r.studentId === student.students_id);
        if (record) { isCheckedIn = true; checkedAt = record.checkedAt; break; }
    }

    return NextResponse.json({ isCheckedIn, checkedAt });
}
