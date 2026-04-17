# Splash Platform — Complete Directory & Feature Map

> **Project:** Splash – Brand-Influencer Collaboration Platform  
> **Tech Stack:** Next.js 15 (App Router, Turbopack), React 19, TypeScript, Drizzle ORM, SQLite (better-sqlite3), Better-Auth, Tailwind CSS 4, Framer Motion, Recharts, Replicate AI, AES-256-GCM Encryption  
> **Last Updated:** April 17, 2026

---

## 1. Root-Level Configuration

| File | Purpose |
|---|---|
| `package.json` | Dependencies & scripts. `npm run dev` uses Turbopack. |
| `drizzle.config.ts` | Drizzle ORM config pointing to `local.db` (SQLite). |
| `middleware.ts` | Route protection — redirects unauthenticated users; blocks non-admins from `/admin`. |
| `next.config.ts` | Next.js config (image domains, etc.). |
| `influencers.csv` | **Master CSV** of 100+ influencers (name, socials, followers, category, etc.). Loaded at runtime. |
| `claims-store.json` | File-based store for profile claim requests (used before DB migration). |
| `.env` | Environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `CHAT_ENCRYPTION_SECRET`, `REPLICATE_API_TOKEN`, `NEXTAUTH_URL`. |

---

## 2. Database Layer — `src/db/`

| File | Purpose |
|---|---|
| `src/db/index.ts` | Creates Drizzle ORM instance with `better-sqlite3` driver. |
| `src/db/schema.ts` | **All 14 database tables** defined here (see Section 2.1). |

### 2.1 Database Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `user` | All users (admin, brand, influencer) | id, name, email, userType, isApproved, approvedBy |
| `session` | Auth sessions | token, userId, expiresAt |
| `account` | Auth provider accounts | password (hashed), providerId |
| `verification` | Email/OTP verification tokens | identifier, value, expiresAt |
| `conversations` | Chat conversations between 2 users | participant1Id, participant2Id, lastMessageAt |
| `messages` | Chat messages (encrypted) | conversationId, senderId, content, attachmentUrl |
| `influencerProfiles` | Extended influencer data | category, socials, followers, embedding, rateCard |
| `profileClaims` | Claim requests for CSV profiles | csvRecordId, claimReason, proofImages, status |
| `notifications` | User notifications + Smart Alerts | type, title, message, isSmartAlert, actionUrl |
| `profileUpdateReminders` | Tracks profile update reminders | lastReminderSent, reminderCount |
| `adminAccounts` | Admin privilege tracking | createdBy, permissions, isSuperAdmin |
| `brandProfiles` | Extended brand data | companyName, industry, targetAudience |
| `campaigns` | Marketing campaigns | brandId, title, budget, status, embedding |
| `products` | Brand products for recommendations | brandId, name, category, embedding |
| `collaborations` | Brand-influencer collaborations | brandId, influencerId, campaignId, status, rating |
| `affiliateLinks` | Tracking links for analytics | brandId, influencerId, destinationUrl, isActive |
| `clickEvents` | Click tracking on affiliate links | linkId, deviceType, referrer, country |

---

## 3. Authentication & Security — `src/lib/`

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | **better-auth** server config. Email+password auth, custom `userType` and `isApproved` fields, 7-day sessions. |
| `src/lib/auth-client.ts` | Client-side auth helper using `better-auth/react`. |
| `src/lib/encryption.ts` | **AES-256-GCM** E2E chat encryption. Uses PBKDF2 key derivation from conversation+participant IDs. Functions: `encryptText`, `decryptText`, `encryptBinary`, `decryptBinary`. |
| `src/lib/encryption-client.ts` | Client-side encryption utilities. |
| `src/lib/aes256gsm.js` | Low-level AES-256-GCM implementation. |
| `src/lib/suspension-check.ts` | Checks if a user account is suspended. |

---

## 4. Core Library Modules — `src/lib/`

| File | Purpose |
|---|---|
| `src/lib/csv-loader.ts` | Parses `influencers.csv` into structured objects. Maps columns to fields (name, socials, followers, etc.). |
| `src/lib/embeddings.ts` | **Vector embeddings** using `@xenova/transformers`. Generates 384-dim embeddings for influencer profiles, campaigns, products. Used by recommendation engine. |
| `src/lib/recommendation-engine.ts` | **AI Recommendation Engine** (~42KB). Cosine similarity matching for: campaign→influencer, product→influencer, influencer→campaign recommendations. Scoring algorithm with weighted factors. |
| `src/lib/search-utils.ts` | Search helpers: fuzzy name matching, category matching, follower range filtering, platform filtering. |
| `src/lib/file-claims-store.ts` | File-based JSON store for profile claims (fallback when DB unavailable). |
| `src/lib/utils.ts` | `cn()` helper for Tailwind class merging. |

