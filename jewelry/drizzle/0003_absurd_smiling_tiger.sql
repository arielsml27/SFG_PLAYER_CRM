CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`kind` text DEFAULT 'מקדמה' NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'ILS' NOT NULL,
	`fx_at_payment` real DEFAULT 0 NOT NULL,
	`amount_usd` real DEFAULT 0 NOT NULL,
	`paid_at` text NOT NULL,
	`method` text DEFAULT 'העברה' NOT NULL,
	`reference` text,
	`green_invoice_number` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
