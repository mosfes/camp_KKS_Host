import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireSpecificCampBus } from "@/lib/camp-bus-auth";

export async function GET(_request: Request, context: any) {
  const { id, busId: rawBusId } = await context.params;
  const campId = Number(id);
  const busId = Number(rawBusId);

  if (!Number.isInteger(campId) || !Number.isInteger(busId)) {
    return NextResponse.json({ error: "รหัสรถไม่ถูกต้อง" }, { status: 400 });
  }

  const access = await requireSpecificCampBus(campId, busId, "view");

  if (access.error) return access.error;

  const bus = await prisma.camp_bus.findFirst({
    where: {
      bus_id: busId,
      camp_camp_id: campId,
    },
    select: {
      bus_id: true,
      status: true,
      events: {
        where: { event_type: { in: ["DEPART", "PARK"] } },
        orderBy: [{ created_at: "asc" }, { event_id: "asc" }],
        select: {
          event_id: true,
          event_type: true,
          created_at: true,
          teacher: {
            select: { firstname: true, lastname: true },
          },
        },
      },
    },
  });

  if (!bus) {
    return NextResponse.json({ error: "ไม่พบรถของค่ายนี้" }, { status: 404 });
  }

  // Pair DEPART → PARK into trips
  const trips: {
    tripNumber: number;
    departedAt: string;
    parkedAt: string | null;
    departedBy: string | null;
    parkedBy: string | null;
  }[] = [];

  let tripNumber = 0;

  for (const event of bus.events) {
    if (event.event_type === "DEPART") {
      tripNumber += 1;
      trips.push({
        tripNumber,
        departedAt: event.created_at.toISOString(),
        parkedAt: null,
        departedBy: event.teacher
          ? `${event.teacher.firstname} ${event.teacher.lastname}`.trim()
          : null,
        parkedBy: null,
      });
    } else if (event.event_type === "PARK" && trips.length > 0) {
      const last = trips[trips.length - 1];

      if (last.parkedAt === null) {
        last.parkedAt = event.created_at.toISOString();
        last.parkedBy = event.teacher
          ? `${event.teacher.firstname} ${event.teacher.lastname}`.trim()
          : null;
      }
    }
  }

  // Return newest trip first
  trips.reverse();

  return NextResponse.json(
    { trips, currentStatus: bus.status },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
