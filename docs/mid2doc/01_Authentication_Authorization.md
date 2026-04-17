# Authentication & Authorization System

## Overview
The platform uses **better-auth** for authentication with email/password credentials. It supports three user roles: `admin`, `brand`, and `influencer`, each with different platform access levels.

## Technical Stack
- **Auth Library:** `better-auth` v1.3.10
- **Database Adapter:** `drizzle-orm` with SQLite via `better-sqlite3`
- **Session Management:** Cookie-based, 7-day expiry with caching
- **Password Hashing:** Built-in bcrypt via better-auth

---

## Files Involved

### Server-Side Auth Configuration
**File:** `src/lib/auth.ts`

- Initializes `betterAuth()` with Drizzle adapter pointing to SQLite database
- Configures `emailAndPassword` provider (email verification disabled)
- Defines custom user fields: `userType` (string) and `isApproved` (boolean)
- Session config: 7-day expiry, cookie caching enabled, cookie name `better-auth.session_token`
- Exports `getCurrentUser()` helper for API routes

### Client-Side Auth
**File:** `src/lib/auth-client.ts`

- Creates `authClient` using `createAuthClient()` from `better-auth/react`
- Exports `useSession` hook for components to access current user session
- Used throughout the app for login state, user type checks, conditional rendering

### Auth API Handler
**File:** `src/app/api/auth/[...all]/route.ts`

- Catch-all route that delegates to `auth.handler`
- Handles: signup, signin, signout, session refresh, etc.

### Route Protection Middleware
**File:** `middleware.ts`

- Runs on every request matching: `/dashboard`, `/dashboard/*`, `/admin`, `/admin/*`, `/profile`, `/analytics`, `/campaigns`
- Calls `auth.api.getSession()` with request headers
- **No session:** Redirects to `/login`
- **Has session but not admin:** Trying to access `/admin/*` → redirected to `/dashboard`
- Uses Node.js runtime (not Edge) due to SQLite dependency

---

## Login Page
**File:** `src/app/login/page.tsx`

### What It Does
- Email + password login form
- "Remember Me" checkbox
- Show/hide password toggle (Eye/EyeOff icons)
- Handles suspension detection (checks error message for "suspended")
- On success: waits 1s for session establishment, then redirects to `/dashboard`

### Technical Details
- Uses `authClient.signIn.email()` for authentication
- Stores session token automatically via cookies
- Error handling: suspension vs invalid credentials differentiation
- UI: Split layout — form on left, branding panel on right (hidden on mobile)
- Animations: Framer Motion `opacity + y` entrance

---

## Registration Page
**File:** `src/app/register/page.tsx`

### What It Does
3-step registration flow:
1. **Step 1 — Type Selection:** User chooses "Influencer" or "Brand"
2. **Step 2 — Form:** Name, email, password, confirm password
3. **Step 3 — Claim (influencers only):** If CSV match found, user can claim an existing profile

### Form Validation (added in latest update)
- **Name:** Cannot be empty, cannot contain numbers (`/\d/` test), cannot contain special characters (allows spaces, hyphens, apostrophes)
- **Email:** Cannot be empty, must match email regex pattern
- **Password:** Minimum 8 characters, must match confirmation
- Show/hide password toggles on both password fields

### Profile Claim Flow
- When an influencer registers, the system checks CSV data via `/api/csv-influencers` POST
- If matches found → shows matching profiles → user selects one and provides claim reason
- Claim submitted to `/api/profile-claims` with registration data, claim reason, proof images, ID document
- Account is NOT created yet — only after admin approval
- User redirected to `/claim-status?claimId=xxx`

### "This Is Not Me" Path
- If user doesn't match any CSV profile, account is created immediately via `authClient.signUp.email()`
- Redirected to `/dashboard`

### Technical Details
- Uses `authClient.signUp.email()` with custom `userType` field
- File uploads via `/api/upload` endpoint
- State management: `useState` for form data, step tracking, file handling
- UI: Same split layout as login

---

## Account Suspension Check
**File:** `src/lib/suspension-check.ts`

- Utility function to check if a user's account has been suspended
- Used by login flow to show appropriate error message

---

## Database Tables Used
- `user` — stores all user accounts with `userType` and `isApproved` flags
- `session` — active sessions with tokens and expiry
- `account` — credential storage (hashed passwords)
- `verification` — OTP/email verification tokens
