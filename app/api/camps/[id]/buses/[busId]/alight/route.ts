import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSpecificCampBus } from "@/lib/camp-bus-auth";
import { prisma } from "@/lib/db";

const alightSchema = z.object({
  assignmentId: z.number().int().positive(),
});

export async function POST(request: Request, context: any) {
  const { id, busId: rawBusId } = await context.params;
  const campId = Number(id);
  const busId = Number(rawBusId);

  if (!Number.isInteger(campId) || !Number.isInteger(busId)) {
    return NextResponse.json({ error: "รหัสรถไม่ถูกต้อง" }, { status: 400 });
  }

  const access = await requireSpecificCampBus(campId, busId, "operate");

  if (access.error) return access.error;

  let body;

  try {
    body = alightSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "ข้อมูลนักเรียนไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const teacherId = Number(access.permission?.teacher?.teachers_id) || null;
  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.camp_bus_student.findFirst({
      where: { assignment_id: body.assignmentId, bus_bus_id: busId },
      select: {
        assignment_id: true,
        status: true,
        bus: { select: { status: true } },
      },
    });

    if (!assignment) {
      return { error: "ไม่พบนักเรียนในรถคันนี้", status: 404 };
    }

    if (assignment.bus.status === "TRAVELING") {
      return {
        error: "รถกำลังเดินทาง กรุณารอรถจอดก่อนยืนยันลงรถ",
        status: 409,
      };
    }

    if (assignment.status === "OFF_BUS") {
      return { alreadyAlighted: true };
    }

    const alightedAt = new Date();

    const updated = await tx.camp_bus_student.updateMany({
      where: {
        assignment_id: assignment.assignment_id,
        status: "ON_BUS",
      },
      data: { status: "OFF_BUS" },
    });

    if (updated.count === 0) {
      return { alreadyAlighted: true };
    }

    await tx.camp_bus_event.create({
      data: {
        bus_bus_id: busId,
        student_assignment_id: assignment.assignment_id,
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
    message: result.alreadyAlighted
      ? "นักเรียนไม่ได้อยู่บนรถแล้ว"
      : "ยืนยันนักเรียนลงจากรถแล้ว",
  });
}
