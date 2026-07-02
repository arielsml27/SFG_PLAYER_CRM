DROP TABLE `scouting_reports`;
--> statement-breakpoint
CREATE TABLE `scouting_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`scouted_by` text,
	`last_watched_date` text,
	`summary` text,
	`position_group` text,
	`technical_ratings` text,
	`speed` real,
	`pace` real,
	`stamina` real,
	`explosiveness` real,
	`support_play` real,
	`crossing` real,
	`strength` real,
	`durability` real,
	`concentration` real,
	`attitude` real,
	`motivation` real,
	`work_rate` real,
	`leadership` real,
	`composure` real,
	`family_cooperation` real,
	`family_involvement_balance` real,
	`family_expectations` real,
	`family_stability` real,
	`family_professionalism` real,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scouting_reports_player_id_unique` ON `scouting_reports` (`player_id`);
