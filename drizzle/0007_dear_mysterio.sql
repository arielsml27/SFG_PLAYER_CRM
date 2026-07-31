ALTER TABLE `players` ADD `subscription_tier` text DEFAULT 'BASIC' NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `premium_requested_at` text;