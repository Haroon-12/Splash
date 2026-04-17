# Browse Brands & Brand Profiles

## Overview
Influencers can browse all approved brands on the platform, view their profiles, and initiate conversations.

---

## Files Involved

| File | Route | Purpose |
|---|---|---|
| `src/app/dashboard/browse-brands/page.tsx` | `/dashboard/browse-brands` | Browse brands page (influencer view) |
| `src/app/profile/[id]/page.tsx` | `/profile/[id]` | Generic user profile page (works for brands) |
| `src/app/api/users/brands/route.ts` | `/api/users/brands` | GET — list all approved brands |
| `src/app/api/users/[id]/route.ts` | `/api/users/[id]` | GET — fetch single user profile |

---

## Browse Brands Page — `src/app/dashboard/browse-brands/page.tsx`

### What It Does
- Fetches all approved brands from `/api/users/brands`
- Displays brand cards in responsive grid
- Search by name or email
- Each card shows: avatar, name, email, verified badge, join date

### Card Actions
1. **View Profile** — navigates to `/profile/[brandId]`
2. **Contact** (influencer only) — starts or opens conversation with the brand

### Technical Details
- Data source: queries `user` table WHERE `userType = 'brand'` AND `isApproved = true`
- Uses `localStorage.getItem("bearer_token")` for auth header
- Conversation creation: checks for existing conversation first, creates new one if none exists
- Handles 409 conflict (duplicate conversation) gracefully

---

## Generic Profile Page — `src/app/profile/[id]/page.tsx`

### What It Does
- Fetches user data from `/api/users/[id]`
- Shows: avatar, name, user type badge, approval status, email, join date, approval date
- Message button (only for brands/admins viewing non-admin profiles)
- "This is your profile" notice if viewing own profile

### Technical Details
- Calls GET `/api/users/[id]` with auth token
- On error: shows toast "Failed to load user profile" and redirects to `/dashboard`
- Uses `PlatformLayout` wrapper (sidebar included)

---

## User Profile API — `src/app/api/users/[id]/route.ts`

### What It Does
- GET endpoint to fetch any user's profile by their ID
- Requires authenticated session (calls `auth.api.getSession()`)
- Queries `user` table by `id`
- Strips sensitive fields (password) before returning
- Converts date fields to ISO strings for consistent JSON

### Response Shape
```json
{
  "id": "...",
  "name": "...",
  "email": "...",
  "image": "...",
  "userType": "brand",
  "isApproved": true,
  "createdAt": "2026-...",
  "updatedAt": "2026-...",
  "approvedAt": "2026-..."
}
```

---

## Brands API — `src/app/api/users/brands/route.ts`

### What It Does
- Simple GET endpoint
- Queries: `SELECT * FROM user WHERE userType = 'brand' AND isApproved = true ORDER BY createdAt`
- Returns full array of brand user records
