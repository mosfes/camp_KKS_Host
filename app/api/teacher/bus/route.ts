import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";
import { isBangkokDateBefore } from "@/lib/bangkok-date";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { teacher, error: authError } = await requireTeacher();

  if (authError) return authError;

  const teacherId = Number(teacher.teachers_id);

  if (!Number.isInteger(teacherId) || teacherId <= 0) {
    return NextResponse.json(
      { error: "ไม่พบข้อมูลครูที่เข้าสู่ระบบ" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const isManual = searchParams.get("manual") === "1";

  if (isManual) {
    const rateCheck = checkRateLimit("teacher-bus-list-manual", teacherId, {
      windowMs: 60_000,
      max: 10,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `คุณกดรีเฟรชบ่อยเกินไป (จำกัด 10 ครั้ง/นาที) กรุณารอ ${rateCheck.retryAfterSeconds} วินาทีก่อนลองใหม่`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }
  }

  try {
    const teacherAssignments = await prisma.camp_bus_teacher.findMany({
      where: {
        teacher_teachers_id: teacherId,
        removed_at: null,
        camp: {
          deletedAt: null,
          has_transport: true,
        },
      },
      select: {
        assignment_id: true,
        status: true,
        last_boarded_at: true,
        camp: {
          select: {
            camp_id: true,
            name: true,
            start_date: true,
            end_date: true,
          },
        },
        position: {
          select: {
            label: true,
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
          },
        },
      },
      orderBy: { camp: { start_date: "asc" } },
    });

    const assignments = teacherAssignments
      .filter((assignment) => !isBangkokDateBefore(assignment.camp.end_date))
      .map((assignment) => ({
        assignmentId: assignment.assignment_id,
        campId: assignment.camp.camp_id,
        campName: assignment.camp.name,
        configured: true,
        bus: {
          busId: assignment.bus.bus_id,
          name: assignment.bus.name,
          registrationPlate: assignment.bus.registration_plate,
          status: assignment.bus.status,
          floorCount: assignment.bus.floor_count,
        },
        teacher: {
          status: assignment.status,
          isOnBus: assignment.status === "ON_BUS",
          lastBoardedAt: assignment.last_boarded_at,
          position: assignment.position
            ? {
                label: assignment.position.label,
                seatIndex: assignment.position.seat_index,
                floorNumber: assignment.position.floor.floor_number,
              }
            : null,
        },
      }));

    return NextResponse.json(
      { assignments },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[teacher bus shortcuts] error:", error);

    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลรถได้" },
      { status: 500 },
    );
  }
}
