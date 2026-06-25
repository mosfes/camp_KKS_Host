-- AlterTable: เพิ่มฟิลด์เลขที่เกียรติบัตรแบบรัน
ALTER TABLE `camp` ADD COLUMN `cert_show_number` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `camp` ADD COLUMN `cert_number_start` INTEGER NULL;
ALTER TABLE `camp` ADD COLUMN `cert_number_end` INTEGER NULL;
ALTER TABLE `camp` ADD COLUMN `cert_number_x` DOUBLE NULL;
ALTER TABLE `camp` ADD COLUMN `cert_number_y` DOUBLE NULL;
ALTER TABLE `camp` ADD COLUMN `cert_number_size` DOUBLE NULL;
ALTER TABLE `camp` ADD COLUMN `cert_number_color` VARCHAR(50) NULL;
ALTER TABLE `camp` ADD COLUMN `cert_number_pattern` VARCHAR(255) NULL;
ALTER TABLE `camp` ADD COLUMN `cert_number_is_thai` BOOLEAN NOT NULL DEFAULT false;
