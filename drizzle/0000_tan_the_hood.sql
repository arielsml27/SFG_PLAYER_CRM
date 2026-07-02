CREATE TABLE `club_contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`club_id` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`monthly_salary` real,
	`signing_bonus` real,
	`release_clause` real,
	`sell_on_percent` real,
	`training_compensation_notes` text,
	`bonuses` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`document_id` text,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clubs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country` text,
	`league` text,
	`city` text,
	`website` text,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`phone` text,
	`email` text,
	`whatsapp` text,
	`relation` text,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`club_id` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`expected_value` real,
	`commission_potential` real,
	`start_date` text,
	`expected_close_date` text,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`file_path` text,
	`expiry_date` text,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `player_links` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`full_name_hebrew` text,
	`full_name_english` text,
	`date_of_birth` text NOT NULL,
	`nationality` text,
	`second_nationality` text,
	`passport_number` text,
	`height` real,
	`weight` real,
	`main_position` text NOT NULL,
	`secondary_positions` text,
	`strong_foot` text,
	`current_club_id` text,
	`current_league` text,
	`current_country` text,
	`status` text DEFAULT 'PROSPECT' NOT NULL,
	`internal_rating` integer,
	`potential_rating` integer,
	`priority_level` integer DEFAULT 0,
	`short_description` text,
	`strengths` text,
	`weaknesses` text,
	`playing_style` text,
	`ideal_role` text,
	`target_level` text,
	`relevant_clubs` text,
	`internal_valuation` text,
	`representation_status` text DEFAULT 'UNKNOWN' NOT NULL,
	`agent_in_charge` text,
	`family_contact_name` text,
	`family_contact_phone` text,
	`family_contact_email` text,
	`address` text,
	`notes` text,
	`tags` text,
	`next_action` text,
	`next_action_date` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`current_club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `representation_agreements` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`commission_percent` real,
	`exclusive` integer DEFAULT false,
	`is_minor` integer DEFAULT false,
	`parents_signed` text DEFAULT 'NA',
	`signed_by` text,
	`document_id` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text,
	`title` text NOT NULL,
	`description` text,
	`owner` text,
	`due_date` text,
	`priority` text DEFAULT 'NORMAL' NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`reminder_date` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_date` text NOT NULL,
	`created_by` text,
	`link` text,
	`document_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`date` text,
	`ready_to_send` integer DEFAULT false,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
