ALTER TABLE `camp_bus_event`
  MODIFY `event_type` ENUM('BOARD', 'ALIGHT', 'PARK', 'DEPART') NOT NULL;
