CREATE TABLE `student_location_update` (
  `student_location_update_id` INTEGER NOT NULL AUTO_INCREMENT,
  `camp_camp_id` INTEGER NOT NULL,
  `student_students_id` INTEGER NOT NULL,
  `latitude` DOUBLE NOT NULL,
  `longitude` DOUBLE NOT NULL,
  `accuracy` DOUBLE NULL,
  `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `student_location_update_camp_student_recorded_idx` (`camp_camp_id`, `student_students_id`, `recorded_at`),
  INDEX `student_location_update_student_recorded_idx` (`student_students_id`, `recorded_at`),
  PRIMARY KEY (`student_location_update_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `student_location_update`
  ADD CONSTRAINT `student_location_update_camp_camp_id_fkey`
  FOREIGN KEY (`camp_camp_id`) REFERENCES `camp`(`camp_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_location_update`
  ADD CONSTRAINT `student_location_update_student_students_id_fkey`
  FOREIGN KEY (`student_students_id`) REFERENCES `students`(`students_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
