CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization` text,
	`role` text,
	`country` text,
	`city` text,
	`phone` text,
	`whatsapp` text,
	`email` text,
	`notes` text,
	`trusted` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
