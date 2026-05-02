// @ts-nocheck
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

/**
 * GET - ดึงรายการ template ทั้งหมด (เฉพาะข้อมูลพื้นฐาน)
 */
export async function GET() {
  try {
    const templates = await prisma.camp_template.findMany({
      select: {
        camp_template_id: true,
        name: true,
        camp: {
          select: {
            camp_id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        camp_template_id: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch {
    //     console.error("Error fetching templates:", error);

    return NextResponse.json(
      {
        _error: "ไม่สามารถดึงข้อมูล Template ได้",
      },
      { status: 500 },
    );
  }
}
