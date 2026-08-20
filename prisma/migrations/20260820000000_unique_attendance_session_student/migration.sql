-- Keep the oldest check-in if legacy concurrent requests created duplicates.
DELETE duplicate_record
FROM `attendance_record_student` AS duplicate_record
INNER JOIN `attendance_record_student` AS keeper_record
  ON duplicate_record.`attendance_teacher_session_id` = keeper_record.`attendance_teacher_session_id`
  AND duplicate_record.`student_students_id` = keeper_record.`student_students_id`
  AND duplicate_record.`record_id` > keeper_record.`record_id`;

-- Make duplicate check-ins impossible even when requests arrive concurrently.
CREATE UNIQUE INDEX `attendance_record_session_student_key`
ON `attendance_record_student`(`attendance_teacher_session_id`, `student_students_id`);
