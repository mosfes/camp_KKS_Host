-- Add camp-level certificate eligibility settings.
ALTER TABLE `camp`
  ADD COLUMN `cert_mission_completion_percent` INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN `cert_require_survey` BOOLEAN NOT NULL DEFAULT false;

-- Preserve the survey requirement previously configured on existing surveys.
UPDATE `camp` c
INNER JOIN `survey` s ON s.`camp_camp_id` = c.`camp_id`
SET c.`cert_require_survey` = s.`is_required_for_cert`;
