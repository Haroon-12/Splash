CREATE TABLE `admin_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`permissions` text,
	`is_super_admin` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `influencer_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text,
	`instagram` text,
	`youtube` text,
	`facebook` text,
	`tiktok` text,
	`image_url` text,
	`notes` text,
	`instagram_followers` text,
	`instagram_likes` text,
	`instagram_views` text,
	`youtube_followers` text,
	`youtube_likes` text,
	`youtube_views` text,
	`facebook_followers` text,
	`facebook_likes` text,
	`facebook_views` text,
	`tiktok_followers` text,
	`tiktok_likes` text,
	`tiktok_views` text,
	`description` text,
	`previous_brands` text,
	`gender` text,
	`active_hours` text,
	`images` text,
	`portfolio_samples` text,
	`rate_card` text,
	`availability` text,
	`preferred_brands` text,
	`content_preferences` text,
	`geographic_reach` text,
	`verification_badges` text,
	`last_profile_update` integer,
	`profile_completeness` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer NOT NULL,
	`read_at` integer,
	`action_url` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profile_claims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`csv_record_id` text NOT NULL,
	`claim_reason` text NOT NULL,
	`proof_images` text,
	`id_document` text,
	`status` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profile_update_reminders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`last_reminder_sent` integer,
	`reminder_count` integer,
	`is_active` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `is_read` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `is_approved` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "approved_by" TO "approved_by" text REFERENCES user(id) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `approved`;