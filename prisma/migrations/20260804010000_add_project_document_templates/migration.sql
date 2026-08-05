CREATE TABLE `project_document_template` (
    `project_document_template_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(500) NULL,
    `template_data` JSON NOT NULL,
    `created_by_teacher_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `project_document_template_created_by_teacher_id_name_key`(`created_by_teacher_id`, `name`),
    INDEX `project_document_template_created_by_teacher_id_updated_at_idx`(`created_by_teacher_id`, `updated_at`),
    PRIMARY KEY (`project_document_template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `project_document_template` ADD CONSTRAINT `project_document_template_created_by_teacher_id_fkey` FOREIGN KEY (`created_by_teacher_id`) REFERENCES `teachers`(`teachers_id`) ON DELETE CASCADE ON UPDATE CASCADE;
