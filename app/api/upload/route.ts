import { NextResponse } from "next/server";

import cloudinary from "@/config/cloudinary";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/** Upload a Buffer to Cloudinary using upload_stream wrapped in a Promise */
function uploadBuffer(
  buffer: Buffer,
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "camp-uploads",
          resource_type: "image",
          timeout: 120000,
          transformation: [
            { width: 2000, height: 2000, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error("No result from Cloudinary"));
          }
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      )
      .end(buffer); // .end() pushes the buffer and closes the stream
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ขนาดไฟล์ต้องไม่เกิน 20MB" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `ไม่รองรับไฟล์ประเภท ${file.type} (รองรับเฉพาะรูปภาพ)`,
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBuffer(buffer);

    return NextResponse.json(
      { url: result.secure_url, public_id: result.public_id },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[upload] Cloudinary error:", error);

    return NextResponse.json(
      { _error: "อัปโหลดล้มเหลว", details: error?.message ?? String(error) },
      { status: 500 },
    );
  }
}
