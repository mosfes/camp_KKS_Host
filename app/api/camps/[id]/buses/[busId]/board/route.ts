import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSpecificCampBus } from "@/lib/camp-bus-auth";
import { prisma } from "@/lib/db";

const boardSchema = z.object({
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
    body = boardSchema.parse(await request.json());
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
        participation_status: true,
        last_boarded_at: true,
        position_position_id: true,
        bus: { select: { status: true } },
      },
    });

    if (!assignment) {
      return { error: "ไม่พบนักเรียนในรถคันนี้", status: 404 };
    }

    if (assignment.bus.status === "TRAVELING") {
      return {
        error: "รถกำลังเดินทาง ไม่สามารถยืนยันขึ้นรถได้",
        status: 409,
      };
    }

    if (assignment.participation_status === "NOT_TRAVELING") {
      return {
        error: "นักเรียนถูกระบุว่าไม่ร่วมเดินทางต่อในค่ายนี้",
        status: 409,
      };
    }

    if (!assignment.position_position_id) {
      return {
        error: "ยังไม่ได้จัดที่นั่งให้นักเรียน",
        status: 409,
      };
    }

    if (assignment.status === "ON_BUS") {
      return {
        alreadyBoarded: true,
        checkedAt: assignment.last_boarded_at,
      };
    }

    const checkedAt = new Date();

    const updated = await tx.camp_bus_student.updateMany({
      where: {
        assignment_id: assignment.assignment_id,
        status: "OFF_BUS",
        participation_status: "ACTIVE",
      },
      data: { status: "ON_BUS", last_boarded_at: checkedAt },
    });

    if (updated.count === 0) {
      return {
        alreadyBoarded: true,
        checkedAt: assignment.last_boarded_at,
      };
    }

    await tx.camp_bus_event.create({
      data: {
        bus_bus_id: busId,
        student_assignment_id: assignment.assignment_id,
        teacher_teachers_id: teacherId,
        event_type: "BOARD",
        created_at: checkedAt,
      },
    });

    return { alreadyBoarded: false, checkedAt };
  });

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status || 400 },
    );
  }

  return NextResponse.json({
    success: true,
    alreadyBoarded: result.alreadyBoarded,
    checkedAt: result.checkedAt || null,
    message: result.alreadyBoarded
      ? "นักเรียนอยู่บนรถแล้ว"
      : "ยืนยันนักเรียนขึ้นรถแล้ว",
  });
}
