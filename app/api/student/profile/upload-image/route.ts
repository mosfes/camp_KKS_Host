export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import cloudinary from "@/config/cloudinary";

/**
 * POST /api/student/profile/upload-image
 * รับไฟล์ภาพ → อัปโหลดไปยัง Cloudinary (private, signed access only)
 * คืนค่า { public_id } เพื่อเก็บใน DB
 */
export async function POST(req: NextRequest) {
  try {
    // ตรวจสอบ session
    const cookieStore = await cookies();
    const session = cookieStore.get("student_session");
    if (!session?.value)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload: studentSession } = await jwtVerify(session.value, secret);
    const studentId = Number(studentSession.students_id);

    // รับ file จาก form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // ตรวจสอบขนาดไฟล์ (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // แปลงเป็น buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // อัปโหลดไปยัง Cloudinary แบบ public
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = (cloudinary as any).uploader.upload_stream(
        {
          folder: `camp_profiles/student_${studentId}`,
          public_id: `profile`,
          overwrite: true,
          resource_type: "image",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err: any) {
    console.error("Upload image error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
