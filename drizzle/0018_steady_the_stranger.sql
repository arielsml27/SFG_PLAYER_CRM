CREATE TABLE `club_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`country` text,
	`league` text,
	`club` text,
	`position_sought` text,
	`transfer_budget` text,
	`salary_budget` text,
	`notes` text,
	`handled_by_user_id` text,
	`deal_partner` text,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`handled_by_user_id`) REFERENCES `crm_users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `request_proposed_players` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`player_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `club_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `request_proposed_players_idx` ON `request_proposed_players` (`request_id`,`player_id`);