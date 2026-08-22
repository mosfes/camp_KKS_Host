import { NextResponse } from "next/server";

import cloudinary, { isCloudinaryConfigured } from "@/config/cloudinary";
import { requireStudent } from "@/lib/auth";
import { isBangkokDateBefore } from "@/lib/bangkok-date";
import { isCloudinaryPublicId, positiveIntSchema } from "@/lib/api-validation";
import { prisma } from "@/lib/db";
import { isPrismaConnectionBusy } from "@/lib/prisma-transient-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MISSION_UPLOAD_BYTES = 20 * 1024 * 1024;
const cloudinaryUtils = cloudinary.utils as typeof cloudinary.utils & {
  verify_api_response_signature: (
    publicId: string,
    version: string | number,
    signature: string,
  ) => boolean;
};

/**
 * Verify Cloudinary's signed upload response without spending Admin API quota.
 * The returned URL is accepted by mission submit only after this check.
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

  try {
    const body = await request.json();
    const campIdResult = positiveIntSchema.safeParse(body?.campId);
    const missionIdResult = positiveIntSchema.safeParse(body?.missionId);
    const questionIdResult = positiveIntSchema.safeParse(body?.questionId);
    const publicId = typeof body?.publicId === "string" ? body.publicId : "";
    const version = Number(body?.version);
    const responseSignature =
      typeof body?.responseSignature === "string" ? body.responseSignature : "";
    const resourceType =
      typeof body?.resourceType === "string" ? body.resourceType : "";
    const bytes = Number(body?.bytes);
    const width = Number(body?.width);
    const height = Number(body?.height);
    const format = typeof body?.format === "string" ? body.format : "";

    if (
      !campIdResult.success ||
      !missionIdResult.success ||
      !questionIdResult.success
    ) {
      return NextResponse.json(
        { error: "ข้อมูลภารกิจไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    if (
      !Number.isSafeInteger(version) ||
      version <= 0 ||
      !/^[a-f\d]{32,128}$/i.test(responseSignature) ||
      resourceType !== "image" ||
      !Number.isFinite(bytes) ||
      bytes <= 0 ||
      !Number.isFinite(width) ||
      width <= 0 ||
      !Number.isFinite(height) ||
      height <= 0 ||
      !/^[a-z0-9]+$/i.test(format)
    ) {
      return NextResponse.json(
        { error: "ผลการอัปโหลดรูปจาก Cloudinary ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const campId = campIdResult.data;
    const missionId = missionIdResult.data;
    const questionId = questionIdResult.data;
    const studentId = Number(student.students_id);
    const expectedPrefix = `camp-submissions/${campId}/${missionId}/${studentId}`;

    if (!isCloudinaryPublicId(publicId, expectedPrefix)) {
      return NextResponse.json(
        { error: "รูปคำตอบไม่ได้อยู่ในพื้นที่ของนักเรียน" },
        { status: 403 },
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

    const hasValidResponseSignature =
      cloudinaryUtils.verify_api_response_signature(
        publicId,
        version,
        responseSignature,
      );

    if (!hasValidResponseSignature) {
      return NextResponse.json(
        { error: "ไม่สามารถยืนยันผลการอัปโหลดจาก Cloudinary ได้" },
        { status: 403 },
      );
    }

    if (bytes > MAX_MISSION_UPLOAD_BYTES) {
      await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: "image",
        type: "upload",
      });

      return NextResponse.json(
        { error: "ขนาดไฟล์รูปภารกิจต้องไม่เกิน 20MB" },
        { status: 413 },
      );
    }

    const url = cloudinary.url(publicId, {
      secure: true,
      resource_type: "image",
      type: "upload",
      version,
    });

    return NextResponse.json({
      url,
      publicId,
      bytes,
      width,
      height,
      format,
    });
  } catch (error: any) {
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

    console.error("[student mission upload commit] error:", error);

    return NextResponse.json(
      { error: error?.error?.message || "ไม่สามารถตรวจสอบรูปภารกิจได้" },
      { status: 400 },
    );
  }
}
