import { prisma } from "@/lib/db";

/** Keep access to progress and mission details aligned for every teacher view. */
export async function canViewCampTracking(campId: number, teacher: unknown) {
  const session = teacher as {
    teachers_id?: unknown;
    role?: unknown;
  };
  const teacherId = Number(session.teachers_id);
  const role = String(session.role ?? "TEACHER").toUpperCase();

  if (
    !Number.isInteger(campId) ||
    campId <= 0 ||
    !Number.isInteger(teacherId) ||
    teacherId <= 0
  ) {
    return false;
  }

  const camp = await prisma.camp.findFirst({
    where: {
      camp_id: campId,
      deletedAt: null,
      ...(role !== "ADMIN"
        ? {
            OR: [
              { created_by_teacher_id: teacherId },
              {
                teacher_enrollment: {
                  some: { teacher_teachers_id: teacherId },
                },
              },
              {
                camp_classroom: {
                  some: {
                    classroom: {
                      OR: [
                        { teachers_teachers_id: teacherId },
                        {
                          classroom_teacher: {
                            some: { teacher_teachers_id: teacherId },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    select: { camp_id: true },
  });

  return Boolean(camp);
}
