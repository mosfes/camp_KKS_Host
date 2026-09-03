-- Add optional verification QR placement settings to certificate templates.
ALTER TABLE `camp`
  ADD COLUMN `cert_show_qr` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `cert_qr_x` DOUBLE NULL,
  ADD COLUMN `cert_qr_y` DOUBLE NULL,
  ADD COLUMN `cert_qr_size` DOUBLE NULL;
