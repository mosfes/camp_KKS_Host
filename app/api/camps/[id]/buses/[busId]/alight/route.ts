import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSpecificCampBus } from "@/lib/camp-bus-auth";
import { prisma } from "@/lib/db";

const alightSchema = z
  .object({
    assignmentId: z.number().int().positive(),
    passengerType: z.enum(["STUDENT", "TEACHER"]).default("STUDENT"),
  })
  .strict();

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
      { error: "ข้อมูลผู้โดยสารไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const teacherId = Number(access.permission?.teacher?.teachers_id) || null;
  const result = await prisma.$transaction(async (tx) => {
    if (body.passengerType === "TEACHER") {
      const assignment = await tx.camp_bus_teacher.findFirst({
        where: {
          assignment_id: body.assignmentId,
          bus_bus_id: busId,
          removed_at: null,
        },
        select: {
          assignment_id: true,
          status: true,
          bus: { select: { status: true } },
        },
      });

      if (!assignment) {
        return {
          error: "ไม่พบครูในรถคันนี้",
          status: 404,
          passengerType: "TEACHER" as const,
        };
      }

      if (assignment.bus.status === "TRAVELING") {
        return {
          error: "รถกำลังเดินทาง กรุณารอรถจอดก่อนยืนยันลงรถ",
          status: 409,
          passengerType: "TEACHER" as const,
        };
      }

      if (assignment.status === "OFF_BUS") {
        return {
          alreadyAlighted: true,
          passengerType: "TEACHER" as const,
        };
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
            error: "รายการรถของครูถูกเปลี่ยน กรุณาโหลดหน้าใหม่",
            status: 409,
            passengerType: "TEACHER" as const,
          };
        }

        return {
          alreadyAlighted: current.status === "OFF_BUS",
          passengerType: "TEACHER" as const,
          ...(current.status === "ON_BUS"
            ? {
                error: "สถานะรถถูกเปลี่ยน กรุณาลองใหม่อีกครั้ง",
                status: 409,
              }
            : {}),
        };
      }

      await tx.camp_bus_event.create({
        data: {
          bus_bus_id: busId,
          teacher_assignment_id: assignment.assignment_id,
          teacher_teachers_id: teacherId,
          event_type: "ALIGHT",
          created_at: alightedAt,
        },
      });

      return {
        alreadyAlighted: false,
        alightedAt,
        passengerType: "TEACHER" as const,
      };
    }

    const assignment = await tx.camp_bus_student.findFirst({
      where: { assignment_id: body.assignmentId, bus_bus_id: busId },
      select: {
        assignment_id: true,
        status: true,
        bus: { select: { status: true } },
      },
    });

    if (!assignment) {
      return {
        error: "ไม่พบนักเรียนในรถคันนี้",
        status: 404,
        passengerType: "STUDENT" as const,
      };
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

    return {
      alreadyAlighted: false,
      alightedAt,
      passengerType: "STUDENT" as const,
    };
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
    message:
      result.passengerType === "TEACHER"
        ? result.alreadyAlighted
          ? "ครูไม่ได้อยู่บนรถแล้ว"
          : "ยืนยันครูลงจากรถแล้ว"
        : result.alreadyAlighted
          ? "นักเรียนไม่ได้อยู่บนรถแล้ว"
          : "ยืนยันนักเรียนลงจากรถแล้ว",
  });
}
