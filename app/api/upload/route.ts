// @ts-nocheck
import { NextResponse } from "next/server";
import { Readable } from "stream";

import cloudinary from "@/config/cloudinary";

// App Router: opt-out of static generation and allow longer execution time
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds (Vercel hobby allows 60s)

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/** Upload a ReadableStream to Cloudinary via the upload_stream API */
function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "camp-uploads",
        resource_type: "image",
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("No result"));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );

    // Pipe a Node.js Readable from the buffer into the upload stream
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Server-side file-size guard
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 20MB limit" },
        { status: 400 },
      );
    }

    // Server-side MIME-type guard (prevent XSS / malicious uploads)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `ไม่อนุญาตให้อัปโหลดไฟล์ประเภท ${file.type} (รองรับเฉพาะรูปภาพ)`,
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToCloudinary(buffer, file.type);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error uploading file to Cloudinary:", error);

    return NextResponse.json(
      { _error: "Error uploading file", details: error?.message },
      { status: 500 },
    );
  }
}
