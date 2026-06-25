-- AlterTable: เปลี่ยนชื่อ cert_number_pattern เป็น cert_number_prefix และย่อขนาด
ALTER TABLE `camp` CHANGE COLUMN `cert_number_pattern` `cert_number_prefix` VARCHAR(20) NULL;
