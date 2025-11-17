## File-to-page/section index (what maps to what)

### App Router pages (browser UI)
- `src/app/page.tsx` — Landing/Home
- `src/app/login/page.tsx` — Login page
- `src/app/register/page.tsx` — Registration page
- `src/app/dashboard/page.tsx` — Dashboard hub
- `src/app/dashboard/browse-influencers/page.tsx` — Browse influencers
- `src/app/dashboard/browse-brands/page.tsx` — Browse brands

<!-- - `src/app/dashboard/analytics/page.tsx` — User analytics
- `src/app/dashboard/ad-generation/page.tsx` — Ad generation
- `src/app/dashboard/chat/page.tsx` — Messages (dashboard view) -->



- `src/app/dashboard/claim-status/page.tsx` — Claim status list
- `src/app/dashboard/profile/edit/page.tsx` — Edit profile form
- `src/app/dashboard/profile/[id]/page.tsx` — Profile view (own or other)
- `src/app/directory/influencer/[email]/page.tsx` — Public influencer profile (directory)
<!-- - `src/app/messages/page.tsx` — Messages (standalone)
- `src/app/ads/page.tsx` — Ads page
- `src/app/analytics/page.tsx` — Analytics (standalone) -->
- `src/app/browse/page.tsx` — Browse hub
<!-- - `src/app/billing/page.tsx` — Billing
- `src/app/help/page.tsx` — Help center
- `src/app/settings/page.tsx` — Settings -->
- `src/app/claim-status/page.tsx` — Claim status (standalone)
- `src/app/admin/dashboard/page.tsx` — Admin dashboard
- `src/app/admin/claims/page.tsx` — Admin claims review
- `src/app/admin/users/page.tsx` — Admin users list
- `src/app/admin/user-management/page.tsx` — Admin user management
- `src/app/admin/create-accounts/page.tsx` — Admin create accounts
- `src/app/admin/add-admin/page.tsx` — Admin add admin
- Layout and error surfaces:
  - `src/app/layout.tsx` — Root layout
  - `src/app/global-error.tsx` — Global error UI
  - `src/app/global.css` — Global styles

### API routes (backend endpoints)
- Auth (catch‑all):
  - `src/app/api/auth/[...all]/route.ts` — Better Auth handler for sign-in, session, sign-out, etc.
- Admin:
  - `src/app/api/admin/create/route.ts` — Create admin
  - `src/app/api/admin/users/route.ts` — List users (admin)
  - `src/app/api/admin/users/[id]/route.ts` — Get/delete user
  - `src/app/api/admin/users/[id]/approve/route.ts` — Approve user
  - `src/app/api/admin/users/[id]/suspend/route.ts` — Suspend user
  - `src/app/api/admin/delete-account/[id]/route.ts` — Delete account
  - `src/app/api/admin/created-accounts/route.ts` — List created accounts
  - `src/app/api/admin/profile-claims/route.ts` — Admin claims (GET/PATCH approve/reject)
- Users/Directory:
  - `src/app/api/users/route.ts` — List users
  - `src/app/api/users/influencers/route.ts` — List influencers
  - `src/app/api/users/brands/route.ts` — List brands
  - `src/app/api/users/[id]/approve/route.ts` — Approve user (non-admin path)
  - `src/app/api/users/update-type/route.ts` — Update user type
  - `src/app/api/directory/influencers/route.ts` — Directory influencers
  - `src/app/api/influencers-with-accounts/route.ts` — Influencers with accounts
- Profiles:
  - `src/app/api/influencer-profiles/route.ts` — Create/list profiles
  - `src/app/api/influencer-profiles/[id]/route.ts` — Get/patch profile by id
- Claims/Notifications:
  - `src/app/api/profile-claims/route.ts` — Create claim
  - `src/app/api/claim-status/[claimId]/route.ts` — Claim status by id
  - `src/app/api/notifications/route.ts` — Notifications
  - `src/app/api/profile-update-notification/route.ts` — Profile update reminder
<!-- - Conversations/Messages:
  - `src/app/api/conversations/route.ts` — Create/list conversations
  - `src/app/api/conversations/[conversationId]/route.ts` — Conversation by id
  - `src/app/api/conversations/[conversationId]/messages/route.ts` — Messages list/create
  - `src/app/api/messages/route.ts` — Create message
  - `src/app/api/messages/[messageId]/read/route.ts` — Mark read -->
- CSV/Data:
  - `src/app/api/csv-influencers/route.ts` — Parse `influencers.csv`
  - `src/app/api/csv-data/route.ts` — Additional CSV accessors
- Dashboard stats:
  - `src/app/api/dashboard/stats/route.ts` — Aggregated stats for admin/user
- Uploads:
  - `src/app/api/upload/route.ts` — File upload to `public/uploads`
- Directory helper:
  - `src/app/api/directory/route.ts`  — Directory index

### Libraries and server utilities
- `src/lib/auth.ts` — Better Auth server configuration (Drizzle adapter, session settings)
- `src/lib/auth-client.ts` — Better Auth React client and `useSession()` hook
- `src/lib/suspension-check.ts` — Helper to deny suspended accounts in API routes
- `src/lib/file-claims-store.ts` — JSON file store for claims (sync load, read/update helpers)
- `src/lib/utils.ts` — Misc helpers
- `src/lib/hooks/use-mobile.tsx` — Mobile breakpoint hook (lib colocated)

### Database
- `src/db/schema.ts` — Drizzle schema (user, account, session, influencerProfiles, etc.)
- `src/db/index.ts` — Drizzle database initialization pointing to SQLite
- `src/db/seeds/*.ts` — Seed scripts (users, conversations, messages)
- `drizzle/*` — SQL migrations and metadata (applied to `local.db`)

### Reusable UI components
- Layout shell:
  - `src/components/platform/platform-layout.tsx` — App shell (header/sidebar/notifications)
  - `src/components/platform/notification-bell.tsx` — Notifications
  - `src/components/platform/sidebar.tsx` — Sidebar nav
  - `src/components/platform/help-chatbot.tsx` — Help/chat widget
- Marketing/landing:
  - `src/components/Header.tsx`, `Footer.tsx`, `HeroSection.tsx`, `CTASection.tsx`, `FeaturesSection.tsx`, `HowItWorksSection.tsx`, `TestimonialsSection.tsx`
- UI kit (shadcn wrappers):
  - `src/components/ui/*` — Buttons, Inputs, Dialogs, Cards, etc.

### Middleware/config
- `middleware.ts` — Request‑time logic (e.g., route gating or rewrites if used)
- `next.config.ts` — Next.js configuration
- `next-env.d.ts` — TypeScript Next definition shim
- `eslint.config.mjs`, `tsconfig.json`, `postcss.config.mjs` — Tooling configs




