CREATE TABLE `club_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`club_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`phone` text,
	`email` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `clubs` ADD `transfermarkt_link` text;--> statement-breakpoint
ALTER TABLE `clubs` ADD `logo_path` text;