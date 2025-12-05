CREATE TABLE `brand_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text,
	`industry` text,
	`description` text,
	`website` text,
	`logo` text,
	`target_audience` text,
	`preferred_categories` text,
	`budget_range` text,
	`geographic_focus` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`objectives` text,
	`category` text NOT NULL,
	`target_audience` text,
	`budget` text,
	`budget_range` text,
	`start_date` integer,
	`end_date` integer,
	`status` text NOT NULL,
	`required_platforms` text,
	`content_requirements` text,
	`geographic_target` text,
	`min_followers` integer,
	`max_followers` integer,
	`min_engagement_rate` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `collaborations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` text NOT NULL,
	`influencer_id` text NOT NULL,
	`campaign_id` integer,
	`product_id` integer,
	`status` text NOT NULL,
	`rating` integer,
	`influencer_rating` integer,
	`performance_metrics` text,
	`notes` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`influencer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`target_audience` text,
	`price_range` text,
	`features` text,
	`use_cases` text,
	`brand_values` text,
	`image_url` text,
	`website` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
