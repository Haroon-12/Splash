-- CreateTable
CREATE TABLE "influencer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
    "image_url" TEXT,
    "notes" TEXT,
    "instagram_followers" TEXT,
    "instagram_likes" TEXT,
    "instagram_views" TEXT,
    "youtube_followers" TEXT,
    "youtube_likes" TEXT,
    "youtube_views" TEXT,
    "facebook_followers" TEXT,
    "facebook_likes" TEXT,
    "facebook_views" TEXT,
    "tiktok_followers" TEXT,
    "tiktok_likes" TEXT,
    "tiktok_views" TEXT,
    "description" TEXT,
    "previous_brands" TEXT,
    "gender" TEXT,
    "active_hours" TEXT,
    "images" TEXT,
    "portfolio_samples" TEXT,
    "rate_card" TEXT,
    "availability" TEXT,
    "preferred_brands" TEXT,
    "content_preferences" TEXT,
    "geographic_reach" TEXT,
    "verification_badges" TEXT,
    "last_profile_update" INTEGER,
    "profile_completeness" INTEGER DEFAULT 0,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,
    CONSTRAINT "influencer_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "user" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "profile_claims" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "csv_record_id" TEXT NOT NULL,
    "claim_reason" TEXT NOT NULL,
    "proof_images" TEXT,
    "id_document" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" INTEGER,
    "rejection_reason" TEXT,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,
    CONSTRAINT "profile_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE,
    CONSTRAINT "profile_claims_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "user" ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" INTEGER NOT NULL DEFAULT 0,
    "read_at" INTEGER,
    "action_url" TEXT,
    "metadata" TEXT,
    "created_at" INTEGER NOT NULL,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "profile_update_reminders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "last_reminder_sent" INTEGER,
    "reminder_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,
    CONSTRAINT "profile_update_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "admin_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_by" TEXT NOT NULL,
    "permissions" TEXT,
    "is_super_admin" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL,
    CONSTRAINT "admin_accounts_id_fkey" FOREIGN KEY ("id") REFERENCES "user" ("id") ON DELETE CASCADE,
    CONSTRAINT "admin_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user" ("id")
);
