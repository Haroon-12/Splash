# Campaign Management System

## Overview
Brands can create, edit, and manage marketing campaigns. Influencers can browse available campaigns and apply. The system includes AI-powered influencer recommendations using vector embeddings.

---

## Files Involved

### Frontend Pages
| File | Route | Purpose |
|---|---|---|
| `src/app/dashboard/campaigns/page.tsx` | `/dashboard/campaigns` | My Campaigns list (brand view) |
| `src/app/dashboard/campaigns/create/page.tsx` | `/dashboard/campaigns/create` | Create new campaign |
| `src/app/dashboard/campaigns/[campaignId]/page.tsx` | `/dashboard/campaigns/[id]` | Campaign detail view |
| `src/app/dashboard/campaigns/[campaignId]/edit/page.tsx` | `/dashboard/campaigns/[id]/edit` | Edit existing campaign |
| `src/app/dashboard/campaigns/browse/page.tsx` | `/dashboard/campaigns/browse` | Browse active campaigns (influencer view) |

### Backend API
| File | Endpoint | Methods |
|---|---|---|
| `src/app/api/campaigns/route.ts` | `/api/campaigns` | GET (list), POST (create) |
| `src/app/api/campaigns/[campaignId]/route.ts` | `/api/campaigns/[id]` | GET, PATCH, DELETE |
| `src/app/api/campaigns/active/` | `/api/campaigns/active` | GET (active only) |
| `src/app/api/campaigns/influencer/` | `/api/campaigns/influencer` | GET (for influencer view) |

### Database Table
**`campaigns`** — id, brandId, title, description, objectives, category, targetAudience, budget, budgetRange, startDate, endDate, status, requiredPlatforms, contentRequirements, geographicTarget, minFollowers, maxFollowers, embedding, embeddingText

---

## My Campaigns Page — `src/app/dashboard/campaigns/page.tsx`

### What It Does
- Lists all campaigns owned by the logged-in brand
- Shows campaign cards with title, status badge, category, date range
- **Edit button** visible on each card — hidden for `completed` and `cancelled` campaigns
- Clicking a card navigates to campaign detail page

### Status Badges
- `draft` → gray
- `active` / `published` → green
- `paused` → yellow
- `completed` → blue
- `cancelled` → red

---

## Create Campaign — `src/app/dashboard/campaigns/create/page.tsx`

### Form Fields
1. **Title** — campaign name
2. **Description** — detailed description
3. **Category** — dropdown (Fashion, Travel, Food, Tech, Fitness, Beauty, Gaming, etc.)
4. **Objectives** — multi-select checkboxes (Brand Awareness, Sales, Engagement, Content Creation, etc.)
5. **Target Audience** — age range, gender, location fields
6. **Budget** — text input for amount
7. **Budget Range** — min/max range
8. **Date Range** — start and end dates
9. **Required Platforms** — checkboxes (Instagram, YouTube, TikTok, Facebook)
10. **Content Requirements** — text describing what content is needed
11. **Geographic Target** — target regions/countries
12. **Follower Range** — min/max follower requirements

### Technical Implementation
- POST to `/api/campaigns` with all form data
- JSON-stringified fields: objectives, targetAudience, requiredPlatforms, budgetRange
- On create success → redirect to campaign detail page
- Campaign embedding generated server-side for recommendation matching

---

## Edit Campaign — `src/app/dashboard/campaigns/[campaignId]/edit/page.tsx`

### What It Does
- Fetches existing campaign data via GET `/api/campaigns/[id]`
- Pre-populates the same form as creation
- Submits via PATCH `/api/campaigns/[id]`
- JSON fields are carefully parsed before populating form (handles stringified arrays/objects)

### Access Control
- Only visible to brand users
- Hidden for `completed` and `cancelled` campaigns (enforced in UI)

---

## Campaign Detail — `src/app/dashboard/campaigns/[campaignId]/page.tsx`

### What It Shows
- Full campaign information in organized sections
- Status badge with color coding
- AI-recommended influencers (fetched from `/api/recommendations/campaign/[id]`)
- List of current collaborations/applications
- Action buttons: Edit, Delete, Change Status

---

## Browse Active Campaigns (Influencer View) — `src/app/dashboard/campaigns/browse/page.tsx`

### What It Does
- Shows all `active` / `published` campaigns from all brands
- Search and filter capabilities
- "Apply" / "Express Interest" buttons
- Clicking opens campaign detail page

---

## Campaign-Influencer Recommendation
When viewing a campaign, the system recommends matching influencers using:
1. Vector embedding of campaign text (title + description + category)
2. Cosine similarity against influencer profile embeddings
3. Weighted scoring: category match, follower range, platform overlap, engagement rate
4. Results sorted by match score

See `src/lib/recommendation-engine.ts` and `/api/recommendations/campaign/[id]` for implementation.
