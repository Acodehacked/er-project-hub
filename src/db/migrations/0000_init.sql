CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(30) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('STUDENT','REPRESENTATIVE','FACULTY','ADMIN') NOT NULL DEFAULT 'STUDENT',
	`department_id` varchar(36),
	`student_identifier` varchar(50),
	`graduation_year` int,
	`bio` text,
	`avatar_key` varchar(512),
	`github_url` varchar(512),
	`linkedin_url` varchar(512),
	`is_active` boolean NOT NULL DEFAULT true,
	`last_login_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_student_identifier_unique` UNIQUE(`student_identifier`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` varchar(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`code` varchar(20) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_name_unique` UNIQUE(`name`),
	CONSTRAINT `departments_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `academic_years` (
	`id` varchar(36) NOT NULL,
	`label` varchar(20) NOT NULL,
	`start_year` int NOT NULL,
	`is_current` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `academic_years_id` PRIMARY KEY(`id`),
	CONSTRAINT `academic_years_label_unique` UNIQUE(`label`),
	CONSTRAINT `academic_years_start_year_unique` UNIQUE(`start_year`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`abstract` text NOT NULL,
	`description` text,
	`academic_year_id` varchar(36) NOT NULL,
	`department_id` varchar(36) NOT NULL,
	`status` enum('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`leader_id` varchar(36) NOT NULL,
	`guide_id` varchar(36),
	`github_url` varchar(512),
	`demo_url` varchar(512),
	`views_count` int NOT NULL DEFAULT 0,
	`is_featured` boolean NOT NULL DEFAULT false,
	`submitted_at` timestamp,
	`approved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` enum('LEADER','DEVELOPER','DESIGNER','RESEARCHER','DOCUMENTATION','OTHER') NOT NULL DEFAULT 'DEVELOPER',
	`role_title` varchar(80),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `project_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_members_project_user_uq` UNIQUE(`project_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `technologies` (
	`id` varchar(36) NOT NULL,
	`name` varchar(80) NOT NULL,
	`slug` varchar(90) NOT NULL,
	`category` enum('LANGUAGE','FRAMEWORK','DATABASE','HARDWARE','CLOUD','AI_ML','TOOL','OTHER') NOT NULL DEFAULT 'OTHER',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `technologies_id` PRIMARY KEY(`id`),
	CONSTRAINT `technologies_name_unique` UNIQUE(`name`),
	CONSTRAINT `technologies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `project_technologies` (
	`project_id` varchar(36) NOT NULL,
	`technology_id` varchar(36) NOT NULL,
	CONSTRAINT `project_technologies_project_id_technology_id_pk` PRIMARY KEY(`project_id`,`technology_id`)
);
--> statement-breakpoint
CREATE TABLE `project_documents` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`kind` enum('REPORT','PRESENTATION','PAPER','OTHER') NOT NULL DEFAULT 'OTHER',
	`file_name` varchar(255) NOT NULL,
	`storage_key` varchar(512) NOT NULL,
	`mime_type` varchar(120) NOT NULL,
	`file_size` int NOT NULL,
	`uploaded_by_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `project_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_documents_storage_key_unique` UNIQUE(`storage_key`)
);
--> statement-breakpoint
CREATE TABLE `project_images` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`storage_key` varchar(512) NOT NULL,
	`mime_type` varchar(120) NOT NULL,
	`file_size` int NOT NULL,
	`caption` varchar(200),
	`is_cover` boolean NOT NULL DEFAULT false,
	`display_order` int NOT NULL DEFAULT 0,
	`uploaded_by_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `project_images_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_images_storage_key_unique` UNIQUE(`storage_key`)
);
--> statement-breakpoint
CREATE TABLE `project_revisions` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`proposed_by_id` varchar(36) NOT NULL,
	`status` enum('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'SUBMITTED',
	`changes` json NOT NULL,
	`decided_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `project_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`revision_id` varchar(36),
	`actor_id` varchar(36) NOT NULL,
	`action` enum('SUBMIT','FORWARD','APPROVE','REJECT','ARCHIVE','UNARCHIVE') NOT NULL,
	`from_status` varchar(20) NOT NULL,
	`to_status` varchar(20) NOT NULL,
	`comment` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(512),
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`action` varchar(100) NOT NULL,
	`target_entity` varchar(50) NOT NULL,
	`target_id` varchar(36),
	`details` json,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_leader_id_users_id_fk` FOREIGN KEY (`leader_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_guide_id_users_id_fk` FOREIGN KEY (`guide_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_technologies` ADD CONSTRAINT `project_technologies_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_technologies` ADD CONSTRAINT `project_technologies_technology_id_technologies_id_fk` FOREIGN KEY (`technology_id`) REFERENCES `technologies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_documents` ADD CONSTRAINT `project_documents_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_documents` ADD CONSTRAINT `project_documents_uploaded_by_id_users_id_fk` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_images` ADD CONSTRAINT `project_images_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_images` ADD CONSTRAINT `project_images_uploaded_by_id_users_id_fk` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_revisions` ADD CONSTRAINT `project_revisions_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_revisions` ADD CONSTRAINT `project_revisions_proposed_by_id_users_id_fk` FOREIGN KEY (`proposed_by_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_revision_id_project_revisions_id_fk` FOREIGN KEY (`revision_id`) REFERENCES `project_revisions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_department_idx` ON `users` (`department_id`);--> statement-breakpoint
CREATE INDEX `users_graduation_year_idx` ON `users` (`graduation_year`);--> statement-breakpoint
CREATE INDEX `academic_years_is_current_idx` ON `academic_years` (`is_current`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `projects_department_status_idx` ON `projects` (`department_id`,`status`);--> statement-breakpoint
CREATE INDEX `projects_academic_year_idx` ON `projects` (`academic_year_id`);--> statement-breakpoint
CREATE INDEX `projects_leader_idx` ON `projects` (`leader_id`);--> statement-breakpoint
CREATE INDEX `projects_guide_idx` ON `projects` (`guide_id`);--> statement-breakpoint
CREATE INDEX `projects_approved_at_idx` ON `projects` (`approved_at`);--> statement-breakpoint
CREATE INDEX `project_members_user_idx` ON `project_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `project_technologies_technology_idx` ON `project_technologies` (`technology_id`);--> statement-breakpoint
CREATE INDEX `project_documents_project_idx` ON `project_documents` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_images_project_idx` ON `project_images` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_revisions_project_status_idx` ON `project_revisions` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `approvals_project_idx` ON `approvals` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `approvals_actor_idx` ON `approvals` (`actor_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`user_id`,`is_read`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_target_idx` ON `audit_logs` (`target_entity`,`target_id`);