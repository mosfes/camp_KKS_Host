import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, context: any) {
  const { teacher, error: authError } = await requireTeacher();

  if (authError) return authError;

  const { id } = await context.params;
  const campId = Number(id);
  const teacherId = Number(teacher.teachers_id);

  if (!Number.isInteger(campId) || campId <= 0) {
    return NextResponse.json({ error: "รหัสค่ายไม่ถูกต้อง" }, { status: 400 });
  }

  const assignment = await prisma.camp_bus_teacher.findFirst({
    where: {
      camp_camp_id: campId,
      teacher_teachers_id: teacherId,
      removed_at: null,
    },
    select: {
      assignment_id: true,
      status: true,
      last_boarded_at: true,
      position: {
        select: {
          position_id: true,
          label: true,
          row_number: true,
          seat_index: true,
          floor: { select: { floor_number: true } },
        },
      },
      bus: {
        select: {
          bus_id: true,
          name: true,
          registration_plate: true,
          status: true,
          floor_count: true,
          classroom: {
            select: {
              grade: true,
              classroom_types: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json(
      { configured: false, message: "ยังไม่มีรถหรือที่นั่งที่จัดให้คุณ" },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  return NextResponse.json(
    {
      configured: true,
      assignmentId: assignment.assignment_id,
      status: assignment.status,
      isOnBus: assignment.status === "ON_BUS",
      lastBoardedAt: assignment.last_boarded_at,
      position: assignment.position
        ? {
            positionId: assignment.position.position_id,
            label: assignment.position.label,
            rowNumber: assignment.position.row_number,
            seatIndex: assignment.position.seat_index,
            floorNumber: assignment.position.floor.floor_number,
          }
        : null,
      bus: {
        busId: assignment.bus.bus_id,
        name: assignment.bus.name,
        registrationPlate: assignment.bus.registration_plate,
        status: assignment.bus.status,
        floorCount: assignment.bus.floor_count,
        classroom: {
          grade: assignment.bus.classroom.grade,
          roomName:
            assignment.bus.classroom.classroom_types?.name || "ห้องเรียน",
        },
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
