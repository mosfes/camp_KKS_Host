// @ts-nocheck

import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/auth";
import { isBangkokDateBefore } from "@/lib/bangkok-date";
import { prisma } from "@/lib/db";

export async function GET() {
  const { student, error: authError } = await requireStudent();

  if (authError) return authError;

  try {
    const enrollments = await prisma.student_enrollment.findMany({
      where: {
        student_students_id: Number(student.students_id),
        enrolled_at: { not: null },
        camp: {
          deletedAt: null,
          has_transport: true,
        },
      },
      select: {
        camp_camp_id: true,
        camp: {
          select: {
            name: true,
            start_date: true,
            end_date: true,
          },
        },
        camp_bus_student: {
          take: 1,
          select: {
            status: true,
            last_boarded_at: true,
            position: {
              select: {
                label: true,
                floor: { select: { floor_number: true } },
              },
            },
            bus: {
              select: {
                name: true,
                status: true,
                floor_count: true,
              },
            },
          },
        },
      },
      orderBy: { camp: { start_date: "asc" } },
    });

    const assignments = enrollments
      .filter((enrollment) => !isBangkokDateBefore(enrollment.camp.end_date))
      .map((enrollment) => {
        const assignment = enrollment.camp_bus_student[0];

        if (!assignment) {
          return {
            campId: enrollment.camp_camp_id,
            campName: enrollment.camp.name,
            configured: false,
          };
        }

        return {
          campId: enrollment.camp_camp_id,
          campName: enrollment.camp.name,
          configured: true,
          bus: {
            name: assignment.bus.name,
            status: assignment.bus.status,
            floorCount: assignment.bus.floor_count,
          },
          student: {
            status: assignment.status,
            isOnBus: assignment.status === "ON_BUS",
            lastBoardedAt: assignment.last_boarded_at,
            position: assignment.position
              ? {
                  label: assignment.position.label,
                  floorNumber: assignment.position.floor.floor_number,
                }
              : null,
          },
        };
      });

    return NextResponse.json(
      { assignments },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[student bus shortcuts] error:", error);

    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลรถได้" },
      { status: 500 },
    );
  }
}
