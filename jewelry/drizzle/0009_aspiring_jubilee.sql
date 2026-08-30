ALTER TABLE `order_items` ADD `center_cut` text;--> statement-breakpoint
ALTER TABLE `order_items` ADD `center_color` text;--> statement-breakpoint
ALTER TABLE `order_items` ADD `center_clarity` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `quote_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `center_cut` text;--> statement-breakpoint
ALTER TABLE `products` ADD `center_color` text;--> statement-breakpoint
ALTER TABLE `products` ADD `center_clarity` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `quote_valid_days` real DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `quote_lead_time` text DEFAULT '14 – 21 ימי עסקים' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `quote_payment_methods` text DEFAULT 'העברה בנקאית · אפליקציות תשלום · מזומן' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `quote_terms` text DEFAULT 'הצעת המחיר בתוקף ל-7 ימים ממועד הפקתה.
פריטים בהתאמה אישית — לא ניתן לבטל לאחר תחילת הייצור.
כל פריט נמסר עם תעודת הערכה גמולוגית לביטוח.
התמונות להמחשה בלבד; ייתכנו שינויים קלים בייצור.' NOT NULL;