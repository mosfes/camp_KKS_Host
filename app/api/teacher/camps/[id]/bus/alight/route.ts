import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(_request: Request, context: any) {
  const { teacher, error: authError } = await requireTeacher();

  if (authError) return authError;

  const { id } = await context.params;
  const campId = Number(id);
  const teacherId = Number(teacher.teachers_id);

  if (!Number.isInteger(campId) || campId <= 0) {
    return NextResponse.json({ error: "รหัสค่ายไม่ถูกต้อง" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.camp_bus_teacher.findFirst({
      where: {
        camp_camp_id: campId,
        teacher_teachers_id: teacherId,
        removed_at: null,
      },
      select: {
        assignment_id: true,
        status: true,
        bus: { select: { bus_id: true, status: true } },
      },
    });

    if (!assignment) {
      return { error: "ยังไม่มีรถที่จัดให้คุณ", status: 404 };
    }

    if (assignment.bus.status === "TRAVELING") {
      return {
        error: "รถกำลังเดินทาง กรุณารอรถจอดก่อนกดลงจากรถ",
        status: 409,
      };
    }

    if (assignment.status === "OFF_BUS") {
      return { alreadyAlighted: true };
    }

    const alightedAt = new Date();
    const updated = await tx.camp_bus_teacher.updateMany({
      where: {
        assignment_id: assignment.assignment_id,
        status: "ON_BUS",
        removed_at: null,
      },
      data: { status: "OFF_BUS" },
    });

    if (updated.count === 0) {
      const current = await tx.camp_bus_teacher.findUnique({
        where: { assignment_id: assignment.assignment_id },
        select: { status: true, removed_at: true },
      });

      if (!current || current.removed_at) {
        return {
          error: "รายการรถของคุณถูกเปลี่ยน กรุณาโหลดหน้าใหม่",
          status: 409,
        };
      }

      if (current.status === "OFF_BUS") return { alreadyAlighted: true };

      return { error: "สถานะรถถูกเปลี่ยน กรุณาลองใหม่อีกครั้ง", status: 409 };
    }

    await tx.camp_bus_event.create({
      data: {
        bus_bus_id: assignment.bus.bus_id,
        teacher_assignment_id: assignment.assignment_id,
        teacher_teachers_id: teacherId,
        event_type: "ALIGHT",
        created_at: alightedAt,
      },
    });

    return { alreadyAlighted: false, alightedAt };
  });

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status || 400 },
    );
  }

  return NextResponse.json({
    success: true,
    alreadyAlighted: result.alreadyAlighted,
    alightedAt: result.alightedAt || null,
    message: result.alreadyAlighted ? "คุณลงจากรถแล้ว" : "บันทึกว่าลงจากรถแล้ว",
  });
}
