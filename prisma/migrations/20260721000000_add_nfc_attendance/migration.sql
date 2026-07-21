ALTER TABLE `attendance_session`
  ADD COLUMN `method` ENUM('QR', 'NFC', 'Image', 'default') NOT NULL DEFAULT 'QR';
