import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function getMissionSecret(missionId, campId) {
    const base = process.env.QR_SECRET || 'CAMP_QR_SECRET_2024';
    return Buffer.from(`${base}:${missionId}:${campId}`).toString('base64').slice(0, 12);
}

export function generateQRPayload(missionId, campId) {
    const secret = getMissionSecret(missionId, campId);
    return `CAMP_MISSION:${missionId}:${campId}:${secret}`;
}

// PIN: 6-digit numeric derived from secret (deterministic)
export function generatePin(missionId, campId) {
    const secret = getMissionSecret(missionId, campId);
    let num = 0;
    for (let i = 0; i < secret.length; i++) {
        num = (num * 31 + secret.charCodeAt(i)) % 1000000;
    }
    return String(num).padStart(6, '0');
}

export function verifyQRPayload(payload) {
    try {
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

// GET /api/missions/[id]/qr
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const missionId = parseInt(id);

        const mission = await prisma.mission.findUnique({
            where: { mission_id: missionId },
            include: { station: true }
        });

        if (!mission) {
            return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
        }

        if (mission.type !== 'QR_CODE_SCANNING') {
            return NextResponse.json({ error: 'Mission is not QR type' }, { status: 400 });
        }

        const campId = mission.station.camp_camp_id;
        const qrPayload = generateQRPayload(missionId, campId);
        const pin = generatePin(missionId, campId);

        return NextResponse.json({
            missionId,
            campId,
            missionTitle: mission.title,
            qrPayload,
            pin
        });
    } catch (error) {
        console.error('QR GET error:', error);
        return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 });
    }
}
