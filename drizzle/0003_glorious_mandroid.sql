CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`participant1_id` text NOT NULL,
	`participant2_id` text NOT NULL,
	`last_message_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`participant1_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant2_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `approved` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `approved_by` text;--> statement-breakpoint
ALTER TABLE `user` ADD `approved_at` integer;