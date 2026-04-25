import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ─── Shared in-memory store (via globalThis to persist across hot reload) ───
// missionId → { pin, nonce, generatedAt }
const qrStore = globalThis._campQrStore ?? (globalThis._campQrStore = new Map());

function generatePin() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function generateNonce() {
    return Math.random().toString(36).slice(2, 12);
}

function getOrCreate(missionId) {
    if (!qrStore.has(missionId)) {
        qrStore.set(missionId, {
            pin: generatePin(),
            nonce: generateNonce(),
            generatedAt: new Date()
        });
    }
    return qrStore.get(missionId);
}

function regenerate(missionId) {
    const data = {
        pin: generatePin(),
        nonce: generateNonce(),
        generatedAt: new Date()
    };
    qrStore.set(missionId, data);
    return data;
}

function buildPayload(missionId, campId, nonce) {
    return `CAMP_MISSION:${missionId}:${campId}:${nonce}`;
}

// ─── Export helpers for qr-scan route ────────────────────────────
export function verifyQRPayload(payload) {
    try {
        if (!payload || typeof payload !== 'string') return null;
        const parts = payload.split(':');
        if (parts.length !== 4 || parts[0] !== 'CAMP_MISSION') return null;
        const [, missionId, campId, nonce] = parts;
        const mid = parseInt(missionId);
        const stored = qrStore.get(mid);
        if (!stored || stored.nonce !== nonce) return null;
        return { missionId: mid, campId: parseInt(campId) };
    } catch {
        return null;
    }
}

export function verifyPin(missionId, pin) {
    const stored = qrStore.get(missionId);
    if (!stored) return false;
    return String(pin).trim() === stored.pin;
}

// ─── GET: ดึง QR+PIN ปัจจุบัน (สร้างใหม่ถ้าไม่มี) ───────────────
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const missionId = parseInt(id);

        const mission = await prisma.mission.findUnique({
            where: { mission_id: missionId },
            include: { station: true }
        });

        if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
        if (mission.type !== 'QR_CODE_SCANNING') return NextResponse.json({ error: 'Not a QR mission' }, { status: 400 });

        const campId = mission.station.camp_camp_id;
        const data = getOrCreate(missionId);
        const qrPayload = buildPayload(missionId, campId, data.nonce);

        return NextResponse.json({
            missionId,
            campId,
            missionTitle: mission.title,
            qrPayload,
            pin: data.pin,
            generatedAt: data.generatedAt
        });
    } catch (error) {
        console.error('QR GET error:', error);
        return NextResponse.json({ error: 'Failed to get QR' }, { status: 500 });
    }
}

// ─── POST: สุ่ม QR + PIN ใหม่ ────────────────────────────────────
export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const missionId = parseInt(id);

        const mission = await prisma.mission.findUnique({
            where: { mission_id: missionId },
            include: { station: true }
        });

        if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
        if (mission.type !== 'QR_CODE_SCANNING') return NextResponse.json({ error: 'Not a QR mission' }, { status: 400 });

        const campId = mission.station.camp_camp_id;
        const data = regenerate(missionId);
        const qrPayload = buildPayload(missionId, campId, data.nonce);

        return NextResponse.json({
            missionId,
            campId,
            missionTitle: mission.title,
            qrPayload,
            pin: data.pin,
            generatedAt: data.generatedAt
        });
    } catch (error) {
        console.error('QR POST error:', error);
        return NextResponse.json({ error: 'Failed to regenerate QR' }, { status: 500 });
    }
}
