CREATE TABLE `camp_bus_event` (
  `event_id` INTEGER NOT NULL AUTO_INCREMENT,
  `bus_bus_id` INTEGER NOT NULL,
  `student_assignment_id` INTEGER NULL,
  `teacher_teachers_id` INTEGER NULL,
  `event_type` ENUM('BOARD', 'PARK', 'DEPART') NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `camp_bus_event_bus_bus_id_created_at_idx` (`bus_bus_id`, `created_at`),
  INDEX `camp_bus_event_student_assignment_id_created_at_idx` (`student_assignment_id`, `created_at`),
  INDEX `camp_bus_event_event_type_created_at_idx` (`event_type`, `created_at`),
  PRIMARY KEY (`event_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `camp_bus_event`
  ADD CONSTRAINT `camp_bus_event_bus_bus_id_fkey`
  FOREIGN KEY (`bus_bus_id`) REFERENCES `camp_bus`(`bus_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `camp_bus_event`
  ADD CONSTRAINT `camp_bus_event_student_assignment_id_fkey`
  FOREIGN KEY (`student_assignment_id`) REFERENCES `camp_bus_student`(`assignment_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `camp_bus_event`
  ADD CONSTRAINT `camp_bus_event_teacher_teachers_id_fkey`
  FOREIGN KEY (`teacher_teachers_id`) REFERENCES `teachers`(`teachers_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
