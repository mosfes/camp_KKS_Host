import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Kept as a compatibility response for old clients. Profile images must use
 * /api/student/profile/upload-signature and upload directly to Cloudinary so
 * image bytes never pass through a Vercel Function.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "ช่องทางนี้ถูกยกเลิกแล้ว กรุณาใช้การอัปโหลดรูปโปรไฟล์แบบ direct ไปยัง Cloudinary",
    },
    { status: 410 },
  );
}
