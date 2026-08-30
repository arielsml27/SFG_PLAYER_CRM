CREATE TABLE `order_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`kind` text DEFAULT 'עיצוב' NOT NULL,
	`mime` text DEFAULT 'image/jpeg' NOT NULL,
	`data` blob NOT NULL,
	`bytes` integer DEFAULT 0 NOT NULL,
	`caption` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `access_token` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_link_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `design_approved_at` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `design_approval_note` text;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_access_token_unique` ON `orders` (`access_token`);