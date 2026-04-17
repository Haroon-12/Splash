# Dashboard — Main Hub

## Overview
The main dashboard (`/dashboard`) is the central landing page after login. It displays role-specific statistics, recent activity, and quick action buttons tailored to the user's type (brand, influencer, or admin).

## File
**`src/app/dashboard/page.tsx`** (~16KB, ~430 lines)

---

## What It Does

### For All Users
- Shows welcome message with user's name
- Displays role-specific stats in a card grid
- Quick Actions grid with navigation shortcuts
- Recent activity section

### For Brands
- Stats: Total campaigns, active collaborations, total influencers reached, pending invites
- Quick Actions: Create Campaign, Browse Influencers, Generate Ad, View Analytics, Messages
- Shows recent campaigns and collaboration activity

### For Influencers
- Stats: Active collaborations, campaign invites, profile views, messages
- Quick Actions: Browse Brands, Browse Campaigns, Edit Profile, Messages
- Shows recent collaboration requests

### For Admins
- Redirects to `/admin/dashboard`

---

## Technical Details

### Data Fetching
- Fetches dashboard stats from `/api/dashboard/stats` on mount
- Uses `useSession()` hook to get current user info and role
- Conditional rendering based on `session.user.userType`

### Navigation Logic
- "Generate Ad" button routes to `/dashboard/ad-generation` (fixed in recent update)
- Quick action cards use `router.push()` for navigation
- Each action card has an icon, title, and description

### UI Components Used
- `PlatformLayout` — wraps content with sidebar
- `Card` / `CardHeader` / `CardContent` — stat cards
- `motion.div` — Framer Motion animations (staggered card entrance)
- Icons from `lucide-react`

### Key Implementation Notes
- Stats are fetched fresh on every page load (no caching)
- Admin users are immediately redirected — dashboard never renders for them
- Quick actions grid is responsive: 2 columns on mobile, 3 on tablet, 4 on desktop

---

## API Dependency
**`src/app/api/dashboard/stats/route.ts`**
- GET endpoint that returns aggregated counts
- Queries: campaigns count, collaborations count, messages count
- Filtered by user ID and user type
