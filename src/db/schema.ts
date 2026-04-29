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
  attachmentType: text("attachment_type"), // 'image', 'document', 'voice'
  attachmentUrl: text("attachment_url"), // URL to the file
  attachmentName: text("attachment_name"), // Original filename
  attachmentSize: integer("attachment_size"), // File size in bytes
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
  stripeAccountId: text("stripe_account_id"), // Stripe Connect account ID
  stripeConnectStatus: text("stripe_connect_status").$defaultFn(() => "pending"), // pending, active, restricted
  embedding: text("embedding"), // JSON string for vector embedding
  embeddingText: text("embedding_text"), // Text used to generate embedding
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
  isSmartAlert: integer("is_smart_alert", { mode: "boolean" })
    .default(false)
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

// Brand profiles (extended info for brands)
export const brandProfiles = sqliteTable("brand_profiles", {
  id: text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  companyName: text("company_name"),
  industry: text("industry"), // JSON string for multiple industries
  description: text("description"),
  website: text("website"),
  logo: text("logo"),
  targetAudience: text("target_audience"), // JSON string for demographics
  preferredCategories: text("preferred_categories"), // JSON string for influencer categories
  budgetRange: text("budget_range"), // JSON string for min/max budget
  geographicFocus: text("geographic_focus"), // JSON string for locations
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Campaigns
export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: text("brand_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  objectives: text("objectives"), // JSON string for campaign objectives
  category: text("category").notNull(), // Influencer category needed
  targetAudience: text("target_audience"), // JSON string for demographics
  budget: text("budget"), // Budget amount
  budgetRange: text("budget_range"), // JSON string for min/max
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  status: text("status").notNull().$defaultFn(() => "draft"), // draft, active, completed, paused, cancelled
  requiredPlatforms: text("required_platforms"), // JSON string for platforms
  contentRequirements: text("content_requirements"), // JSON string for content types
  geographicTarget: text("geographic_target"), // JSON string for locations
  minFollowers: integer("min_followers"),
  maxFollowers: integer("max_followers"),
  minEngagementRate: text("min_engagement_rate"), // Percentage as string
  embedding: text("embedding"), // JSON string for vector embedding
  embeddingText: text("embedding_text"), // Text used to generate embedding
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Products (for product-based recommendations)
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: text("brand_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Product category
  targetAudience: text("target_audience"), // JSON string for demographics
  priceRange: text("price_range"), // JSON string for min/max price
  features: text("features"), // JSON string for product features
  useCases: text("use_cases"), // JSON string for use cases
  brandValues: text("brand_values"), // JSON string for brand values
  imageUrl: text("image_url"),
  website: text("website"),
  embedding: text("embedding"), // JSON string for vector embedding
  embeddingText: text("embedding_text"), // Text used to generate embedding
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Collaborations (track past collaborations for learning)
export const collaborations = sqliteTable("collaborations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: text("brand_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  influencerId: text("influencer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  status: text("status").notNull().$defaultFn(() => "pending"), // pending, active, completed, cancelled
  dealAmount: integer("deal_amount"), // Initial amount offered by brand in cents (e.g. 10000 = $100)
  proposedAmount: integer("proposed_amount"), // Amount proposed during negotiation in cents
  negotiationStatus: text("negotiation_status").$defaultFn(() => "none"), // none, pending_influencer, pending_brand, accepted, rejected
  paymentStatus: text("payment_status").$defaultFn(() => "unfunded"), // unfunded, funded, released
  rating: integer("rating"), // 1-5 rating from brand
  influencerRating: integer("influencer_rating"), // 1-5 rating from influencer
  performanceMetrics: text("performance_metrics"), // JSON string for engagement, reach, etc.
  notes: text("notes"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Analytics Dashboard: Tracking Affiliate Links
export const affiliateLinks = sqliteTable("affiliate_links", {
  id: text("id").primaryKey(), // Used as the shortcode URL (e.g., sp.sh/x8jK)
  brandId: text("brand_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  influencerId: text("influencer_id").references(() => user.id, { onDelete: "set null" }), // Optional: tied to a specific influencer
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }), // Optional: tied to a specific campaign
  destinationUrl: text("destination_url").notNull(), // The actual website to redirect to
  title: text("title"), // Internal name for the link (e.g. "Summer Sale Link")
  isActive: integer("is_active", { mode: "boolean" })
    .$defaultFn(() => true)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Analytics Dashboard: Click Interactions
export const clickEvents = sqliteTable("click_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  linkId: text("link_id").notNull().references(() => affiliateLinks.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"), // Hashed or masked IP for unique visitor counting
  userAgent: text("user_agent"), // Raw user agent string
  deviceType: text("device_type"), // Parsed: 'mobile', 'desktop', 'tablet'
  referrer: text("referrer"), // Which site they came from (Instagram, YouTube, etc.)
  country: text("country"), // Geo-location if possible
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Brand Subscriptions
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  brandId: text("brand_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  planType: text("plan_type").notNull().$defaultFn(() => "basic"), // basic, tier1, premium, team
  billingInterval: text("billing_interval"), // monthly, yearly
  status: text("status").notNull().$defaultFn(() => "inactive"), // active, past_due, canceled, inactive
  currentPeriodStart: integer("current_period_start", { mode: "timestamp" }),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Teams/Workspaces for Team Plans
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().$defaultFn(() => "member"), // admin, member
  joinedAt: integer("joined_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Escrow Transactions
export const escrowTransactions = sqliteTable("escrow_transactions", {
  id: text("id").primaryKey(),
  collaborationId: integer("collaboration_id").notNull().references(() => collaborations.id, { onDelete: "cascade" }),
  brandId: text("brand_id").notNull().references(() => user.id),
  influencerId: text("influencer_id").notNull().references(() => user.id),
  baseAmount: integer("base_amount").notNull(), // in cents
  brandFee: integer("brand_fee").notNull(), // 7% in cents
  influencerFee: integer("influencer_fee").notNull(), // 7% in cents
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeTransferId: text("stripe_transfer_id"),
  status: text("status").notNull().$defaultFn(() => "pending"), // pending, held, released, refunded
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  releasedAt: integer("released_at", { mode: "timestamp" }),
});

// Ad Generation Tracking
export const adGenerations = sqliteTable("ad_generations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: text("brand_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  prompt: text("prompt"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
