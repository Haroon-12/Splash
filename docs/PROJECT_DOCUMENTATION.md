# Project Documentation

## Tech Stack Overview
- Framework: Next.js 15 App Router (React, Server/Client Components)
- Language: TypeScript
- UI: Tailwind CSS + shadcn/ui components
- Icons: lucide-react
- Animations: framer-motion
- Auth: better-auth (server + react client)
- ORM: Drizzle ORM (SQLite)
- DB: local SQLite (file: `local.db`) via Drizzle
- File Storage: Local disk under `public/uploads`
- CSV Dataset: `influencers.csv` processed via custom logic

## Repository overview
- `src/app` — Routes (pages) and API endpoints
  - Page routes map to URLs; `page.tsx` files render UI
  - API routes under `app/api/**/route.ts`
- `src/components` — Reusable UI components
- `src/lib` — Auth config, utilities, file stores
- `src/db` — Drizzle schema and DB init
- `public` — Static assets and uploaded files
- `scripts` — Admin/user seed utilities
- `drizzle` — Migrations and metadata
- Root configs: `next.config.ts`, `middleware.ts`, `eslint.config.mjs`, `tsconfig.json`

## Data Model (Drizzle)
- File: `src/db/schema.ts`
  - `user`: core user accounts (id, email, userType, flags like isApproved/isSuspended)
  - `session`, `account`: better-auth tables for sessions and credentials
  - `influencerProfiles`: extended influencer attributes (social links, metrics, notes)
  - `profileClaims`: file-based via `src/lib/file-claims-store.ts` (JSON store), not in DB
  - `notifications`, `profileUpdateReminders`, `adminAccounts`: supporting tables
  - Key additions: `account.password` for credential auth; profile fields include Likes/Views

## Database Initialization
- File: `src/db/index.ts`
  - Exports `db` configured for SQLite + Drizzle
- Migrations in `drizzle/` are applied to `local.db`

## Authentication and Sessions
- Server config: `src/lib/auth.ts`
  - `betterAuth({ emailAndPassword: { enabled: true, requireEmailVerification: false }, plugins: [] })`
  - Exposes server helpers (e.g., `auth.api.getSession`)
- Client config: `src/lib/auth-client.ts`
  - `createAuthClient({ baseURL })` for hooks like `useSession`
- API route: `src/app/api/auth/[...all]/route.ts`
  - better-auth handler for sign-in/up, sessions
- Session access middleware:
  - `src/lib/suspension-check.ts` checks `session.user.isSuspended` for protected routes
- Passwords
  - Admin creation hashes passwords with bcrypt (`src/app/api/admin/create/route.ts`)
  - User credential checks handled by better-auth backend provider



## CSV Dataset Processing
- File: `src/app/api/csv-influencers/route.ts`
  - Reads `influencers.csv`, robust parser that avoids splitting on commas inside parentheses
  - Exposes parsed influencer records for matching and registration checks
- File: `src/app/api/csv-data/route.ts`
  - Additional CSV accessors used across dashboard flows

## File Uploads and Claims
- Upload API: `src/app/api/upload/route.ts`
  - Accepts `FormData` file, writes to `public/uploads`, returns metadata
- Claims store: `src/lib/file-claims-store.ts`
  - JSON-backed store (`claims-store.json`), sync reload to ensure fresh reads
  - Interfaces include `proofImages: ImageData[]` and `idDocument: ImageData`
- Claims APIs:
  - Create claim: `src/app/api/profile-claims/route.ts`
  - Admin review: `src/app/api/admin/profile-claims/route.ts` (GET/PATCH approve/reject)
  - Claim status: `src/app/api/claim-status/[claimId]/route.ts`

## Admin Features
- Pages
  - Dashboard: `src/app/admin/dashboard/page.tsx` (stats + Home button)
  - Claims: `src/app/admin/claims/page.tsx` (review dialog with scrollable media and metadata)
  - Users: `src/app/admin/users/page.tsx` (list, suspend/approve)
  - Create Accounts: `src/app/admin/create-accounts/page.tsx`
  - Add Admin: `src/app/admin/add-admin/page.tsx`
- APIs
  - `src/app/api/admin/users/route.ts` and nested `[id]` actions (approve/suspend/delete)
  - `src/app/api/admin/create/route.ts` (creates admin with hashed password)
  - `src/app/api/admin/created-accounts/route.ts`

