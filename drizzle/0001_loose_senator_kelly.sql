ALTER TABLE `bookings` ADD `currency` text DEFAULT 'CAD' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `timezone` text DEFAULT 'America/Toronto' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `location` text DEFAULT '' NOT NULL;