CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'פרטי' NOT NULL,
	`phone` text,
	`whatsapp` text,
	`email` text,
	`instagram` text,
	`country` text DEFAULT 'ישראל',
	`city` text,
	`address` text,
	`source` text,
	`referred_by` text,
	`default_export` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'פעיל' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`name` text DEFAULT 'פריט' NOT NULL,
	`category` text DEFAULT 'טבעת' NOT NULL,
	`notes` text,
	`karat` text DEFAULT '18K' NOT NULL,
	`metal_color` text DEFAULT 'צהוב' NOT NULL,
	`weight_g` real DEFAULT 0 NOT NULL,
	`center_stone_type` text,
	`center_desc` text,
	`center_price_per_ct` real DEFAULT 0 NOT NULL,
	`center_carat_total` real DEFAULT 0 NOT NULL,
	`side_stones_on` integer DEFAULT false NOT NULL,
	`side_stone_type` text,
	`side_desc` text,
	`side_price_per_ct` real DEFAULT 0 NOT NULL,
	`side_carat_total` real DEFAULT 0 NOT NULL,
	`model_on` integer DEFAULT false NOT NULL,
	`model_price` real DEFAULT 0 NOT NULL,
	`goldsmith_cost` real DEFAULT 0 NOT NULL,
	`center_setting_price` real DEFAULT 0 NOT NULL,
	`center_setting_qty` real DEFAULT 0 NOT NULL,
	`side_setting_price` real DEFAULT 0 NOT NULL,
	`side_setting_qty` real DEFAULT 0 NOT NULL,
	`rhodium_cost` real DEFAULT 0 NOT NULL,
	`box_cost` real DEFAULT 0 NOT NULL,
	`bag_cost` real DEFAULT 0 NOT NULL,
	`packaging_cost` real DEFAULT 0 NOT NULL,
	`size` text,
	`engraving` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`multiplier` real DEFAULT 2 NOT NULL,
	`price_override_usd` real,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`customer_id` text NOT NULL,
	`type` text DEFAULT 'בהזמנה' NOT NULL,
	`channel` text DEFAULT 'וואטסאפ' NOT NULL,
	`status` text DEFAULT 'פנייה' NOT NULL,
	`priority` text DEFAULT 'רגיל' NOT NULL,
	`is_export` integer DEFAULT false NOT NULL,
	`event_date` text,
	`promised_date` text,
	`internal_due_date` text,
	`delivered_at` text,
	`gold_spot_snapshot` real DEFAULT 0 NOT NULL,
	`fx_snapshot` real DEFAULT 0 NOT NULL,
	`vat_snapshot` real DEFAULT 0 NOT NULL,
	`deposit_pct` real DEFAULT 30 NOT NULL,
	`green_invoice_number` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE TABLE `rate_history` (
	`id` text PRIMARY KEY NOT NULL,
	`gold_spot_usd_oz` real NOT NULL,
	`fx_usd_ils` real NOT NULL,
	`vat_pct` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`gold_spot_usd_oz` real DEFAULT 0 NOT NULL,
	`fx_usd_ils` real DEFAULT 0 NOT NULL,
	`vat_pct` real DEFAULT 18 NOT NULL,
	`default_multiplier` real DEFAULT 2 NOT NULL,
	`default_deposit_pct` real DEFAULT 30 NOT NULL,
	`business_name` text DEFAULT 'Samuel' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`due_date` text,
	`priority` text DEFAULT 'רגיל' NOT NULL,
	`status` text DEFAULT 'פתוח' NOT NULL,
	`order_id` text,
	`customer_id` text,
	`completed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`customer_id` text,
	`kind` text DEFAULT 'הערה' NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`event_date` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);