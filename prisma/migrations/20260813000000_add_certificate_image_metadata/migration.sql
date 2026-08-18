ALTER TABLE `camp`
  ADD COLUMN `img_certificate_public_id` VARCHAR(255) NULL,
  ADD COLUMN `img_certificate_bytes` INT NULL,
  ADD COLUMN `img_certificate_width` INT NULL,
  ADD COLUMN `img_certificate_height` INT NULL,
  ADD COLUMN `img_certificate_format` VARCHAR(20) NULL;
