CREATE TABLE `camp_bus_teacher` (
  `assignment_id` INTEGER NOT NULL AUTO_INCREMENT,
  `camp_camp_id` INTEGER NOT NULL,
  `bus_bus_id` INTEGER NOT NULL,
  `teacher_teachers_id` INTEGER NOT NULL,
  `position_position_id` INTEGER NULL,
  `status` ENUM('OFF_BUS', 'ON_BUS') NOT NULL DEFAULT 'OFF_BUS',
  `last_boarded_at` DATETIME(3) NULL,
  `removed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `camp_bus_teacher_position_position_id_key` (`position_position_id`),
  UNIQUE INDEX `camp_bus_teacher_camp_camp_id_teacher_teachers_id_key` (`camp_camp_id`, `teacher_teachers_id`),
  UNIQUE INDEX `camp_bus_teacher_bus_bus_id_teacher_teachers_id_key` (`bus_bus_id`, `teacher_teachers_id`),
  INDEX `camp_bus_teacher_bus_bus_id_status_idx` (`bus_bus_id`, `status`),
  INDEX `camp_bus_teacher_bus_bus_id_removed_at_idx` (`bus_bus_id`, `removed_at`),
  PRIMARY KEY (`assignment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `camp_bus_event`
  ADD COLUMN `teacher_assignment_id` INTEGER NULL;

CREATE INDEX `camp_bus_event_teacher_assignment_id_created_at_idx`
  ON `camp_bus_event` (`teacher_assignment_id`, `created_at`);

ALTER TABLE `camp_bus_teacher`
  ADD CONSTRAINT `camp_bus_teacher_camp_camp_id_fkey`
  FOREIGN KEY (`camp_camp_id`) REFERENCES `camp`(`camp_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `camp_bus_teacher`
  ADD CONSTRAINT `camp_bus_teacher_bus_bus_id_fkey`
  FOREIGN KEY (`bus_bus_id`) REFERENCES `camp_bus`(`bus_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `camp_bus_teacher`
  ADD CONSTRAINT `camp_bus_teacher_teacher_teachers_id_fkey`
  FOREIGN KEY (`teacher_teachers_id`) REFERENCES `teachers`(`teachers_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `camp_bus_teacher`
  ADD CONSTRAINT `camp_bus_teacher_position_position_id_fkey`
  FOREIGN KEY (`position_position_id`) REFERENCES `camp_bus_position`(`position_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `camp_bus_event`
  ADD CONSTRAINT `camp_bus_event_teacher_assignment_id_fkey`
  FOREIGN KEY (`teacher_assignment_id`) REFERENCES `camp_bus_teacher`(`assignment_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
