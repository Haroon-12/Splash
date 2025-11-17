import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';



// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  userType: text("user_type"),
  isApproved: integer("is_approved", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  approvedBy: text("approved_by").references(() => user.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  participant1Id: text("participant1_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  participant2Id: text("participant2_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: integer("is_read", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  readAt: integer("read_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Influencer profile extensions
export const influencerProfiles = sqliteTable("influencer_profiles", {
  id: text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  category: text("category"),
  instagram: text("instagram"),
  youtube: text("youtube"),
  facebook: text("facebook"),
  tiktok: text("tiktok"),
  imageUrl: text("image_url"),
  notes: text("notes"),
  instagramFollowers: text("instagram_followers"),
  instagramLikes: text("instagram_likes"),
  instagramViews: text("instagram_views"),
  youtubeFollowers: text("youtube_followers"),
  youtubeLikes: text("youtube_likes"),
  youtubeViews: text("youtube_views"),
  facebookFollowers: text("facebook_followers"),
  facebookLikes: text("facebook_likes"),
  facebookViews: text("facebook_views"),
  tiktokFollowers: text("tiktok_followers"),
  tiktokLikes: text("tiktok_likes"),
  tiktokViews: text("tiktok_views"),
  description: text("description"),
  previousBrands: text("previous_brands"),
  gender: text("gender"),
  activeHours: text("active_hours"),
  images: text("images"), // JSON string for multiple images
  portfolioSamples: text("portfolio_samples"), // JSON string for portfolio items
  rateCard: text("rate_card"), // JSON string for pricing
  availability: text("availability"), // JSON string for calendar
  preferredBrands: text("preferred_brands"), // JSON string for brand preferences
  contentPreferences: text("content_preferences"), // JSON string for content types
  geographicReach: text("geographic_reach"), // JSON string for locations
  verificationBadges: text("verification_badges"), // JSON string for verified platforms
  lastProfileUpdate: integer("last_profile_update", { mode: "timestamp" }),
  profileCompleteness: integer("profile_completeness").$defaultFn(() => 0), // 0-100 percentage
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Profile claim requests
export const profileClaims = sqliteTable("profile_claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  csvRecordId: text("csv_record_id").notNull(), // Reference to CSV row
  claimReason: text("claim_reason").notNull(),
  proofImages: text("proof_images"), // JSON string for uploaded images
  idDocument: text("id_document"), // Path to ID document
  status: text("status").notNull().$defaultFn(() => "pending"), // pending, approved, rejected
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  rejectionReason: text("rejection_reason"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Notifications system
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // profile_update_reminder, claim_approved, claim_rejected, new_message, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  readAt: integer("read_at", { mode: "timestamp" }),
  actionUrl: text("action_url"), // URL to navigate when notification is clicked
  metadata: text("metadata"), // JSON string for additional data
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Profile update reminders
export const profileUpdateReminders = sqliteTable("profile_update_reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  lastReminderSent: integer("last_reminder_sent", { mode: "timestamp" }),
  reminderCount: integer("reminder_count").$defaultFn(() => 0),
  isActive: integer("is_active", { mode: "boolean" })
    .$defaultFn(() => true)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Admin-only accounts tracking
export const adminAccounts = sqliteTable("admin_accounts", {
  id: text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  createdBy: text("created_by").notNull().references(() => user.id),
  permissions: text("permissions"), // JSON string for specific permissions
  isSuperAdmin: integer("is_super_admin", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