## User-Facing Pages
- Landing: `src/app/page.tsx`
- Auth: `src/app/login/page.tsx`, `src/app/register/page.tsx`
- Dashboard hub: `src/app/dashboard/page.tsx`
- Profile
  - Edit: `src/app/dashboard/profile/edit/page.tsx` (saves full CSV-aligned fields)
  - View: `src/app/dashboard/profile/[id]/page.tsx` (engagement stats, gender icon, active hours)
  - Claim status: `src/app/dashboard/claim-status/page.tsx`
- Discovery
  - Browse influencers: `src/app/dashboard/browse-influencers/page.tsx`
  - Browse brands: `src/app/dashboard/browse-brands/page.tsx`
  - Directory profile: `src/app/directory/influencer/[email]/page.tsx`
- Messaging: `src/app/messages/page.tsx`, dashboard chat subpages
- Analytics/Billing/Help/Settings: respective pages under `src/app`

## API overview
- Users: `src/app/api/users/route.ts`, `users/influencers`, `users/brands`, `users/update-type`
- Directory: `src/app/api/directory/influencers/route.ts`
- Profiles: `src/app/api/influencer-profiles/route.ts` (collection), `[id]/route.ts` (item)
- Conversations/Messages: conversation creation, listing, message posting/reading
- Notifications: `src/app/api/notifications/route.ts`
- Dashboard Stats: `src/app/api/dashboard/stats/route.ts`

Each `route.ts` defines the HTTP methods (GET/POST/PATCH/DELETE) with Next.js Request/Response objects. Most endpoints either query Drizzle (`db`) or read/write the file‑based claims store, then return JSON.

## UI Components and Hooks
- Layout: `src/components/platform/platform-layout.tsx` (shell: header, sidebar, notifications)
- UI: `src/components/ui/*` shadcn components
- Utility hooks: `src/hooks/use-mobile.ts`, `src/lib/hooks/use-mobile.tsx` (mobile breakpoint helpers)
- Common sections: `Header`, `Footer`, `HeroSection`, etc.

## Middleware and Config
- `middleware.ts`
  - Request-time logic (e.g., route protection or rewrites if present)
- `next.config.ts`
  - Standard Next.js config; removed legacy turbopack custom loader references
- Styles: `src/app/global.css` (Tailwind setup)

## Important Flows
- Registration
  - `src/app/register/page.tsx` calls `authClient.signUp.email` with name/email/password/userType
  - On success, redirect to `/dashboard`
- Profile Edit -> Save
  - PATCH `src/app/api/influencer-profiles/[id]/route.ts` with full form payload (including new Likes/Views/Notes fields)
- Claim Submission
  - Frontend uploads files to `/api/upload`, receives URLs; POST to `/api/profile-claims` storing images and id doc metadata
- Admin Claim Review
  - `/admin/claims` fetches claims; review dialog shows images with fallback and metadata; PATCH approve/reject to admin API
- Dashboard Stats
  - `/api/dashboard/stats` aggregates users/claims; ensures async calls are awaited

## Why we chose these libraries
- Next.js: File-based routing for pages and APIs, SSR/ISR, App Router conventions
- TypeScript: Type safety and maintainability
- Drizzle ORM + SQLite: Simple, typed SQL layer suited for local and small deployments
- better-auth: Lightweight auth with email/password; easy session handling on server and client
- bcryptjs: Secure password hashing for admin accounts
- Tailwind + shadcn/ui: Rapid, consistent UI development
- framer-motion: Smooth animations for page sections
- lucide-react: Consistent iconography

## Session Management
- Client: `useSession` from `src/lib/auth-client.ts`
- Server: `auth.api.getSession({ headers })` inside API routes/utilities (e.g., `suspension-check.ts`)
- Protected operations validate the session and user flags (approved/suspended)

## Password Handling
- Creation: Plaintext password provided only at registration; hashed with bcrypt for admin creation
- Verification: better-auth credential flow validates password server-side



## Environment and Running
- Dev server: `npm run dev`
- DB file: `local.db` in project root
- Uploads: `public/uploads/*`
- CSV: `influencers.csv` in project root

## Notable Design Choices
- Claims data stored in JSON for simplicity; APIs ensure sync reload for fresh reads
- CSV parser customized to handle commas within parentheses in names
- Engagement number formatting supports K/M/B and conversions for 1000M -> 1B
- UI improvements for accessibility and visual clarity (icons, scrollable dialogs)

