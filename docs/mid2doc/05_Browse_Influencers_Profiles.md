# Browse Influencers & Influencer Profiles

## Overview
Brands can browse a combined directory of influencers sourced from both the CSV master list and registered platform users. The browse page supports searching, filtering, and inline actions (invite to campaign, message, view profile).

---

## Files Involved

### Frontend
| File | Route | Purpose |
|---|---|---|
| `src/app/dashboard/browse-influencers/page.tsx` | `/dashboard/browse-influencers` | Main browse page for brands |
| `src/app/dashboard/profile/[id]/page.tsx` | `/dashboard/profile/[id]` | Full influencer profile page |
| `src/app/dashboard/profile/edit/page.tsx` | `/dashboard/profile/edit` | Influencer self-edit profile |

### Backend API
| File | Endpoint | Methods |
|---|---|---|
| `src/app/api/influencers-with-accounts/route.ts` | `/api/influencers-with-accounts` | GET — merged CSV + DB data |
| `src/app/api/csv-influencers/route.ts` | `/api/csv-influencers` | GET (all CSV), POST (match by name/email) |
| `src/app/api/csv-data/route.ts` | `/api/csv-data` | GET — fetch specific CSV record |
| `src/app/api/influencer-profiles/route.ts` | `/api/influencer-profiles` | POST — create profile |
| `src/app/api/influencer-profiles/[id]/route.ts` | `/api/influencer-profiles/[id]` | GET, POST, PATCH — view/update profile |
| `src/app/api/directory/influencers/route.ts` | `/api/directory/influencers` | GET — public directory |

### Data Source
| File | Purpose |
|---|---|
| `influencers.csv` | Master CSV with 100+ influencer records |
| `src/lib/csv-loader.ts` | Parses CSV into structured objects |
| `src/lib/search-utils.ts` | Search and filter utility functions |

---

## Browse Influencers Page — `src/app/dashboard/browse-influencers/page.tsx`

### What It Does
- Fetches merged influencer data (CSV + registered users) from `/api/influencers-with-accounts`
- Displays influencer cards in a responsive grid (1 col mobile, 2 tablet, 3 desktop)
- Each card shows: avatar, name, email, category badge, social platform links with follower counts, verified/account badge

### Search & Filtering
- **Text search:** Matches against name, email, category, description, previous brands
- **Category filter:** Dropdown with predefined categories (Fashion, Travel, Food, Tech, etc.)
- **Follower range filter:** Min/max follower count (parses K/M suffixes)
- **Platform filter:** Checkboxes for Instagram, YouTube, TikTok, Facebook
- **Search relevance sorting:** Exact name matches ranked highest, then partial matches

### Card Layout (Fixed for overflow)
- Flex layout with `min-w-0` on text container to prevent overflow
- `truncate` on name and email to prevent long text pushing badges out
- `flex-shrink-0` on the verified/account badge to keep it visible
- Social links with colored circular icons and follower count display

### Action Buttons per Card
1. **View Profile** — navigates to `/dashboard/profile/[id]`
2. **Invite** (brand only, requires account) — opens campaign selection modal
3. **Message** (brand only, requires account) — starts or opens conversation
4. **Follower counts** formatted: raw numbers → K/M (e.g., 150000 → 150.0K)

### Campaign Invite Flow
- Brand clicks "Invite" → modal shows dropdown of their active campaigns
- Select campaign → POST to `/api/collaborations` with influencerId + campaignId
- Creates a collaboration with `pending` status

---

## Influencer Profile Page — `src/app/dashboard/profile/[id]/page.tsx`

### What It Shows
- **Profile Card:** Avatar, name, category badge, account status, email, message button
- **Social Media Stats:** Followers per platform with formatted numbers
- **About Section:** Description, notes
- **Social Media Links:** Clickable links to Instagram, YouTube, TikTok, Facebook
- **Previous Brands:** Past brand collaborations
- **Active Hours:** When the influencer is most active
- **Gender:** With color-coded icon
- **Engagement Stats:** Likes and views per platform
- **Preferences:** Preferred brands, content preferences, geographic reach (parsed from JSON)
- **Advanced:** Portfolio samples, images gallery, rate card, availability calendar

### Profile Lookup Logic
The page accepts various ID formats and tries to find the influencer:
1. Direct `csvRecordId` match
2. Direct `userId` match (for registered users)
3. Name or email match
4. `csv-` prefix → extract identifier → search by name/email
5. Hyphenated string → split and try name + email extraction
6. Fallback: fetch from `/api/csv-data` endpoint

---

## Edit Profile — `src/app/dashboard/profile/edit/page.tsx`

### What It Does
- Influencer-only page for updating their own profile
- Form fields: category, social media URLs, description, gender, active hours
- Advanced fields: rate card (JSON), availability (JSON calendar), portfolio, preferred brands, content preferences, geographic reach
- Submits via PATCH to `/api/influencer-profiles/[id]`
- Profile completeness percentage calculated

---

## Data Merge: CSV + Database — `/api/influencers-with-accounts`

### How It Works
1. Load all records from `influencers.csv` via `csv-loader.ts`
2. Fetch all registered users with `userType = 'influencer'` from DB
3. Fetch all `influencerProfiles` table records
4. For each CSV record, check if a matching user exists (by email or name)
5. If match found: merge CSV data with DB data, set `hasAccount = true`
6. If no match: return CSV-only data with `hasAccount = false`
7. Also include DB-only users (registered but not in CSV) separately
8. Result: unified list with both data sources marked

---

## CSV Loader — `src/lib/csv-loader.ts`

### What It Does
- Reads `influencers.csv` from project root using `csv-parse`
- Maps CSV columns to structured fields: name, category, instagram, youtube, facebook, tiktok, email, gender, description, previousBrands, followers/likes/views per platform, activeHours, notes
- Returns array of typed objects
- Handles edge cases: missing columns, empty values, whitespace trimming