---

## 5. Frontend Pages — `src/app/`

### 5.1 Public Pages (No auth required)

| Route | File | Feature |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page (redirects to `/login`) |
| `/login` | `src/app/login/page.tsx` | **Login** — email+password, show/hide password toggle, remember me |
| `/register` | `src/app/register/page.tsx` | **Registration** — 3-step flow: type selection → form (with validation) → profile claim (for influencers) |
| `/register/complete` | `src/app/register/complete/` | Registration completion page |
| `/claim-status` | `src/app/claim-status/page.tsx` | **Public claim status** — check claim by ID, shows reviewer name & email |
| `/forgot-password` | `src/app/forgot-password/` | Password reset request |
| `/reset-password` | `src/app/reset-password/` | Password reset form |
| `/verify-otp` | `src/app/verify-otp/` | OTP verification |

### 5.2 Dashboard Pages (Auth required — all user types)

| Route | File | Feature |
|---|---|---|
| `/dashboard` | `src/app/dashboard/page.tsx` | **Main Dashboard** — role-based stats, recent activity, quick actions grid |
| `/dashboard/chat` | `src/app/dashboard/chat/page.tsx` | **Real-time Chat** — E2E encrypted messaging, file attachments, read receipts, unread counts |
| `/dashboard/collaborations` | `src/app/dashboard/collaborations/page.tsx` | **Collaborations** — view/manage brand-influencer partnerships, accept/reject invites |
| `/dashboard/claim-status` | `src/app/dashboard/claim-status/page.tsx` | Dashboard claim status view |

### 5.3 Brand-Only Pages

| Route | File | Feature |
|---|---|---|
| `/dashboard/browse-influencers` | `src/app/dashboard/browse-influencers/page.tsx` | **Browse Influencers** — search, filter by category/followers/platform, invite to campaign, view profiles |
| `/dashboard/campaigns` | `src/app/dashboard/campaigns/page.tsx` | **My Campaigns** — list all campaigns, edit button (for non-completed) |
| `/dashboard/campaigns/create` | `src/app/dashboard/campaigns/create/page.tsx` | **Create Campaign** — multi-field form with objectives, budget, platforms, audience |
| `/dashboard/campaigns/[id]` | `src/app/dashboard/campaigns/[campaignId]/page.tsx` | **Campaign Detail** — full view, recommended influencers, applications |
| `/dashboard/campaigns/[id]/edit` | `src/app/dashboard/campaigns/[campaignId]/edit/page.tsx` | **Edit Campaign** — pre-populated form, PATCH update |
| `/dashboard/ad-generation` | `src/app/dashboard/ad-generation/page.tsx` | **AI Ad Generation** — text-to-ad using Replicate API, generates image + taglines + caption + hashtags |
| `/dashboard/analytics` | `src/app/dashboard/analytics/page.tsx` | **Analytics Dashboard** — affiliate link tracking, click stats, charts (Recharts), generate/copy tracking links |
| `/dashboard/products/recommend` | `src/app/dashboard/products/recommend/page.tsx` | **Product Recommendations** — AI-powered influencer matching for products |

### 5.4 Influencer-Only Pages

| Route | File | Feature |
|---|---|---|
| `/dashboard/browse-brands` | `src/app/dashboard/browse-brands/page.tsx` | **Browse Brands** — search & view brand profiles, start conversations |
| `/dashboard/campaigns/browse` | `src/app/dashboard/campaigns/browse/page.tsx` | **Browse Active Campaigns** — view available campaigns from brands |
| `/dashboard/profile/edit` | `src/app/dashboard/profile/edit/page.tsx` | **Edit Influencer Profile** — update socials, category, rate card, availability, portfolio |

### 5.5 Shared Profile Pages

| Route | File | Feature |
|---|---|---|
| `/dashboard/profile/[id]` | `src/app/dashboard/profile/[id]/page.tsx` | **Influencer Profile View** — full stats, social links, engagement, previous brands |
| `/profile/[id]` | `src/app/profile/[id]/page.tsx` | **Generic User Profile** — works for brands & influencers (fetches from `/api/users/[id]`) |

### 5.6 Admin Pages

