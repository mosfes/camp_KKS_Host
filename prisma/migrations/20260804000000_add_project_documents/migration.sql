CREATE TABLE `document_personnel` (
    `document_personnel_id` INTEGER NOT NULL AUTO_INCREMENT,
    `prefix_name` VARCHAR(50) NULL,
    `firstname` VARCHAR(255) NOT NULL,
    `lastname` VARCHAR(255) NOT NULL,
    `position` VARCHAR(500) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `document_personnel_is_active_idx`(`is_active`),
    INDEX `document_personnel_firstname_lastname_idx`(`firstname`, `lastname`),
    PRIMARY KEY (`document_personnel_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `camp_project_document` (
    `camp_project_document_id` INTEGER NOT NULL AUTO_INCREMENT,
    `camp_camp_id` INTEGER NOT NULL,
    `fiscal_year` INTEGER NOT NULL,
    `project_name` VARCHAR(500) NOT NULL,
    `project_code` VARCHAR(100) NULL,
    `activity_name` VARCHAR(500) NULL,
    `activity_order` VARCHAR(100) NULL,
    `project_type` VARCHAR(30) NOT NULL DEFAULT 'CONTINUING',
    `standards` TEXT NULL,
    `strategy` TEXT NULL,
    `responsible_people` TEXT NULL,
    `department` VARCHAR(500) NULL,
    `rationale` LONGTEXT NULL,
    `objectives` JSON NOT NULL,
    `quantitative_targets` JSON NOT NULL,
    `qualitative_targets` JSON NOT NULL,
    `procedures` JSON NOT NULL,
    `duration_text` VARCHAR(500) NULL,
    `location_text` VARCHAR(500) NULL,
    `budget_total` DOUBLE NOT NULL DEFAULT 0,
    `budget_source` VARCHAR(100) NULL,
    `budget_items` JSON NOT NULL,
    `evaluations` JSON NOT NULL,
    `expected_results` JSON NOT NULL,
    `signatories` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `camp_project_document_camp_camp_id_key`(`camp_camp_id`),
    INDEX `camp_project_document_camp_camp_id_idx`(`camp_camp_id`),
    PRIMARY KEY (`camp_project_document_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `camp_project_document` ADD CONSTRAINT `camp_project_document_camp_camp_id_fkey` FOREIGN KEY (`camp_camp_id`) REFERENCES `camp`(`camp_id`) ON DELETE CASCADE ON UPDATE CASCADE;
