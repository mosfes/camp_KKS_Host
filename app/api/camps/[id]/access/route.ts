// @ts-nocheck

import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Return only the camp permissions needed to build the headteacher sidebar.
 * Keep this endpoint intentionally small; the full camp endpoint includes
 * all enrollments and classroom students and is not needed for navigation.
 */
export async function GET(_request, context) {
  const { teacher, error: authError } = await requireTeacher();

  if (authError) return authError;

  try {
    const { id } = await context.params;
    const campId = Number(id);

    if (!Number.isInteger(campId) || campId <= 0) {
      return NextResponse.json(
        { error: "รหัสค่ายไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const camp = await prisma.camp.findFirst({
      where: { camp_id: campId, deletedAt: null },
      select: {
        created_by_teacher_id: true,
        has_transport: true,
        camp_classroom: {
          select: {
            classroom: {
              select: {
                teachers_teachers_id: true,
                classroom_teacher: {
                  select: { teacher_teachers_id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!camp) {
      return NextResponse.json({ error: "Camp not found" }, { status: 404 });
    }

    const isOwner =
      camp.created_by_teacher_id === teacher.teachers_id ||
      teacher.role === "ADMIN";
    const isHomeroomTeacher = camp.camp_classroom.some(
      ({ classroom }) =>
        classroom?.teachers_teachers_id === teacher.teachers_id ||
        classroom?.classroom_teacher.some(
          (entry) => entry.teacher_teachers_id === teacher.teachers_id,
        ),
    );

    return NextResponse.json({
      isOwner,
      isHomeroomTeacher,
      hasTransport: camp.has_transport,
    });
  } catch {
    return NextResponse.json(
      { _error: "Failed to fetch camp access" },
      { status: 500 },
    );
  }
}