| Route | File | Feature |
|---|---|---|
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | **Admin Dashboard** — platform stats, user counts, pending approvals |
| `/admin/users` | `src/app/admin/users/page.tsx` | **User List** — view all users, approve/suspend accounts |
| `/admin/user-management` | `src/app/admin/user-management/page.tsx` | **User Management** — advanced user administration |
| `/admin/create-accounts` | `src/app/admin/create-accounts/page.tsx` | **Create Accounts** — admin creates brand/influencer accounts with validation |
| `/admin/add-admin` | `src/app/admin/add-admin/page.tsx` | **Add Admin** — create new admin accounts |
| `/admin/claims` | `src/app/admin/claims/page.tsx` | **Profile Claims** — review, approve/reject influencer profile claims |

### 5.7 Other Pages

| Route | File | Feature |
|---|---|---|
| `/help` | `src/app/help/page.tsx` | Help/FAQ page |
| `/settings` | `src/app/settings/page.tsx` | User settings |
| `/billing` | `src/app/billing/page.tsx` | Billing/payment page |
| `/browse` | `src/app/browse/page.tsx` | General browse page |
| `/directory/influencer/[email]` | `src/app/directory/influencer/[email]/page.tsx` | External influencer profile (public directory) |

---

## 6. API Routes — `src/app/api/`

### 6.1 Authentication

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/auth/[...all]` | `src/app/api/auth/[...all]/route.ts` | ALL | better-auth catch-all handler |
| `/api/otp/` | `src/app/api/otp/` | POST | OTP generation/verification |

### 6.2 User Management

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/users` | `src/app/api/users/route.ts` | GET | List all users |
| `/api/users/[id]` | `src/app/api/users/[id]/route.ts` | GET | Get single user profile |
| `/api/users/[id]/approve` | `src/app/api/users/[id]/approve/route.ts` | PUT | Approve user account |
| `/api/users/brands` | `src/app/api/users/brands/route.ts` | GET | List all approved brands |
| `/api/users/influencers` | `src/app/api/users/influencers/route.ts` | GET | List all approved influencers |
| `/api/users/update-type` | `src/app/api/users/update-type/route.ts` | POST | Update user type |

### 6.3 Admin

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/admin/create` | `src/app/api/admin/create/` | POST | Create new accounts (admin) |
| `/api/admin/created-accounts` | `src/app/api/admin/created-accounts/` | GET | List admin-created accounts |
| `/api/admin/delete-account` | `src/app/api/admin/delete-account/` | DELETE | Delete user account |
| `/api/admin/profile-claims` | `src/app/api/admin/profile-claims/route.ts` | GET, PATCH | List claims, approve/reject (uses session admin name) |
| `/api/admin/users` | `src/app/api/admin/users/` | GET | Admin user listing |

### 6.4 Messaging & Chat

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/conversations` | `src/app/api/conversations/route.ts` | GET, POST | List/create conversations |
| `/api/conversations/[id]` | `src/app/api/conversations/[conversationId]/route.ts` | GET | Get conversation details |
| `/api/conversations/[id]/messages` | `src/app/api/conversations/[conversationId]/messages/route.ts` | GET | Get messages (auto-decrypted) |
| `/api/messages` | `src/app/api/messages/route.ts` | GET, POST | Send/fetch messages (encrypted) |
| `/api/messages/[id]/read` | `src/app/api/messages/[messageId]/read/route.ts` | PATCH | Mark message as read |
| `/api/chat/` | `src/app/api/chat/` | - | Chat utilities |

### 6.5 Campaigns

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/campaigns` | `src/app/api/campaigns/route.ts` | GET, POST | List/create campaigns |
| `/api/campaigns/[id]` | `src/app/api/campaigns/[campaignId]/route.ts` | GET, PATCH, DELETE | View/update/delete campaign |
| `/api/campaigns/active` | `src/app/api/campaigns/active/` | GET | List active campaigns |
| `/api/campaigns/influencer` | `src/app/api/campaigns/influencer/` | GET | Campaigns for influencer |

### 6.6 Collaborations

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/collaborations` | `src/app/api/collaborations/route.ts` | GET, POST, PATCH | List, create, update collaborations |

### 6.7 Influencer Data

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/csv-influencers` | `src/app/api/csv-influencers/route.ts` | GET, POST | Read CSV data, match by name/email |
| `/api/csv-data` | `src/app/api/csv-data/route.ts` | GET | Fetch specific CSV record |
| `/api/influencers-with-accounts` | `src/app/api/influencers-with-accounts/route.ts` | GET | Merged CSV + DB influencer data |
| `/api/influencer-profiles` | `src/app/api/influencer-profiles/route.ts` | POST | Create influencer profile |
| `/api/influencer-profiles/[id]` | `src/app/api/influencer-profiles/[id]/route.ts` | GET, POST, PATCH | View/create/update profile |
| `/api/directory/influencers` | `src/app/api/directory/influencers/route.ts` | GET | Public influencer directory |

### 6.8 Profile Claims

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/profile-claims` | `src/app/api/profile-claims/route.ts` | POST, GET | Submit/view claims |
| `/api/claim-status/[id]` | `src/app/api/claim-status/[claimId]/route.ts` | GET | Public claim status with parsed names |
| `/api/create-approved-account` | `src/app/api/create-approved-account/route.ts` | POST | Creates account after claim approval |

