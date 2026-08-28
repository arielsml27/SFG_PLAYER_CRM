CREATE TABLE `product_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`mime` text DEFAULT 'image/jpeg' NOT NULL,
	`data` blob NOT NULL,
	`width` integer DEFAULT 0 NOT NULL,
	`height` integer DEFAULT 0 NOT NULL,
	`bytes` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`caption` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'טבעת' NOT NULL,
	`description` text,
	`karat` text DEFAULT '18K' NOT NULL,
	`metal_color` text DEFAULT 'צהוב' NOT NULL,
	`weight_g` real DEFAULT 0 NOT NULL,
	`center_stone_type` text,
	`center_desc` text,
	`center_carat_total` real DEFAULT 0 NOT NULL,
	`center_price_per_ct` real DEFAULT 0 NOT NULL,
	`side_stones_on` integer DEFAULT false NOT NULL,
	`side_stone_type` text,
	`side_carat_total` real DEFAULT 0 NOT NULL,
	`side_price_per_ct` real DEFAULT 0 NOT NULL,
	`goldsmith_cost` real DEFAULT 0 NOT NULL,
	`center_setting_price` real DEFAULT 0 NOT NULL,
	`center_setting_qty` real DEFAULT 0 NOT NULL,
	`side_setting_price` real DEFAULT 0 NOT NULL,
	`side_setting_qty` real DEFAULT 0 NOT NULL,
	`rhodium_cost` real DEFAULT 0 NOT NULL,
	`box_cost` real DEFAULT 0 NOT NULL,
	`bag_cost` real DEFAULT 0 NOT NULL,
	`packaging_cost` real DEFAULT 0 NOT NULL,
	`multiplier` real DEFAULT 2 NOT NULL,
	`price_retail_usd` real,
	`price_wholesale_usd` real,
	`is_available` integer DEFAULT true NOT NULL,
	`times_sold` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
ALTER TABLE `order_items` ADD `product_id` text;