## File-by-File Index (Key Files)
- `src/lib/auth.ts` — better-auth server config
- `src/lib/auth-client.ts` — better-auth client config and hooks
- `src/db/schema.ts` — Drizzle schema; tables and types
- `src/lib/file-claims-store.ts` — Claims JSON storage and helpers
- `src/app/api/**/route.ts` — All backend endpoints (admin, users, profiles, messages, claims, uploads)
- `src/app/**/page.tsx` — Pages for admin, dashboard, profiles, messaging, etc.
- `src/components/platform/*` — Layout, notifications, sidebar
- `middleware.ts` — Request middleware
- `next.config.ts` — Next.js config

## Build Output: .next Folder
- Purpose: Next.js build output and cache directory generated by `next dev`/`next build`.
- Contents:
  - `.next/server` — compiled server bundles for API routes and Server Components
  - `.next/static` — hashed client assets served to the browser
  - `.next/cache` — compiler/cache artifacts to speed up builds
  - Manifests (routes, middleware, etc.) used internally by Next.js
- Notes:
  - Auto-generated; safe to delete. It will be recreated on the next run/build.
  - Should be ignored by VCS (already in `.gitignore`).
  - Clearing it can fix stale builds or loader/config changes not taking effect.

## Database Migrations: drizzle Folder
- Purpose: Stores SQL migrations and Drizzle metadata to version your schema.
- Contents:
  - `000x_*.sql` — ordered migration files containing schema changes
  - `meta/_journal.json` — migration application state
  - `meta/*_snapshot.json` — snapshots of schema state used by Drizzle
- Lifecycle:
  - Generated from your TypeScript schema (`src/db/schema.ts`) via Drizzle tooling
  - Applied to the SQLite database (`local.db`) so all environments share the same schema
- Best Practices:
  - Commit the `drizzle/` folder to version control
  - Do not edit applied migrations; create a new migration to modify schema
  - Run migrations consistently in CI/prod to keep databases in sync

## Static assets: public Folder
- Purpose: Hosts static files served at the site root.
- Access: Files are available at `/{filename}` (e.g., `public/file.svg` -> `/file.svg`).
- Typical contents in this project:
  - Brand/illustration SVGs used by the UI
  - Uploads under `public/uploads/*` written by `/api/upload`
- Notes:
  - Files here are not processed by Webpack; they’re copied as-is.
  - Do not store secrets or dynamic content here.

## Application code: src Folder
- Purpose: All TypeScript/React source for the app and APIs.
- Structure:
  - `src/app` — Next.js App Router pages and API routes
    - `*/page.tsx` page components; `api/**/route.ts` backend endpoints
    - Notable routes: admin pages, dashboard, profile, messaging
  - `src/components` — Reusable UI and layout (platform shell, shadcn UI wrappers)
  - `src/db` — Drizzle ORM schema (`schema.ts`) and DB init (`index.ts`), seeds
  - `src/hooks` — Shared React hooks (e.g., `use-mobile`)
  - `src/lib` — Auth config (server/client), utilities, claims file store, suspension check
- Notes:
  - Pages are colocated by feature under `app/*` for clarity
  - API and UI are versioned together, simplifying data contracts

## Auth API: app/api/auth
- Location: `src/app/api/auth/[...all]/route.ts`
- How it works: A single catch‑all route delegates to Better Auth’s Next.js handler:
  - It maps requests like `/api/auth/sign-in`, `/api/auth/session`, `/api/auth/sign-out`, etc., to the auth engine.
  - Code:
    - `toNextJsHandler(auth)` returns `{ GET, POST }` handlers that dispatch based on the URL.
- Why there aren’t separate files for `sign-in` or `session`:
  - The catch‑all route replaces per‑endpoint files. We previously had those routes but removed them to avoid duplication.
  - Session management and sign‑in flows live inside Better Auth; our code only wires the handler.

## Developer access (safe recovery, no bypass)
- We do not disable password requirements in any environment.
- If you lose access in dev:
  - Create a new admin using the provided scripts:
    - `scripts/create-super-admin-simple.ts` or `scripts/seed-admin.ts`
  - Or reset a password by updating the hashed password in the database:
    - Generate a bcrypt hash (e.g., Node REPL):
      - `require('bcryptjs').hashSync('NEW_SECURE_PASSWORD', 10)`
    - Update the `account.password` for the target user (SQLite client or a one‑off script) with the new hash.
- Production: use an audited, admin‑only password reset flow. Do not patch binaries or disable checks.

