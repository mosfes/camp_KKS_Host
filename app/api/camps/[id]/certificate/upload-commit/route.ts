import { NextResponse } from "next/server";

import cloudinary, { isCloudinaryConfigured } from "@/config/cloudinary";
import { requireTeacher } from "@/lib/auth";
import { isCloudinaryPublicId, positiveIntSchema } from "@/lib/api-validation";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CERTIFICATE_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpg", "jpeg", "png"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { teacher, error: authError } = await requireTeacher();

  if (authError) return authError;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "ระบบอัปโหลดรูปยังไม่ได้ตั้งค่า Cloudinary บนเซิร์ฟเวอร์" },
      { status: 503 },
    );
  }

  try {
    const params = await context.params;
    const campIdResult = positiveIntSchema.safeParse(params.id);
    const body = await request.json();
    const publicId = typeof body?.publicId === "string" ? body.publicId : "";

    if (!campIdResult.success) {
      return NextResponse.json({ error: "รหัสค่ายไม่ถูกต้อง" }, { status: 400 });
    }

    const campId = campIdResult.data;
    const expectedPrefix = `camp-certificates/${campId}`;
    const expectedPublicId = `${expectedPrefix}/template`;

    if (publicId !== expectedPublicId || !isCloudinaryPublicId(publicId, expectedPrefix)) {
      return NextResponse.json(
        { error: "กรอบเกียรติบัตรไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งานไฟล์นี้" },
        { status: 403 },
      );
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

    const resource = await cloudinary.api.resource(publicId, {
      resource_type: "image",
      type: "upload",
    });
    const bytes = Number(resource.bytes);
    const format = String(resource.format || "").toLowerCase();

    if (
      !Number.isFinite(bytes) ||
      bytes <= 0 ||
      bytes > MAX_CERTIFICATE_UPLOAD_BYTES ||
      !ALLOWED_FORMATS.has(format)
    ) {
      return NextResponse.json(
        { error: "กรอบเกียรติบัตรต้องเป็น JPG/PNG และมีขนาดไม่เกิน 5MB" },
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
      format,
    });
  } catch (error: any) {
    console.error("[certificate upload commit] error:", error);

    return NextResponse.json(
      { error: error?.error?.message || "ไม่สามารถตรวจสอบกรอบเกียรติบัตรได้" },
      { status: 400 },
    );
  }
}
