CREATE TABLE `availability` (
	`id` text PRIMARY KEY NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `availability_start_idx` ON `availability` (`start`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`service_id` text NOT NULL,
	`service_name` text NOT NULL,
	`price` integer NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`note` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_token_hash_unique` ON `bookings` (`token_hash`);--> statement-breakpoint
CREATE INDEX `bookings_time_idx` ON `bookings` (`start`,`end`,`status`);--> statement-breakpoint
CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`duration` integer NOT NULL,
	`price` integer NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
