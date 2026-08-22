ALTER TABLE `camp_bus_student`
  ADD COLUMN `participation_status` ENUM('ACTIVE', 'NOT_TRAVELING') NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX `camp_bus_student_bus_bus_id_participation_status_idx`
  ON `camp_bus_student` (`bus_bus_id`, `participation_status`);
