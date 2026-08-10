import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";
import cloudinary, { isCloudinaryConfigured } from "@/config/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_FOLDER = "camp-uploads";

/**
 * Return a short-lived Cloudinary signature so the browser can upload the
 * image directly. The image itself never passes through the Vercel Function.
 */
export async function POST() {
  const { error: authError } = await requireTeacher();

  if (authError) return authError;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "ระบบอัปโหลดรูปยังไม่ได้ตั้งค่า Cloudinary บนเซิร์ฟเวอร์" },
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

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = {
      folder: UPLOAD_FOLDER,
      timestamp,
    };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return NextResponse.json({
      cloudName: config.cloud_name,
      apiKey: config.api_key,
      timestamp,
      folder: UPLOAD_FOLDER,
      signature,
    });
  } catch (error: any) {
    console.error("[upload/signature] Cloudinary error:", error);

    return NextResponse.json(
      { error: "ไม่สามารถเตรียมการอัปโหลดรูปได้" },
      { status: 500 },
    );
  }
}
