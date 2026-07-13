ALTER TABLE `camp`
  ADD COLUMN `destination_name` VARCHAR(255) NULL,
  ADD COLUMN `destination_address` VARCHAR(500) NULL,
  ADD COLUMN `destination_latitude` DOUBLE NULL,
  ADD COLUMN `destination_longitude` DOUBLE NULL,
  ADD COLUMN `location_sharing_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `location_update_interval` INTEGER NOT NULL DEFAULT 10;

CREATE TABLE `camp_location_update` (
  `location_update_id` INTEGER NOT NULL AUTO_INCREMENT,
  `camp_camp_id` INTEGER NOT NULL,
  `teacher_teachers_id` INTEGER NOT NULL,
  `latitude` DOUBLE NOT NULL,
  `longitude` DOUBLE NOT NULL,
  `accuracy` DOUBLE NULL,
  `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `camp_location_update_camp_camp_id_recorded_at_idx` (`camp_camp_id`, `recorded_at`),
  INDEX `camp_location_update_teacher_teachers_id_idx` (`teacher_teachers_id`),
  PRIMARY KEY (`location_update_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `camp_location_update`
  ADD CONSTRAINT `camp_location_update_camp_camp_id_fkey`
  FOREIGN KEY (`camp_camp_id`) REFERENCES `camp`(`camp_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `camp_location_update`
  ADD CONSTRAINT `camp_location_update_teacher_teachers_id_fkey`
  FOREIGN KEY (`teacher_teachers_id`) REFERENCES `teachers`(`teachers_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
