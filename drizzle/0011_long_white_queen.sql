CREATE TABLE `questionnaire_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`section_id` text NOT NULL,
	`question_id` text NOT NULL,
	`value` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `questionnaire_responses_player_question_idx` ON `questionnaire_responses` (`player_id`,`question_id`);