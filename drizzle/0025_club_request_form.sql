CREATE TABLE `request_links` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`club_id` text,
	`contact_id` text,
	`contact_name` text,
	`created_by` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`contact_id`) REFERENCES `club_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `crm_users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `request_links_token_unique` ON `request_links` (`token`);--> statement-breakpoint
ALTER TABLE `club_requests` ADD `source` text;--> statement-breakpoint
ALTER TABLE `club_requests` ADD `request_link_id` text REFERENCES request_links(id);
