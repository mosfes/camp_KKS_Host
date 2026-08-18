// @ts-nocheck
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireSpecificCampBus } from "@/lib/camp-bus-auth";
import {
  getBusLayoutTemplate,
  PHEUNG_THIN_BUS_TEMPLATE_ID,
} from "@/lib/camp-bus-layout-templates";
import { positionLabel } from "@/lib/camp-bus-seating";

const updateBusSchema = z.object({
  name: z.string().trim().min(1).max(100),
  registrationPlate: z.string().trim().max(30).optional().default(""),
  floorCount: z.number().int().min(1).max(2),
  rowCounts: z.array(z.number().int().min(1).max(50)).min(1).max(2),
  layoutTemplateId: z.enum([PHEUNG_THIN_BUS_TEMPLATE_ID]).optional(),
});

function positionKey(
  floorNumber: number,
  rowNumber: number,
  seatIndex: number,
) {
  return [floorNumber, rowNumber, seatIndex].join(":");
}

export async function PUT(request: Request, context: any) {
  const { id, busId: rawBusId } = await context.params;
  const campId = Number(id);
  const busId = Number(rawBusId);

  if (!Number.isInteger(campId) || !Number.isInteger(busId)) {
    return NextResponse.json({ error: "รหัสรถไม่ถูกต้อง" }, { status: 400 });
  }

  const access = await requireSpecificCampBus(campId, busId);

  if (access.error) return access.error;

  let body;

  try {
    body = updateBusSchema.parse(await request.json());
  } catch (error: any) {
    return NextResponse.json(
      { error: "ข้อมูลรถไม่ครบหรือไม่ถูกต้อง", details: error?.issues },
      { status: 400 },
    );
  }

  const layoutTemplate = getBusLayoutTemplate(body.layoutTemplateId);
  const floorCount = layoutTemplate?.floors.length || body.floorCount;
  const rowCounts = layoutTemplate
    ? layoutTemplate.floors.map((floor) => floor.rowCount)
    : body.rowCounts;

  if (rowCounts.length !== floorCount) {
    return NextResponse.json(
      { error: "จำนวนแถวต้องตรงกับจำนวนชั้นของรถ" },
      { status: 400 },
    );
  }

  const bus = await prisma.camp_bus.findUnique({
    where: { bus_id: busId },
    include: {
      floors: {
        orderBy: { floor_number: "asc" },
        include: {
          positions: {
            orderBy: [{ row_number: "asc" }, { seat_index: "asc" }],
            include: { assignment: { select: { assignment_id: true } } },
          },
        },
      },
      assignments: { select: { assignment_id: true } },
    },
  });

  if (!bus) {
    return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
  }

  if (bus.status === "TRAVELING") {
    return NextResponse.json(
      { error: "รถกำลังเดินทาง ไม่สามารถแก้ไขข้อมูลรถได้" },
      { status: 409 },
    );
  }

  const capacity =
    layoutTemplate?.capacity ||
    rowCounts.reduce((sum, rows) => sum + rows * 4, 0);

  if (capacity < bus.assignments.length) {
    return NextResponse.json(
      {
        error:
          "จำนวนที่นั่งไม่พอ นักเรียน " +
          bus.assignments.length +
          " คน แต่มีที่นั่ง " +
          capacity +
          " ที่",
      },
      { status: 400 },
    );
  }

  const targetPositionKeys = new Set<string>();

  if (layoutTemplate) {
    for (const floor of layoutTemplate.floors) {
      for (const position of floor.positions) {
        targetPositionKeys.add(
          positionKey(
            floor.floorNumber,
            position.rowNumber,
            position.seatIndex,
          ),
        );
      }
    }
  } else {
    for (let floorIndex = 0; floorIndex < floorCount; floorIndex += 1) {
      for (let row = 1; row <= rowCounts[floorIndex]; row += 1) {
        for (let seatIndex = 0; seatIndex < 4; seatIndex += 1) {
          targetPositionKeys.add(positionKey(floorIndex + 1, row, seatIndex));
        }
      }
    }
  }

  const assignedPositionsToRemove = bus.floors
    .flatMap((floor) =>
      floor.positions.map((position) => ({
        floorNumber: floor.floor_number,
        position,
      })),
    )
    .filter(
      ({ floorNumber, position }) =>
        position.assignment &&
        !targetPositionKeys.has(
          positionKey(floorNumber, position.row_number, position.seat_index),
        ),
    );

  if (assignedPositionsToRemove.length > 0) {
    return NextResponse.json(
      {
        error:
          "ไม่สามารถลดจำนวนแถวได้ เพราะมีนักเรียนจัดอยู่ในตำแหน่งที่จะถูกลบ",
      },
      { status: 409 },
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.camp_bus.update({
        where: { bus_id: busId },
        data: {
          name: body.name,
          registration_plate: body.registrationPlate,
          floor_count: floorCount,
        },
      });

      const activeFloorIds = new Set<number>();

      for (let floorIndex = 0; floorIndex < floorCount; floorIndex += 1) {
        const floorNumber = floorIndex + 1;
        const rowCount = rowCounts[floorIndex];
        const templateFloor = layoutTemplate?.floors.find(
          (item) => item.floorNumber === floorNumber,
        );
        const existingFloor = bus.floors.find(
          (floor) => floor.floor_number === floorNumber,
        );
        const floor = existingFloor
          ? await tx.camp_bus_floor.update({
              where: { floor_id: existingFloor.floor_id },
              data: { row_count: rowCount },
            })
          : await tx.camp_bus_floor.create({
              data: {
                bus_bus_id: busId,
                floor_number: floorNumber,
                row_count: rowCount,
              },
            });

        activeFloorIds.add(floor.floor_id);

        const existingPositions = new Map(
          (existingFloor?.positions || []).map((position) => [
            positionKey(floorNumber, position.row_number, position.seat_index),
            position,
          ]),
        );
        const positionsToDelete = (existingFloor?.positions || [])
          .filter(
            (position) =>
              !targetPositionKeys.has(
                positionKey(
                  floorNumber,
                  position.row_number,
                  position.seat_index,
                ),
              ),
          )
          .map((position) => position.position_id);

        if (positionsToDelete.length > 0) {
          await tx.camp_bus_position.deleteMany({
            where: { position_id: { in: positionsToDelete } },
          });
        }

        const positionsToCreate = [];

        const targetPositions = templateFloor
          ? templateFloor.positions
          : Array.from({ length: rowCount }, (_, rowIndex) =>
              Array.from({ length: 4 }, (_, seatIndex) => ({
                rowNumber: rowIndex + 1,
                seatIndex,
                label: positionLabel(rowIndex + 1, seatIndex),
              })),
            ).flat();

        for (const targetPosition of targetPositions) {
          const key = positionKey(
            floorNumber,
            targetPosition.rowNumber,
            targetPosition.seatIndex,
          );
          const existingPosition = existingPositions.get(key);

          if (existingPosition) {
            if (existingPosition.label !== targetPosition.label) {
              await tx.camp_bus_position.update({
                where: { position_id: existingPosition.position_id },
                data: { label: targetPosition.label },
              });
            }
          } else {
            positionsToCreate.push({
              floor_floor_id: floor.floor_id,
              row_number: targetPosition.rowNumber,
              seat_index: targetPosition.seatIndex,
              label: targetPosition.label,
            });
          }
        }

        if (positionsToCreate.length > 0) {
          await tx.camp_bus_position.createMany({ data: positionsToCreate });
        }
      }

      const floorsToDelete = bus.floors
        .filter((floor) => !activeFloorIds.has(floor.floor_id))
        .map((floor) => floor.floor_id);

      if (floorsToDelete.length > 0) {
        await tx.camp_bus_floor.deleteMany({
          where: { floor_id: { in: floorsToDelete } },
        });
      }
    },
    { maxWait: 10000, timeout: 30000 },
  );

  return NextResponse.json({
    success: true,
    message: "บันทึกข้อมูลรถเรียบร้อยแล้ว",
  });
}

export async function DELETE(request: Request, context: any) {
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
    select: { bus_id: true },
  });

  if (!bus) {
    return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
  }

  await prisma.camp_bus.delete({ where: { bus_id: busId } });

  return NextResponse.json({
    success: true,
    message: "ลบรถและผังที่นั่งเรียบร้อยแล้ว",
  });
}
