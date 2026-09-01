CREATE TABLE `club_team_contacts` (
  	`id` text PRIMARY KEY NOT NULL,
  	`club_team_id` text NOT NULL,
  	`name` text NOT NULL,
  	`role` text,
  	`phone` text,
  	`email` text,
  	`created_at` text DEFAULT (current_timestamp) NOT NULL,
  	FOREIGN KEY (`club_team_id`) REFERENCES `club_teams`(`id`) ON UPDATE no action ON DELETE cascade
  );
--> statement-breakpoint
CREATE TABLE `club_teams` (
  	`id` text PRIMARY KEY NOT NULL,
  	`club_id` text NOT NULL,
  	`name` text NOT NULL,
  	`notes` text,
  	`created_at` text DEFAULT (current_timestamp) NOT NULL,
  	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE cascade
  );
