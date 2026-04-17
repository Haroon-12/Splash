# Settings, Help & Other Pages

## Overview
Additional platform pages for user settings, help/FAQ, billing, and the public influencer directory.

---

## Settings Page
**File:** `src/app/settings/page.tsx` | **Route:** `/settings`

### What It Does
- User account settings management
- Change name, email, password
- Theme preferences (dark/light mode)
- Notification preferences
- Account deletion option

---

## Help Page
**File:** `src/app/help/page.tsx` | **Route:** `/help`

### What It Does
- FAQ section with common questions
- Platform guide and tutorials
- Contact support information
- Searchable help topics

---

## Help Chatbot
**File:** `src/components/platform/help-chatbot.tsx`

### What It Does
- Floating chatbot button (bottom-right corner of the dashboard)
- Opens an interactive chat interface
- Pre-built responses for common questions
- Guides users through platform features
- Available on all authenticated pages (part of PlatformLayout)

---

## Billing Page
**File:** `src/app/billing/page.tsx` | **Route:** `/billing`

### What It Does
- Billing and subscription management page
- Stripe integration planned (dependency in package.json)
- Currently placeholder UI

---

## Public Influencer Directory
**File:** `src/app/directory/influencer/[email]/page.tsx` | **Route:** `/directory/influencer/[email]`

### What It Does
- Public-facing influencer profile page (no auth required)
- Accessed via email identifier in URL
- Shows influencer's public information: name, category, social links, stats
- Fetches data from `/api/directory/influencers` endpoint

### API
**File:** `src/app/api/directory/influencers/route.ts`
- GET endpoint for public directory data
- Returns sanitized influencer information (no private data)
- Supports search and category filtering

---

## Forgot Password
**File:** `src/app/forgot-password/` | **Route:** `/forgot-password`

- Email input form
- Sends password reset link/OTP
- Integrates with OTP API

---

## Reset Password
**File:** `src/app/reset-password/` | **Route:** `/reset-password`

- New password form (requires valid reset token)
- Confirm password validation
- Redirects to login on success

---

## OTP Verification
**File:** `src/app/verify-otp/` | **Route:** `/verify-otp`

- OTP input field (6-digit code using `input-otp` library)
- Validates against `/api/otp` endpoint
- Used for email verification and password resets
