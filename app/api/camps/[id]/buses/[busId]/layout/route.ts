// @ts-nocheck
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireSpecificCampBus } from "@/lib/camp-bus-auth";

const layoutSchema = z.object({
  assignments: z.array(
    z.object({
      assignmentId: z.number().int().positive(),
      positionId: z.number().int().positive().nullable(),
    }),
  ),
});

export async function PUT(request: Request, context: any) {
  const { id, busId: rawBusId } = await context.params;
  const campId = Number(id);
  const busId = Number(rawBusId);

  if (!Number.isInteger(campId) || !Number.isInteger(busId)) {
    return NextResponse.json({ error: "รหัสรถไม่ถูกต้อง" }, { status: 400 });
  }

  const access = await requireSpecificCampBus(campId, busId);

  if (access.error) return access.error;

  const bus = await prisma.camp_bus.findUnique({
    where: { bus_id: busId },
    select: {
      status: true,
      assignments: { select: { assignment_id: true } },
      floors: {
        select: {
          positions: { select: { position_id: true } },
        },
      },
    },
  });

  if (!bus) {
    return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
  }

  if (bus.status === "TRAVELING") {
    return NextResponse.json(
      { error: "รถกำลังเดินทาง ไม่สามารถแก้ไขผังได้" },
      { status: 409 },
    );
  }

  let body;

  try {
    body = layoutSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "รูปแบบการจัดที่นั่งไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const assignmentIds = new Set(
    bus.assignments.map((assignment) => assignment.assignment_id),
  );
  const positionIds = new Set(
    bus.floors.flatMap((floor) =>
      floor.positions.map((position) => position.position_id),
    ),
  );
  const selectedPositionIds = new Set<number>();

  for (const item of body.assignments) {
    if (!assignmentIds.has(item.assignmentId)) {
      return NextResponse.json(
        { error: "พบรายชื่อนักเรียนที่ไม่อยู่ในรถคันนี้" },
        { status: 400 },
      );
    }

    if (item.positionId !== null) {
      if (!positionIds.has(item.positionId)) {
        return NextResponse.json(
          { error: "พบตำแหน่งที่ไม่อยู่ในรถคันนี้" },
          { status: 400 },
        );
      }

      if (selectedPositionIds.has(item.positionId)) {
        return NextResponse.json(
          { error: "มีนักเรียนมากกว่าหนึ่งคนถูกจัดไว้ตำแหน่งเดียวกัน" },
          { status: 400 },
        );
      }

      selectedPositionIds.add(item.positionId);
    }
  }

  if (selectedPositionIds.size === 0) {
    return NextResponse.json(
      { error: "กรุณาจัดที่นั่งให้นักเรียนอย่างน้อย 1 คนก่อนบันทึกผัง" },
      { status: 400 },
    );
  }

  let initialBoardingApplied = false;

  try {
    await prisma.$transaction(
      async (tx) => {
        const existingAssignments = await tx.camp_bus_student.findMany({
          where: { bus_bus_id: busId },
          select: {
            assignment_id: true,
            status: true,
          },
        });
        const firstDeparture = await tx.camp_bus_event.findFirst({
          where: { bus_bus_id: busId, event_type: "DEPART" },
          select: { event_id: true },
        });

        // Clear the current positions first. This makes seat swaps safe because
        // position_position_id is unique and updating one student at a time can
        // otherwise fail when two students exchange seats.
        await tx.camp_bus_student.updateMany({
          where: { bus_bus_id: busId },
          data: { position_position_id: null },
        });

        for (const item of body.assignments) {
          await tx.camp_bus_student.update({
            where: { assignment_id: item.assignmentId },
            data: { position_position_id: item.positionId },
          });
        }

        // During the initial setup, choosing a seat is the teacher's boarding
        // confirmation. Once the bus has departed for the first time, students
        // must confirm boarding themselves for each subsequent trip.
        if (!firstDeparture) {
          initialBoardingApplied = true;
          const seatedAssignmentIds = new Set(
            body.assignments
              .filter((item) => item.positionId !== null)
              .map((item) => item.assignmentId),
          );
          const newlyBoarded = existingAssignments.filter(
            (assignment) =>
              seatedAssignmentIds.has(assignment.assignment_id) &&
              assignment.status !== "ON_BUS",
          );
          const removedFromBus = existingAssignments.filter(
            (assignment) => !seatedAssignmentIds.has(assignment.assignment_id),
          );
          const boardedAt = new Date();
          const teacherId = Number(access.permission?.teacher?.teachers_id) || null;

          if (newlyBoarded.length > 0) {
            await tx.camp_bus_student.updateMany({
              where: {
                assignment_id: {
                  in: newlyBoarded.map((assignment) => assignment.assignment_id),
                },
              },
              data: { status: "ON_BUS", last_boarded_at: boardedAt },
            });

            await tx.camp_bus_event.createMany({
              data: newlyBoarded.map((assignment) => ({
                bus_bus_id: busId,
                student_assignment_id: assignment.assignment_id,
                teacher_teachers_id: teacherId,
                event_type: "BOARD",
                created_at: boardedAt,
              })),
            });
          }

          if (removedFromBus.length > 0) {
            await tx.camp_bus_student.updateMany({
              where: {
                assignment_id: {
                  in: removedFromBus.map((assignment) => assignment.assignment_id),
                },
              },
              data: { status: "OFF_BUS" },
            });
          }
        }
      },
      { maxWait: 10000, timeout: 30000 },
    );
  } catch (error) {
    console.error("Failed to save bus layout", error);

    return NextResponse.json(
      { error: "บันทึกผังรถไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    initialBoardingApplied,
    message: initialBoardingApplied
      ? "บันทึกผังแล้ว และเช็คชื่อขึ้นรถให้นักเรียนที่จัดที่นั่งแล้ว"
      : "บันทึกผังรถแล้ว",
  });
}
