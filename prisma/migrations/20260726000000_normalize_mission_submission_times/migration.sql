-- Historical mission submissions were stored after manually adding UTC+7.
-- Store absolute instants consistently; Bangkok conversion belongs in the UI.
UPDATE `mission_result`
SET `submitted_at` = DATE_SUB(`submitted_at`, INTERVAL 7 HOUR);
