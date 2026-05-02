// @ts-nocheck
import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";

// campId → { pin, nonce, generatedAt, expiresAt, description, roundId }
const attendanceStore =
  globalThis._campAttendanceStore ??
  (globalThis._campAttendanceStore = new Map());
// campId → RoundInfo[]
const roundsStore =
  globalThis._campAttendanceRounds ??
  (globalThis._campAttendanceRounds = new Map());

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function generateNonce() {
  return Math.random().toString(36).slice(2, 12);
}
function generateRoundId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function buildPayload(campId, nonce) {
  return `CAMP_ATTEND:${campId}:${nonce}`;
}

function closeRound(campId, roundId) {
  const rounds = roundsStore.get(campId) ?? [];
  const round = rounds.find((r) => r.roundId === roundId);

  if (round) {
    round.isClosed = true;
    round.closedAt = new Date();
  }
}

function verifyAttendanceQR(payload) {
  try {
    if (!payload || typeof payload !== "string") return null;
    const parts = payload.split(":");

    if (parts.length !== 3 || parts[0] !== "CAMP_ATTEND") return null;
    const [, campId, nonce] = parts;
    const cid = parseInt(campId);
    const stored = attendanceStore.get(cid);

    if (!stored || stored.nonce !== nonce) return null;
    if (stored.expiresAt && new Date() > new Date(stored.expiresAt))
      return null;

    return { campId: cid, roundId: stored.roundId };
  } catch {
    return null;
  }
}

function verifyAttendancePin(campId, pin) {
  const stored = attendanceStore.get(campId);

  if (!stored) return null;
  if (stored.expiresAt && new Date() > new Date(stored.expiresAt)) return null;
  if (String(pin).trim() !== stored.pin) return null;

  return { roundId: stored.roundId };
}

function getAttendanceSession(campId) {
  const stored = attendanceStore.get(campId);

  if (stored && stored.expiresAt && new Date() > new Date(stored.expiresAt)) {
    closeRound(campId, stored.roundId);
    attendanceStore.delete(campId);

    return null;
  }

  return stored ?? null;
}

// GET: session ปัจจุบัน + ประวัติรอบทั้งหมด
export async function GET(request, { params }) {
  const { error: authError } = await requireTeacher();

  if (authError) return authError;

  const { campId } = await params;
  const cid = parseInt(campId);
  const session = getAttendanceSession(cid);
  const rounds = roundsStore.get(cid) ?? [];

  if (!session) return NextResponse.json({ active: false, rounds });

  return NextResponse.json({
    active: true,
    campId: cid,
    roundId: session.roundId,
    qrPayload: buildPayload(cid, session.nonce),
    pin: session.pin,
    generatedAt: session.generatedAt,
    expiresAt: session.expiresAt,
    description: session.description,
    rounds,
  });
}

// POST: สร้างรอบเช็คชื่อใหม่
export async function POST(request, { params }) {
  const { error: authError } = await requireTeacher();

  if (authError) return authError;

  const { campId } = await params;
  const cid = parseInt(campId);

  let description = "",
    durationMinutes = 60;

  try {
    const body = await request.json();

    description = body.description || "";
    if (body.durationMinutes) durationMinutes = parseInt(body.durationMinutes);
  } catch {}

  // ปิดรอบเก่าถ้ามีอยู่
  const existing = attendanceStore.get(cid);

  if (existing) closeRound(cid, existing.roundId);

  const rounds = roundsStore.get(cid) ?? [];
  const roundNumber = rounds.length + 1;
  const roundId = generateRoundId();
  const nonce = generateNonce();
  const pin = generatePin();
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + durationMinutes * 60000);

  attendanceStore.set(cid, {
    pin,
    nonce,
    generatedAt,
    expiresAt,
    description,
    roundId,
  });

  rounds.push({
    roundId,
    roundNumber,
    description: description || `รอบที่ ${roundNumber}`,
    createdAt: generatedAt,
    expiresAt,
    isClosed: false,
    closedAt: null,
  });
  roundsStore.set(cid, rounds);

  return NextResponse.json({
    active: true,
    campId: cid,
    roundId,
    qrPayload: buildPayload(cid, nonce),
    pin,
    generatedAt,
    expiresAt,
    description,
    rounds,
  });
}

// DELETE: ปิดรอบปัจจุบัน
export async function DELETE(request, { params }) {
  const { error: authError } = await requireTeacher();

  if (authError) return authError;

  const { campId } = await params;
  const cid = parseInt(campId);

  const existing = attendanceStore.get(cid);

  if (existing) {
    closeRound(cid, existing.roundId);
    attendanceStore.delete(cid);
  }

  return NextResponse.json({
    success: true,
    message: "ปิดรับเช็คชื่อแล้ว",
    rounds: roundsStore.get(cid) ?? [],
  });
}
