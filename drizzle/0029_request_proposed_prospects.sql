CREATE TABLE `request_proposed_prospects` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`prospect_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `club_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `request_proposed_prospects_idx` ON `request_proposed_prospects` (`request_id`,`prospect_id`);