### 6.9 AI & Recommendations

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/generate-ad` | `src/app/api/generate-ad/route.ts` | POST | AI ad generation via Replicate API |
| `/api/recommendations/campaign/[id]` | `src/app/api/recommendations/campaign/[campaignId]/route.ts` | GET | AI influencer recommendations for campaign |
| `/api/recommendations/product/[id]` | `src/app/api/recommendations/product/[productId]/route.ts` | GET | AI influencer recommendations for product |
| `/api/recommendations/browse` | `src/app/api/recommendations/browse/route.ts` | GET | General browse recommendations |
| `/api/products` | `src/app/api/products/route.ts` | GET, POST | Brand products CRUD |

### 6.10 Analytics

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/affiliates/` | `src/app/api/affiliates/` | - | Affiliate link management |
| `/api/track/[linkId]` | `src/app/api/track/[linkId]/route.ts` | GET | Click tracking redirect |
| `/api/dashboard/stats` | `src/app/api/dashboard/stats/route.ts` | GET | Dashboard statistics |

### 6.11 Notifications

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/notifications` | `src/app/api/notifications/route.ts` | GET, PATCH, DELETE | Fetch/mark-read/delete notifications |
| `/api/notifications/generate-smart-alerts` | `src/app/api/notifications/generate-smart-alerts/route.ts` | POST | AI-generated smart alerts |
| `/api/profile-update-notification` | `src/app/api/profile-update-notification/route.ts` | POST, GET | Profile update reminders |

### 6.12 Other

| Endpoint | File | Methods | Purpose |
|---|---|---|---|
| `/api/upload` | `src/app/api/upload/route.ts` | POST | File upload handler |
| `/api/encryption/secret` | `src/app/api/encryption/secret/route.ts` | GET | Get encryption secret (for client-side) |

---

## 7. Components — `src/components/`

### 7.1 Platform Components — `src/components/platform/`

| File | Purpose |
|---|---|
| `platform-layout.tsx` | Main dashboard layout wrapper (sidebar + content area) |
| `sidebar.tsx` | Navigation sidebar — role-based menu items, sign-out |
| `notification-bell.tsx` | Notification dropdown — tabs (All/Notifications/Smart Alerts), unread count, mark read |
| `help-chatbot.tsx` | In-app chatbot component |
| `analytics-dashboard.tsx` | Full analytics dashboard component with charts, link management, stats |

### 7.2 Landing Page Components — `src/components/`

| File | Purpose |
|---|---|
| `Header.tsx` | Landing page header/navigation |
| `HeroSection.tsx` | Landing page hero with animations |
| `FeaturesSection.tsx` | Feature cards section |
| `HowItWorksSection.tsx` | Step-by-step guide |
| `TestimonialsSection.tsx` | User testimonials |
| `CTASection.tsx` | Call-to-action section |
| `Footer.tsx` | Landing page footer |
| `AccountModal.tsx` | Account type selection modal |
| `ErrorReporter.tsx` | Global error reporting component |

### 7.3 UI Components — `src/components/ui/`

Shadcn/Radix UI component library (Button, Card, Input, Select, Dialog, Badge, Avatar, Tabs, ScrollArea, etc.)

---

## 8. Middleware & Route Protection

**File:** `middleware.ts`

| Rule | Effect |
|---|---|
| No session → redirect `/login` | Protects `/dashboard/*`, `/admin/*`, `/profile`, `/analytics`, `/campaigns` |
| Session but not admin → redirect `/dashboard` | Protects `/admin/*` routes |

---

## 9. Key Data Flows

### 9.1 Registration → Claim → Approval
```
/register → select type → fill form → (if influencer) check CSV matches
  → match found → submit claim → /claim-status?claimId=xxx
  → admin reviews at /admin/claims → approve → account created via /api/create-approved-account
  → no match → account created directly
```

### 9.2 Chat Encryption
```
Sender types message → /api/messages POST → server encrypts with AES-256-GCM
  → stored encrypted in DB → recipient fetches via /api/conversations/[id]/messages
  → server decrypts → returns plaintext to client
```

### 9.3 AI Recommendation
```
Brand creates campaign → embedding generated (Xenova transformers)
  → /api/recommendations/campaign/[id] → cosine similarity vs influencer embeddings
  → ranked results returned with match scores
```
