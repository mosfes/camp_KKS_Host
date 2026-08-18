import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireCampBusPermission(
  campId: number,
  classroomId?: number,
) {
  const { teacher, error } = await requireTeacher();

  if (error || !teacher) return { teacher: null, camp: null, error };

  const teacherId = Number(teacher.teachers_id);
  const role = String(teacher.role || "TEACHER").toUpperCase();
  const camp = await prisma.camp.findFirst({
    where: { camp_id: campId, deletedAt: null },
    select: {
      camp_id: true,
      created_by_teacher_id: true,
      camp_classroom: {
        select: {
          classroom_classroom_id: true,
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
    return {
      teacher: null,
      camp: null,
      error: NextResponse.json({ error: "ไม่พบค่าย" }, { status: 404 }),
    };
  }

  const canManageAll =
    role === "ADMIN" ||
    role === "CAMP_LEADER" ||
    camp.created_by_teacher_id === teacherId;

  const classroomIds = camp.camp_classroom
    .filter(
      (item) =>
        item.classroom.teachers_teachers_id === teacherId ||
        item.classroom.classroom_teacher.some(
          (ct) => ct.teacher_teachers_id === teacherId,
        ),
    )
    .map((item) => item.classroom_classroom_id);

  if (classroomId !== undefined) {
    const classroomBelongsToCamp = camp.camp_classroom.some(
      (item) => item.classroom_classroom_id === classroomId,
    );

    if (!classroomBelongsToCamp) {
      return {
        teacher: null,
        camp: null,
        error: NextResponse.json(
          { error: "ห้องเรียนนี้ไม่ได้อยู่ในค่าย" },
          { status: 400 },
        ),
      };
    }

    if (!canManageAll && !classroomIds.includes(classroomId)) {
      return {
        teacher: null,
        camp: null,
        error: NextResponse.json(
          { error: "คุณไม่มีสิทธิ์จัดการรถของห้องเรียนนี้" },
          { status: 403 },
        ),
      };
    }
  }

  return {
    teacher,
    camp,
    error: null,
    canManageAll,
    classroomIds: canManageAll
      ? camp.camp_classroom.map((item) => item.classroom_classroom_id)
      : classroomIds,
  };
}

export async function requireSpecificCampBus(campId: number, busId: number) {
  const bus = await prisma.camp_bus.findFirst({
    where: { bus_id: busId, camp_camp_id: campId },
    select: { bus_id: true, classroom_classroom_id: true },
  });

  if (!bus) {
    return {
      bus: null,
      permission: null,
      error: NextResponse.json({ error: "ไม่พบรถของค่ายนี้" }, { status: 404 }),
    };
  }

  const permission = await requireCampBusPermission(
    campId,
    bus.classroom_classroom_id,
  );

  return { bus, permission, error: permission.error };
}
