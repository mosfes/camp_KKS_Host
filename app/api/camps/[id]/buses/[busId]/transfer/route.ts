import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireSpecificCampBus } from "@/lib/camp-bus-auth";

const transferSchema = z.object({
  targetBusId: z.number().int().positive(),
  studentEnrollmentIds: z.array(z.number().int().positive()).min(1).max(500),
});

export async function POST(request: Request, context: any) {
  const { id, busId: rawBusId } = await context.params;
  const campId = Number(id);
  const sourceBusId = Number(rawBusId);

  if (!Number.isInteger(campId) || !Number.isInteger(sourceBusId)) {
    return NextResponse.json({ error: "รหัสรถไม่ถูกต้อง" }, { status: 400 });
  }

  const access = await requireSpecificCampBus(campId, sourceBusId);

  if (access.error) return access.error;

  let body: z.infer<typeof transferSchema>;

  try {
    body = transferSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "กรุณาเลือกรถปลายทางและนักเรียนที่ต้องการย้าย" },
      { status: 400 },
    );
  }

  if (body.targetBusId === sourceBusId) {
    return NextResponse.json(
      { error: "รถต้นทางและปลายทางต้องไม่ใช่คันเดียวกัน" },
      { status: 400 },
    );
  }

  const targetAccess = await requireSpecificCampBus(campId, body.targetBusId);

  if (targetAccess.error) return targetAccess.error;

  const enrollmentIds = Array.from(new Set(body.studentEnrollmentIds));

  if (enrollmentIds.length !== body.studentEnrollmentIds.length) {
    return NextResponse.json(
      { error: "พบรายชื่อนักเรียนซ้ำ" },
      { status: 400 },
    );
  }

  const [sourceBus, targetBus] = await Promise.all([
    prisma.camp_bus.findFirst({
      where: { bus_id: sourceBusId, camp_camp_id: campId },
      select: {
        assignments: {
          where: { student_enrollment_id: { in: enrollmentIds } },
          select: {
            assignment_id: true,
            student_enrollment_id: true,
            status: true,
          },
        },
      },
    }),
    prisma.camp_bus.findFirst({
      where: { bus_id: body.targetBusId, camp_camp_id: campId },
      select: {
        floors: { select: { positions: { select: { position_id: true } } } },
        assignments: { select: { assignment_id: true } },
        teacher_assignments: {
          where: { removed_at: null },
          select: { assignment_id: true },
        },
      },
    }),
  ]);

  if (!sourceBus || !targetBus) {
    return NextResponse.json(
      { error: "ไม่พบรถต้นทางหรือรถปลายทาง" },
      { status: 404 },
    );
  }
  if (sourceBus.assignments.length !== enrollmentIds.length) {
    return NextResponse.json(
      { error: "มีนักเรียนบางคนไม่ได้อยู่ในรถต้นทาง กรุณาโหลดข้อมูลใหม่" },
      { status: 409 },
    );
  }

  const capacity = targetBus.floors.reduce(
    (sum, floor) => sum + floor.positions.length,
    0,
  );
  const occupiedCapacity =
    targetBus.assignments.length + targetBus.teacher_assignments.length;
  const availableCapacity = Math.max(0, capacity - occupiedCapacity);

  if (enrollmentIds.length > availableCapacity) {
    return NextResponse.json(
      {
        error: `รถปลายทางเหลือ ${availableCapacity} ที่ แต่เลือกนักเรียน ${enrollmentIds.length} คน`,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.camp_bus_student.updateMany({
        where: {
          bus_bus_id: sourceBusId,
          student_enrollment_id: { in: enrollmentIds },
        },
        data: {
          bus_bus_id: body.targetBusId,
          position_position_id: null,
        },
      });

      if (updated.count !== enrollmentIds.length) {
        throw new Error("TRANSFER_ASSIGNMENTS_CHANGED");
      }

      const studentsOnBus = sourceBus.assignments.filter(
        (assignment) => assignment.status === "ON_BUS",
      );

      if (studentsOnBus.length > 0) {
        const teacherId = Number(access.permission?.teacher?.teachers_id);
        const transferredAt = new Date();

        await tx.camp_bus_student.updateMany({
          where: {
            assignment_id: {
              in: studentsOnBus.map((assignment) => assignment.assignment_id),
            },
          },
          data: { last_boarded_at: transferredAt },
        });

        await tx.camp_bus_event.createMany({
          data: studentsOnBus.flatMap((assignment) => [
            {
              bus_bus_id: sourceBusId,
              student_assignment_id: assignment.assignment_id,
              teacher_teachers_id: teacherId,
              event_type: "ALIGHT" as const,
            },
            {
              bus_bus_id: body.targetBusId,
              student_assignment_id: assignment.assignment_id,
              teacher_teachers_id: teacherId,
              event_type: "BOARD" as const,
            },
          ]),
        });
      }
    });
  } catch (error: any) {
    if (error?.message === "TRANSFER_ASSIGNMENTS_CHANGED") {
      return NextResponse.json(
        { error: "รายชื่อนักเรียนมีการเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่" },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json({
    success: true,
    movedCount: enrollmentIds.length,
    message: `ย้ายนักเรียน ${enrollmentIds.length} คนไปยังรถปลายทางแล้ว กรุณาจัดที่นั่งใหม่`,
  });
}
