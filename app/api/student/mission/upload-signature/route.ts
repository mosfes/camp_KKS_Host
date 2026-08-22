import { NextResponse } from "next/server";

import cloudinary, { isCloudinaryConfigured } from "@/config/cloudinary";
import { requireStudent } from "@/lib/auth";
import { isBangkokDateBefore } from "@/lib/bangkok-date";
import { prisma } from "@/lib/db";
import { isPrismaConnectionBusy } from "@/lib/prisma-transient-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_FOLDER = "camp-submissions";
const FALLBACK_TRANSFORMATION = "c_limit,h_1920,w_1920,q_auto";
const UPLOAD_PRESET_ENV = "CLOUDINARY_UPLOAD_PRESET";

/**
 * Issue a short-lived signed upload request for one photo question only.
 * The image bytes go directly from the student's browser to Cloudinary.
 */
export async function POST(request: Request) {
  const { student, error: authError } = await requireStudent();

  if (authError) return authError;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "ระบบอัปโหลดรูปยังไม่ได้ตั้งค่า Cloudinary บนเซิร์ฟเวอร์" },
      { status: 503 },
    );
  }

  const uploadPreset = process.env[UPLOAD_PRESET_ENV];

  if (!uploadPreset) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า Cloudinary upload preset สำหรับรูปภารกิจ" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const studentId = Number((student as any).students_id);
    const campId = Number(body?.campId);
    const missionId = Number(body?.missionId);
    const questionId = Number(body?.questionId);
    const useFallback = body?.useFallback === true;

    if (
      !Number.isInteger(campId) ||
      !Number.isInteger(missionId) ||
      !Number.isInteger(questionId) ||
      campId <= 0 ||
      missionId <= 0 ||
      questionId <= 0
    ) {
      return NextResponse.json(
        { error: "ข้อมูลภารกิจไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const mission = await prisma.mission.findUnique({
      where: { mission_id: missionId },
      select: {
        type: true,
        station: {
          select: {
            camp_camp_id: true,
            camp: { select: { start_date: true } },
          },
        },
        mission_question: {
          where: { question_id: questionId },
          select: { question_type: true },
        },
      },
    });

    if (
      !mission ||
      mission.type !== "PHOTO_SUBMISSION" ||
      mission.station.camp_camp_id !== campId ||
      mission.mission_question[0]?.question_type !== "PHOTO"
    ) {
      return NextResponse.json(
        { error: "ไม่พบภารกิจรูปภาพหรือไม่มีสิทธิ์อัปโหลด" },
        { status: 404 },
      );
    }

    if (isBangkokDateBefore(new Date(), mission.station.camp.start_date)) {
      return NextResponse.json(
        { error: "ค่ายยังไม่เริ่ม ไม่สามารถทำภารกิจได้" },
        { status: 403 },
      );
    }

    const enrollment = await prisma.student_enrollment.findFirst({
      where: {
        student_students_id: studentId,
        camp_camp_id: campId,
        enrolled_at: { not: null },
      },
      select: { student_enrollment_id: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "ยังไม่ได้ลงทะเบียนเข้าร่วมค่าย" },
        { status: 403 },
      );
    }

    const config = cloudinary.config();
    const apiSecret = config.api_secret;

    if (!config.cloud_name || !config.api_key || !apiSecret) {
      return NextResponse.json(
        { error: "ระบบอัปโหลดรูปยังไม่ได้ตั้งค่า Cloudinary บนเซิร์ฟเวอร์" },
        { status: 503 },
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `${UPLOAD_FOLDER}/${campId}/${missionId}/${studentId}`;
    const transformation = useFallback ? FALLBACK_TRANSFORMATION : undefined;
    const paramsToSign = {
      folder,
      timestamp,
      upload_preset: uploadPreset,
      ...(transformation ? { transformation } : {}),
    };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return NextResponse.json({
      cloudName: config.cloud_name,
      apiKey: config.api_key,
      timestamp,
      folder,
      uploadPreset,
      transformation,
      signature,
    });
  } catch (error) {
    if (isPrismaConnectionBusy(error)) {
      return NextResponse.json(
        {
          error: "ระบบกำลังมีผู้ใช้งานพร้อมกัน กรุณารอสักครู่",
          code: "MISSION_UPLOAD_BUSY",
          retryable: true,
        },
        { status: 503, headers: { "Retry-After": "1" } },
      );
    }

    console.error("[student mission upload signature] error:", error);

    return NextResponse.json(
      { error: "ไม่สามารถเตรียมการอัปโหลดรูปได้" },
      { status: 500 },
    );
  }
}
