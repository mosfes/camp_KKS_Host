UPDATE `camp_bus_position` AS position
INNER JOIN `camp_bus_floor` AS floor
  ON floor.floor_id = position.floor_floor_id
INNER JOIN `camp_bus` AS bus
  ON bus.bus_id = floor.bus_bus_id
SET position.label = CONCAT(
  CHAR(65 + position.seat_index),
  LPAD(position.label, 2, '0')
)
WHERE bus.name = 'เชี่ยวชาญแทรเวล 30-0205'
  AND floor.floor_number = 2
  AND position.seat_index BETWEEN 0 AND 3
  AND position.label REGEXP '^[0-9]+$';
