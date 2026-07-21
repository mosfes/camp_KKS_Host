ALTER TABLE `student_enrollment`
  MODIFY COLUMN `location_sharing_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `location_consent_at` DATETIME(3) NULL,
  ADD COLUMN `location_consent_by` VARCHAR(20) NULL,
  ADD COLUMN `location_consent_notice_version` VARCHAR(20) NULL;
