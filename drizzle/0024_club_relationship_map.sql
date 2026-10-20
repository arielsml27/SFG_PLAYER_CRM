CREATE TABLE `proposals_sent` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`club_id` text,
	`club_name_free` text,
	`sent_at` text DEFAULT (current_timestamp) NOT NULL,
	`sent_by` text,
	`language` text,
	`status` text DEFAULT 'SENT' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `club_contacts` ADD `relationship_level` integer;--> statement-breakpoint
ALTER TABLE `club_contacts` ADD `relationship_owner` text;--> statement-breakpoint
ALTER TABLE `club_contacts` ADD `last_contact_at` text;--> statement-breakpoint
ALTER TABLE `clubs` ADD `primary_contact_id` text REFERENCES `club_contacts`(`id`) ON DELETE set null;
