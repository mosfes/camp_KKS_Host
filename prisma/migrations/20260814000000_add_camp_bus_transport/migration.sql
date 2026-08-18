CREATE TABLE `camp_bus` (
  `bus_id` INTEGER NOT NULL AUTO_INCREMENT,
  `camp_camp_id` INTEGER NOT NULL,
  `classroom_classroom_id` INTEGER NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `registration_plate` VARCHAR(30) NOT NULL,
  `floor_count` INTEGER NOT NULL DEFAULT 1,
  `status` ENUM('PARKED', 'TRAVELING') NOT NULL DEFAULT 'PARKED',
  `layout_locked` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `camp_bus_camp_camp_id_classroom_classroom_id_key` (`camp_camp_id`, `classroom_classroom_id`),
  INDEX `camp_bus_camp_camp_id_idx` (`camp_camp_id`),
  PRIMARY KEY (`bus_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `camp_bus_floor` (
  `floor_id` INTEGER NOT NULL AUTO_INCREMENT,
  `bus_bus_id` INTEGER NOT NULL,
  `floor_number` INTEGER NOT NULL,
  `row_count` INTEGER NOT NULL,

  UNIQUE INDEX `camp_bus_floor_bus_bus_id_floor_number_key` (`bus_bus_id`, `floor_number`),
  PRIMARY KEY (`floor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `camp_bus_position` (
  `position_id` INTEGER NOT NULL AUTO_INCREMENT,
  `floor_floor_id` INTEGER NOT NULL,
  `row_number` INTEGER NOT NULL,
  `seat_index` INTEGER NOT NULL,
  `label` VARCHAR(20) NOT NULL,

  UNIQUE INDEX `camp_bus_position_floor_floor_id_row_number_seat_index_key` (`floor_floor_id`, `row_number`, `seat_index`),
  UNIQUE INDEX `camp_bus_position_floor_floor_id_label_key` (`floor_floor_id`, `label`),
  PRIMARY KEY (`position_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `camp_bus_student` (
  `assignment_id` INTEGER NOT NULL AUTO_INCREMENT,
  `bus_bus_id` INTEGER NOT NULL,
  `student_enrollment_id` INTEGER NOT NULL,
  `position_position_id` INTEGER NULL,
  `status` ENUM('OFF_BUS', 'ON_BUS') NOT NULL DEFAULT 'OFF_BUS',
  `last_boarded_at` DATETIME(3) NULL,
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `camp_bus_student_student_enrollment_id_key` (`student_enrollment_id`),
  UNIQUE INDEX `camp_bus_student_position_position_id_key` (`position_position_id`),
  UNIQUE INDEX `camp_bus_student_bus_bus_id_student_enrollment_id_key` (`bus_bus_id`, `student_enrollment_id`),
  INDEX `camp_bus_student_bus_bus_id_status_idx` (`bus_bus_id`, `status`),
  PRIMARY KEY (`assignment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `camp_bus`
  ADD CONSTRAINT `camp_bus_camp_camp_id_fkey`
  FOREIGN KEY (`camp_camp_id`) REFERENCES `camp`(`camp_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `camp_bus`
  ADD CONSTRAINT `camp_bus_classroom_classroom_id_fkey`
  FOREIGN KEY (`classroom_classroom_id`) REFERENCES `classrooms`(`classroom_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `camp_bus_floor`
  ADD CONSTRAINT `camp_bus_floor_bus_bus_id_fkey`
  FOREIGN KEY (`bus_bus_id`) REFERENCES `camp_bus`(`bus_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `camp_bus_position`
  ADD CONSTRAINT `camp_bus_position_floor_floor_id_fkey`
  FOREIGN KEY (`floor_floor_id`) REFERENCES `camp_bus_floor`(`floor_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `camp_bus_student`
  ADD CONSTRAINT `camp_bus_student_bus_bus_id_fkey`
  FOREIGN KEY (`bus_bus_id`) REFERENCES `camp_bus`(`bus_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `camp_bus_student`
  ADD CONSTRAINT `camp_bus_student_student_enrollment_id_fkey`
  FOREIGN KEY (`student_enrollment_id`) REFERENCES `student_enrollment`(`student_enrollment_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `camp_bus_student`
  ADD CONSTRAINT `camp_bus_student_position_position_id_fkey`
  FOREIGN KEY (`position_position_id`) REFERENCES `camp_bus_position`(`position_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
