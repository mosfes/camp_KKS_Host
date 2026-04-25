import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireStudent } from '@/lib/auth';

function getMissionSecret(missionId, campId) {
    const base = process.env.QR_SECRET || 'CAMP_QR_SECRET_2024';
    return Buffer.from(`${base}:${missionId}:${campId}`).toString('base64').slice(0, 12);
}

function generatePin(missionId, campId) {
    const secret = getMissionSecret(missionId, campId);
    let num = 0;
    for (let i = 0; i < secret.length; i++) {
        num = (num * 31 + secret.charCodeAt(i)) % 1000000;
    }
    return String(num).padStart(6, '0');
}

function verifyQRPayload(payload) {
    try {
        if (!payload || typeof payload !== 'string') return null;
        const parts = payload.split(':');
        if (parts.length !== 4 || parts[0] !== 'CAMP_MISSION') return null;
        const [, missionId, campId, secret] = parts;
        const expectedSecret = getMissionSecret(parseInt(missionId), parseInt(campId));
        if (secret !== expectedSecret) return null;
        return { missionId: parseInt(missionId), campId: parseInt(campId) };
    } catch {
        return null;
    }
}

async function recordCompletion(studentId, missionId, campId) {
    // Find enrollment
    const enrollment = await prisma.student_enrollment.findFirst({
        where: {
            student_students_id: studentId,
            camp_camp_id: campId,
            enrolled_at: { not: null }
        }
    });

    if (!enrollment) return { error: 'ยังไม่ได้ลงทะเบียนเข้าร่วมค่าย', status: 403 };

    // Check if already completed
    const existing = await prisma.mission_result.findFirst({
        where: {
            student_enrollment_id: enrollment.student_enrollment_id,
            mission_mission_id: missionId,
            status: 'completed'
        }
    });

    if (existing) {
        return { success: true, alreadyCompleted: true, message: 'คุณได้ทำภารกิจนี้แล้ว' };
    }

    await prisma.mission_result.create({
        data: {
            method: 'QR',
            status: 'completed',
            submitted_at: new Date(Date.now() + 7 * 60 * 60 * 1000),
            student_enrollment_id: enrollment.student_enrollment_id,
            mission_mission_id: missionId
        }
    });

    return { success: true, alreadyCompleted: false, message: 'สำเร็จ! ภารกิจเสร็จสิ้น' };
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
            decoded = verifyQRPayload(qrPayload);
            if (!decoded) {
                return NextResponse.json({ error: 'QR Code ไม่ถูกต้องหรือหมดอายุ' }, { status: 400 });
            }
        }
        // --- Mode 2: PIN ---
        else if (pin && pinMissionId) {
            const missionId = parseInt(pinMissionId);
            const mission = await prisma.mission.findUnique({
                where: { mission_id: missionId, deletedAt: null },
                include: { station: true }
            });

            if (!mission || mission.type !== 'QR_CODE_SCANNING') {
                return NextResponse.json({ error: 'ไม่พบภารกิจ' }, { status: 404 });
            }

            const campId = mission.station.camp_camp_id;
            const expectedPin = generatePin(missionId, campId);

            if (String(pin).trim() !== expectedPin) {
                return NextResponse.json({ error: 'รหัส PIN ไม่ถูกต้อง' }, { status: 400 });
            }

            decoded = { missionId, campId };
        } else {
            return NextResponse.json({ error: 'กรุณาแสกน QR Code หรือกรอก PIN' }, { status: 400 });
        }

        const { missionId, campId } = decoded;

        // Verify mission
        const mission = await prisma.mission.findUnique({
            where: { mission_id: missionId, deletedAt: null },
            include: { station: true }
        });

        if (!mission || mission.type !== 'QR_CODE_SCANNING') {
            return NextResponse.json({ error: 'ไม่พบภารกิจหรือประเภทไม่ถูกต้อง' }, { status: 404 });
        }

        if (mission.station.camp_camp_id !== campId) {
            return NextResponse.json({ error: 'ข้อมูลไม่ตรงกับค่ายนี้' }, { status: 400 });
        }

        const result = await recordCompletion(studentId, missionId, campId);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status || 400 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('QR scan error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแสกน' }, { status: 500 });
    }
}
