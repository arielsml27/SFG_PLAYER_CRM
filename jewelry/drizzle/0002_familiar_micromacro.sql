CREATE TABLE `collection_items` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`product_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`note` text,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`intro` text,
	`customer_id` text,
	`price_mode` text DEFAULT 'מחיר' NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
ALTER TABLE `products` ADD `share_slug` text;--> statement-breakpoint
ALTER TABLE `products` ADD `is_published` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `share_price_mode` text DEFAULT 'מחיר' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `products_share_slug_unique` ON `products` (`share_slug`);--> statement-breakpoint
ALTER TABLE `settings` ADD `whatsapp_number` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `instagram_handle` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `public_base_url` text;