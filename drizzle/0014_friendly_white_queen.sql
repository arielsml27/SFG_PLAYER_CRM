CREATE TABLE `prospects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`club` text,
	`position` text,
	`age` integer,
	`parent_phone` text,
	`contacted_by_user_id` text,
	`status` text DEFAULT 'NOT_CONTACTED' NOT NULL,
	`meeting_date` text,
	`meeting_time` text,
	`meeting_location` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`contacted_by_user_id`) REFERENCES `crm_users`(`id`) ON UPDATE no action ON DELETE set null
);
