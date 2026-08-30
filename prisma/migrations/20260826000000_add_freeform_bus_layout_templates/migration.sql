-- CreateTable
CREATE TABLE `bus_layout_template` (
    `template_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(500) NOT NULL DEFAULT '',
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_by_teacher_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `bus_layout_template_status_updated_at_idx`(`status`, `updated_at`),
    INDEX `bus_layout_template_created_by_teacher_id_idx`(`created_by_teacher_id`),
    PRIMARY KEY (`template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bus_layout_template_floor` (
    `floor_id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_id` INTEGER NOT NULL,
    `floor_number` INTEGER NOT NULL,
    `floor_name` VARCHAR(80) NOT NULL DEFAULT '',
    `canvas_columns` INTEGER NOT NULL DEFAULT 12,
    `canvas_rows` INTEGER NOT NULL DEFAULT 24,

    UNIQUE INDEX `bus_layout_template_floor_template_id_floor_number_key`(`template_id`, `floor_number`),
    PRIMARY KEY (`floor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bus_layout_template_element` (
    `element_id` INTEGER NOT NULL AUTO_INCREMENT,
    `floor_id` INTEGER NOT NULL,
    `type` ENUM('SEAT', 'DRIVER', 'DOOR', 'STAIRS', 'TOILET', 'TABLE', 'EMPTY', 'LABEL') NOT NULL,
    `x` INTEGER NOT NULL,
    `y` INTEGER NOT NULL,
    `width` INTEGER NOT NULL DEFAULT 1,
    `height` INTEGER NOT NULL DEFAULT 1,
    `rotation` INTEGER NOT NULL DEFAULT 0,
    `label` VARCHAR(50) NOT NULL DEFAULT '',
    `is_assignable` BOOLEAN NOT NULL DEFAULT false,
    `z_index` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,

    INDEX `bus_layout_template_element_floor_id_type_idx`(`floor_id`, `type`),
    PRIMARY KEY (`element_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `camp_bus`
    ADD COLUMN `layout_template_id` INTEGER NULL,
    ADD COLUMN `layout_template_version` INTEGER NULL;

-- TiDB resolves indexes before newly added columns when both operations are in
-- the same ALTER TABLE statement, so create the index in a separate query.
CREATE INDEX `camp_bus_layout_template_id_idx`
    ON `camp_bus`(`layout_template_id`);

-- AlterTable
ALTER TABLE `camp_bus_floor`
    ADD COLUMN `canvas_columns` INTEGER NULL,
    ADD COLUMN `canvas_rows` INTEGER NULL;

-- AlterTable
ALTER TABLE `camp_bus_position`
    ADD COLUMN `x` INTEGER NULL,
    ADD COLUMN `y` INTEGER NULL,
    ADD COLUMN `width` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `height` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `rotation` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `camp_bus_layout_element` (
    `element_id` INTEGER NOT NULL AUTO_INCREMENT,
    `floor_floor_id` INTEGER NOT NULL,
    `type` ENUM('SEAT', 'DRIVER', 'DOOR', 'STAIRS', 'TOILET', 'TABLE', 'EMPTY', 'LABEL') NOT NULL,
    `x` INTEGER NOT NULL,
    `y` INTEGER NOT NULL,
    `width` INTEGER NOT NULL DEFAULT 1,
    `height` INTEGER NOT NULL DEFAULT 1,
    `rotation` INTEGER NOT NULL DEFAULT 0,
    `label` VARCHAR(50) NOT NULL DEFAULT '',
    `z_index` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,

    INDEX `camp_bus_layout_element_floor_floor_id_type_idx`(`floor_floor_id`, `type`),
    PRIMARY KEY (`element_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preserve the legacy 2-aisle-2 layout as freeform coordinates.
UPDATE `camp_bus_floor`
SET `canvas_columns` = 5, `canvas_rows` = `row_count`;

UPDATE `camp_bus_position`
SET
    `x` = CASE `seat_index`
        WHEN 0 THEN 0
        WHEN 1 THEN 1
        WHEN 2 THEN 3
        WHEN 3 THEN 4
        ELSE `seat_index`
    END,
    `y` = `row_number` - 1;

-- AddForeignKey
ALTER TABLE `bus_layout_template`
    ADD CONSTRAINT `bus_layout_template_created_by_teacher_id_fkey`
    FOREIGN KEY (`created_by_teacher_id`) REFERENCES `teachers`(`teachers_id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_layout_template_floor`
    ADD CONSTRAINT `bus_layout_template_floor_template_id_fkey`
    FOREIGN KEY (`template_id`) REFERENCES `bus_layout_template`(`template_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_layout_template_element`
    ADD CONSTRAINT `bus_layout_template_element_floor_id_fkey`
    FOREIGN KEY (`floor_id`) REFERENCES `bus_layout_template_floor`(`floor_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `camp_bus`
    ADD CONSTRAINT `camp_bus_layout_template_id_fkey`
    FOREIGN KEY (`layout_template_id`) REFERENCES `bus_layout_template`(`template_id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `camp_bus_layout_element`
    ADD CONSTRAINT `camp_bus_layout_element_floor_floor_id_fkey`
    FOREIGN KEY (`floor_floor_id`) REFERENCES `camp_bus_floor`(`floor_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
