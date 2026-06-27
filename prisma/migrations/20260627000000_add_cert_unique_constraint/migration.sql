-- Migration: เพิ่ม unique constraint บน certificate เพื่อป้องกัน Race Condition
-- นักเรียน 1 คนต่อ 1 ค่าย ต้องมีเกียรติบัตรได้แค่ 1 ใบ

ALTER TABLE `certificate` ADD CONSTRAINT `certificate_student_enrollment_id_key` UNIQUE (`student_enrollment_id`);
