CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`spent_at` text NOT NULL,
	`category` text DEFAULT 'אחר' NOT NULL,
	`description` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'ILS' NOT NULL,
	`fx_at_spend` real DEFAULT 0 NOT NULL,
	`amount_usd` real DEFAULT 0 NOT NULL,
	`supplier_id` text,
	`invoice_number` text,
	`is_recurring` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE set null
);
