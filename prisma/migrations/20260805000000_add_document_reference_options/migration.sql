CREATE TABLE `document_reference_option` (
    `document_reference_option_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(30) NOT NULL,
    `label` VARCHAR(700) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `document_reference_option_category_label_key`(`category`, `label`),
    INDEX `document_reference_option_category_is_active_sort_order_idx`(`category`, `is_active`, `sort_order`),
    PRIMARY KEY (`document_reference_option_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `document_reference_option`
    (`category`, `label`, `is_active`, `sort_order`, `created_at`, `updated_at`)
VALUES
    ('STANDARD', 'มาตรฐานการศึกษาขั้นพื้นฐานฯ มาตรฐานที่ 1, 3 ข้อที่ 1.1, 3 ตัวชี้วัดที่ 1.1.2, 3.1', true, 10, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('STRATEGY', 'ข้อที่ 3 ส่งเสริมผู้เรียนให้มีความเป็นเลิศทางทักษะวิชาการ ทักษะวิชาชีพ ทักษะชีวิต และทักษะการเรียนรู้ในศตวรรษที่ 21', true, 10, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
