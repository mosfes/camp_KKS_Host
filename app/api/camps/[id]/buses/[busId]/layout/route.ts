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
  teacherAssignments: z
    .array(
      z.object({
        teacherId: z.number().int().positive(),
        positionId: z.number().int().positive(),
      }),
    )
    .optional(),
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
      assignments: {
        select: {
          assignment_id: true,
          position_position_id: true,
        },
      },
      teacher_assignments: {
        where: { removed_at: null },
        select: {
          assignment_id: true,
          teacher_teachers_id: true,
          position_position_id: true,
          status: true,
        },
      },
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
  const previousPositionByAssignmentId = new Map(
    bus.assignments.map((assignment) => [
      assignment.assignment_id,
      assignment.position_position_id,
    ]),
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

  if (body.teacherAssignments === undefined) {
    const occupiedTeacherPositionIds = new Set(
      bus.teacher_assignments
        .map((assignment) => assignment.position_position_id)
        .filter((positionId): positionId is number => positionId !== null),
    );

    if (
      Array.from(selectedPositionIds).some((positionId) =>
        occupiedTeacherPositionIds.has(positionId),
      )
    ) {
      return NextResponse.json(
        { error: "ตำแหน่งนี้ถูกจัดให้ครูในรถแล้ว" },
        { status: 409 },
      );
    }

    occupiedTeacherPositionIds.forEach((positionId) =>
      selectedPositionIds.add(positionId),
    );
  }

  if (body.teacherAssignments !== undefined) {
    if (!access.permission?.canManageTeachers) {
      return NextResponse.json(
        { error: "เฉพาะแอดมินหรือผู้สร้างค่ายเท่านั้นที่จัดครูลงรถได้" },
        { status: 403 },
      );
    }

    const requestedTeacherIds = body.teacherAssignments.map(
      (item) => item.teacherId,
    );

    if (new Set(requestedTeacherIds).size !== requestedTeacherIds.length) {
      return NextResponse.json(
        { error: "พบรายชื่อครูซ้ำในผังรถ" },
        { status: 400 },
      );
    }

    const eligibleTeachers = await prisma.teachers.findMany({
      where: {
        teachers_id: { in: requestedTeacherIds },
        deletedAt: null,
      },
      select: { teachers_id: true },
    });
    const eligibleTeacherIds = new Set(
      eligibleTeachers.map((teacher) => teacher.teachers_id),
    );

    if (
      requestedTeacherIds.some(
        (teacherId) => !eligibleTeacherIds.has(teacherId),
      )
    ) {
      return NextResponse.json(
        { error: "พบครูที่ไม่มีอยู่ในระบบหรือถูกลบแล้ว" },
        { status: 400 },
      );
    }

    for (const item of body.teacherAssignments) {
      if (!positionIds.has(item.positionId)) {
        return NextResponse.json(
          { error: "พบตำแหน่งครูที่ไม่อยู่ในรถคันนี้" },
          { status: 400 },
        );
      }

      if (selectedPositionIds.has(item.positionId)) {
        return NextResponse.json(
          { error: "มีผู้โดยสารมากกว่าหนึ่งคนถูกจัดไว้ตำแหน่งเดียวกัน" },
          { status: 400 },
        );
      }

      selectedPositionIds.add(item.positionId);
    }

    const teachersOnOtherBuses = await prisma.camp_bus_teacher.findMany({
      where: {
        camp_camp_id: campId,
        teacher_teachers_id: { in: requestedTeacherIds },
        bus_bus_id: { not: busId },
        removed_at: null,
      },
      select: { teacher_teachers_id: true },
    });

    if (teachersOnOtherBuses.length > 0) {
      return NextResponse.json(
        { error: "มีครูบางคนถูกจัดอยู่ในรถคันอื่นของค่ายแล้ว" },
        { status: 409 },
      );
    }

    const requestedTeacherIdSet = new Set(requestedTeacherIds);
    const activeTeachersToRemove = bus.teacher_assignments.filter(
      (assignment) =>
        assignment.status === "ON_BUS" &&
        !requestedTeacherIdSet.has(assignment.teacher_teachers_id),
    );

    if (activeTeachersToRemove.length > 0) {
      return NextResponse.json(
        { error: "กรุณาให้ครูลงจากรถก่อนนำออกจากผังที่นั่ง" },
        { status: 409 },
      );
    }
  }

  if (selectedPositionIds.size === 0) {
    return NextResponse.json(
      { error: "กรุณาจัดที่นั่งให้ผู้โดยสารอย่างน้อย 1 คนก่อนบันทึกผัง" },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        // Clear the current positions first. This makes seat swaps safe because
        // position_position_id is unique and updating one student at a time can
        // otherwise fail when two students exchange seats.
        await tx.camp_bus_student.updateMany({
          where: { bus_bus_id: busId },
          data: { position_position_id: null },
        });

        if (body.teacherAssignments !== undefined) {
          const requestedTeacherIds = body.teacherAssignments.map(
            (item) => item.teacherId,
          );

          await tx.camp_bus_teacher.updateMany({
            where: { bus_bus_id: busId, removed_at: null },
            data: { position_position_id: null },
          });
          await tx.camp_bus_teacher.updateMany({
            where: {
              bus_bus_id: busId,
              teacher_teachers_id: { notIn: requestedTeacherIds },
              removed_at: null,
              status: "OFF_BUS",
            },
            data: {
              position_position_id: null,
              removed_at: new Date(),
            },
          });

          for (const item of body.teacherAssignments) {
            const existingAssignment = await tx.camp_bus_teacher.findUnique({
              where: {
                camp_camp_id_teacher_teachers_id: {
                  camp_camp_id: campId,
                  teacher_teachers_id: item.teacherId,
                },
              },
              select: {
                assignment_id: true,
                bus_bus_id: true,
                removed_at: true,
              },
            });

            if (existingAssignment) {
              if (
                existingAssignment.bus_bus_id !== busId &&
                existingAssignment.removed_at === null
              ) {
                throw new Error("TEACHER_ASSIGNED_TO_ANOTHER_BUS");
              }

              await tx.camp_bus_teacher.update({
                where: { assignment_id: existingAssignment.assignment_id },
                data: {
                  bus_bus_id: busId,
                  position_position_id: item.positionId,
                  removed_at: null,
                  ...(existingAssignment.removed_at
                    ? { status: "OFF_BUS" as const }
                    : {}),
                },
              });
            } else {
              await tx.camp_bus_teacher.create({
                data: {
                  camp_camp_id: campId,
                  bus_bus_id: busId,
                  teacher_teachers_id: item.teacherId,
                  position_position_id: item.positionId,
                },
              });
            }
          }
        }

        for (const item of body.assignments) {
          const isNewlySeated =
            item.positionId !== null &&
            previousPositionByAssignmentId.get(item.assignmentId) === null;

          await tx.camp_bus_student.update({
            where: { assignment_id: item.assignmentId },
            data: {
              position_position_id: item.positionId,
              ...(isNewlySeated ? { status: "OFF_BUS" as const } : {}),
            },
          });
        }
      },
      { maxWait: 10000, timeout: 30000 },
    );
  } catch (error: any) {
    // Keep the server-side detail for diagnosis while returning a safe message.
    // eslint-disable-next-line no-console
    console.error("Failed to save bus layout", error);

    if (error?.message === "TEACHER_ASSIGNED_TO_ANOTHER_BUS") {
      return NextResponse.json(
        { error: "มีครูบางคนถูกจัดอยู่ในรถคันอื่นของค่ายแล้ว" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "บันทึกผังรถไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "บันทึกผังรถแล้ว นักเรียนที่จัดที่นั่งยังต้องยืนยันขึ้นรถเอง",
  });
}
