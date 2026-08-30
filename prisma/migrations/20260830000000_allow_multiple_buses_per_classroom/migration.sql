DROP INDEX `camp_bus_camp_camp_id_classroom_classroom_id_key` ON `camp_bus`;

CREATE INDEX `camp_bus_camp_camp_id_classroom_classroom_id_idx`
  ON `camp_bus`(`camp_camp_id`, `classroom_classroom_id`);
