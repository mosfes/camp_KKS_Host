import { NextResponse } from "next/server";

import cloudinary, { isCloudinaryConfigured } from "@/config/cloudinary";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_FOLDER = "camp-certificates";
const PUBLIC_ID = "template";
const UPLOAD_PRESET_ENV = "CLOUDINARY_UPLOAD_PRESET";

/**
 * Issue a short-lived signature for the certificate template only.
 * The browser uploads directly to Cloudinary; the image never passes through
 * a Vercel Function.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { teacher, error: authError } = await requireTeacher();

  if (authError) return authError;

  const params = await context.params;
  const campId = Number(params.id);

  if (!Number.isInteger(campId) || campId <= 0) {
    return NextResponse.json({ error: "รหัสค่ายไม่ถูกต้อง" }, { status: 400 });
  }

  const camp = await prisma.camp.findFirst({
    where: { camp_id: campId, deletedAt: null },
    select: { created_by_teacher_id: true },
  });

  if (!camp) {
    return NextResponse.json({ error: "ไม่พบค่าย" }, { status: 404 });
  }

  if (
    camp.created_by_teacher_id !== teacher.teachers_id &&
    teacher.role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "ไม่มีสิทธิ์แก้ไขกรอบเกียรติบัตรของค่ายนี้" },
      { status: 403 },
    );
  }

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
        error:
          "ยังไม่ได้ตั้งค่า Cloudinary upload preset สำหรับกรอบเกียรติบัตร",
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

    const timestamp = Math.floor(Date.now() / 1000);
    // A deterministic ID per camp makes every replacement overwrite the
    // existing template instead of creating another Cloudinary asset.
    const folder = `${UPLOAD_FOLDER}/${campId}`;
    const paramsToSign = {
      folder,
      invalidate: true,
      overwrite: true,
      public_id: PUBLIC_ID,
      timestamp,
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
      publicId: PUBLIC_ID,
      uploadPreset,
      overwrite: true,
      invalidate: true,
      signature,
    });
  } catch (error) {
    console.error("[certificate upload signature] error:", error);

    return NextResponse.json(
      { error: "ไม่สามารถเตรียมการอัปโหลดกรอบเกียรติบัตรได้" },
      { status: 500 },
    );
  }
}
