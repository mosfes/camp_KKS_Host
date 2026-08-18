import { NextResponse } from "next/server";

import cloudinary, { isCloudinaryConfigured } from "@/config/cloudinary";
import { requireStudent } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROFILE_UPLOAD_BYTES = 5 * 1024 * 1024;
const UPLOAD_FOLDER = "camp_profiles";

/**
 * Verify the asset that was uploaded directly to Cloudinary before its URL is
 * accepted by the profile PUT endpoint. This is a server-side second check;
 * the browser's file-size check is only a UX optimization.
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
    const publicId = typeof body?.publicId === "string" ? body.publicId : "";
    const studentId = Number(student.students_id);
    const expectedPublicId = `${UPLOAD_FOLDER}/student_${studentId}/profile`;

    if (!publicId || publicId !== expectedPublicId) {
      return NextResponse.json(
        { error: "รูปโปรไฟล์ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งานไฟล์นี้" },
        { status: 403 },
      );
    }

    const resource = await cloudinary.api.resource(publicId, {
      resource_type: "image",
      type: "upload",
    });
    const bytes = Number(resource.bytes);

    if (
      !Number.isFinite(bytes) ||
      bytes <= 0 ||
      bytes > MAX_PROFILE_UPLOAD_BYTES
    ) {
      await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: "image",
        type: "upload",
      });

      return NextResponse.json(
        { error: "ขนาดไฟล์รูปโปรไฟล์ต้องไม่เกิน 5MB" },
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
    console.error("[student profile upload commit] error:", error);

    return NextResponse.json(
      { error: error?.error?.message || "ไม่สามารถตรวจสอบรูปโปรไฟล์ได้" },
      { status: 500 },
    );
  }
}
