import { NextResponse } from "next/server";

import cloudinary, { isCloudinaryConfigured } from "@/config/cloudinary";
import { requireStudent } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_PRESET_ENV = "CLOUDINARY_UPLOAD_PRESET";
const UPLOAD_FOLDER = "camp_profiles";
const TRANSFORMATION = "c_fill,g_face,h_400,w_400";

/**
 * Return a short-lived signature for direct student profile uploads.
 * The upload preset must have a server-side max_file_size (5 MB).
 */
export async function POST() {
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
      {
        error: "ยังไม่ได้ตั้งค่า Cloudinary upload preset สำหรับรูปโปรไฟล์",
      },
      { status: 503 },
    );
  }

  try {
    const config = cloudinary.config();
    const apiSecret = config.api_secret;

    if (!config.cloud_name || !config.api_key || !apiSecret) {
      return NextResponse.json(
        { error: "ระบบอัปโหลดรูปยังไม่ได้ตั้งค่า Cloudinary บนเซิร์ฟเวอร์" },
        { status: 503 },
      );
    }

    const studentId = Number(student.students_id);
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `${UPLOAD_FOLDER}/student_${studentId}`;
    const publicId = "profile";
    const paramsToSign = {
      folder,
      invalidate: true,
      overwrite: true,
      public_id: publicId,
      timestamp,
      transformation: TRANSFORMATION,
      upload_preset: uploadPreset,
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
      publicId,
      uploadPreset,
      transformation: TRANSFORMATION,
      overwrite: true,
      invalidate: true,
      signature,
    });
  } catch (error) {
    console.error("[student profile upload signature] error:", error);

    return NextResponse.json(
      { error: "ไม่สามารถเตรียมการอัปโหลดรูปโปรไฟล์ได้" },
      { status: 500 },
    );
  }
}
