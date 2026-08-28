CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'מפעל ייצור' NOT NULL,
	`contact_name` text,
	`phone` text,
	`whatsapp` text,
	`email` text,
	`city` text,
	`payment_terms` text,
	`lead_days` integer DEFAULT 0 NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `work_order_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`author` text DEFAULT 'מפעל' NOT NULL,
	`mime` text DEFAULT 'image/jpeg' NOT NULL,
	`data` blob NOT NULL,
	`bytes` integer DEFAULT 0 NOT NULL,
	`caption` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `work_order_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`author` text DEFAULT 'מפעל' NOT NULL,
	`status` text,
	`eta` text,
	`body` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`wo_number` text NOT NULL,
	`order_id` text NOT NULL,
	`order_item_id` text,
	`supplier_id` text NOT NULL,
	`scope` text DEFAULT 'ייצור מלא' NOT NULL,
	`instructions` text,
	`status` text DEFAULT 'נשלח' NOT NULL,
	`sent_at` text,
	`due_date` text,
	`factory_eta` text,
	`received_at` text,
	`metal_sent_g` real DEFAULT 0 NOT NULL,
	`metal_returned_g` real DEFAULT 0 NOT NULL,
	`cost` real DEFAULT 0 NOT NULL,
	`cost_currency` text DEFAULT 'ILS' NOT NULL,
	`access_token` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_orders_wo_number_unique` ON `work_orders` (`wo_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `work_orders_access_token_unique` ON `work_orders` (`access_token`);