import { prisma } from "@/lib/db";

type RecordAttendanceInput = {
  sessionId: number;
  studentId: number;
};

/**
 * Record one attendance row atomically. The database unique constraint is the
 * source of truth, so concurrent QR/NFC/manual requests cannot create duplicates.
 */
export async function recordStudentAttendanceOnce({
  sessionId,
  studentId,
}: RecordAttendanceInput) {
  const checkedAt = new Date();
  const result = await prisma.attendance_record_student.createMany({
    data: [
      {
        attendance_teacher_session_id: sessionId,
        student_students_id: studentId,
        checkin_time: checkedAt,
      },
    ],
    skipDuplicates: true,
  });

  if (result.count === 1) {
    return { created: true, checkedAt };
  }

  const existing = await prisma.attendance_record_student.findUnique({
    where: {
      attendance_teacher_session_id_student_students_id: {
        attendance_teacher_session_id: sessionId,
        student_students_id: studentId,
      },
    },
    select: { checkin_time: true },
  });

  return {
    created: false,
    checkedAt: existing?.checkin_time ?? checkedAt,
  };
}
