/**
 * Enrollment rows are kept as history, so current camp rosters must also
 * verify that the student is active and still belongs to a camp classroom.
 */
export function activeCampStudentWhere(campId: number) {
  return {
    deletedAt: null,
    classroom_students: {
      some: {
        classroom: {
          deletedAt: null,
          camp_classroom: {
            some: { camp_camp_id: campId },
          },
        },
      },
    },
  };
}

export function activeCampEnrollmentWhere(campId: number) {
  return {
    camp_camp_id: campId,
    student: activeCampStudentWhere(campId),
  };
}

export function activeCampBusStudentWhere(campId: number, busId: number) {
  return {
    AND: [
      activeCampStudentWhere(campId),
      {
        classroom_students: {
          some: {
            classroom: {
              deletedAt: null,
              camp_bus: {
                some: {
                  bus_id: busId,
                  camp_camp_id: campId,
                },
              },
            },
          },
        },
      },
    ],
  };
}
