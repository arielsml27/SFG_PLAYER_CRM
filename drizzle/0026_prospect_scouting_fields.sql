ALTER TABLE `prospects` ADD `transfermarkt_url` text;
--> statement-breakpoint
ALTER TABLE `prospects` ADD `whatsapp` text;
--> statement-breakpoint
ALTER TABLE `prospects` ADD `checked` integer DEFAULT false NOT NULL;
