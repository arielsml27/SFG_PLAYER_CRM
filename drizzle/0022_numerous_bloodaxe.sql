CREATE TABLE `meetings` (
	`id` text PRIMARY KEY NOT NULL,
	`with_whom` text NOT NULL,
	`context` text,
	`responsible_user_id` text,
	`meeting_type` text DEFAULT 'IN_PERSON' NOT NULL,
	`meeting_date` text,
	`meeting_time` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`responsible_user_id`) REFERENCES `crm_users`(`id`) ON UPDATE no action ON DELETE set null
);
