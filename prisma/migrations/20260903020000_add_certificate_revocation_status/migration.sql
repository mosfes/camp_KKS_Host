-- Persist verification status so a scanned QR can distinguish an active
-- certificate from a revoked certificate.
ALTER TABLE `certificate`
  ADD COLUMN `revoked_at` DATETIME(3) NULL,
  ADD COLUMN `revocation_reason` VARCHAR(500) NULL;
