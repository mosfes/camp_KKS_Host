import { NextResponse } from "next/server";

import cloudinary, { isCloudinaryConfigured } from "@/config/cloudinary";
import { requireStudent } from "@/lib/auth";
import { isBangkokDateBefore } from "@/lib/bangkok-date";
import { isCloudinaryPublicId, positiveIntSchema } from "@/lib/api-validation";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MISSION_UPLOAD_BYTES = 20 * 1024 * 1024;

/**
 * Verify a mission image after the browser uploads it directly to Cloudinary.
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

    const resource = await cloudinary.api.resource(publicId, {
      resource_type: "image",
      type: "upload",
    });
    const bytes = Number(resource.bytes);

    if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_MISSION_UPLOAD_BYTES) {
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

    return NextResponse.json({
      url: resource.secure_url,
      publicId: resource.public_id,
      bytes,
      width: Number.isFinite(Number(resource.width))
        ? Number(resource.width)
        : null,
      height: Number.isFinite(Number(resource.height))
        ? Number(resource.height)
        : null,
      format: resource.format || null,
    });
  } catch (error: any) {
    console.error("[student mission upload commit] error:", error);

    return NextResponse.json(
      { error: error?.error?.message || "ไม่สามารถตรวจสอบรูปภารกิจได้" },
      { status: 400 },
    );
  }
}
