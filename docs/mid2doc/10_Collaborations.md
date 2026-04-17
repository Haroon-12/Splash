# Collaborations System

## Overview
Collaborations represent the working relationship between a brand and an influencer, optionally tied to a campaign or product. Brands can invite influencers, and influencers can accept or reject invitations.

---

## Files Involved

| File | Purpose |
|---|---|
| `src/app/dashboard/collaborations/page.tsx` | Collaborations management page |
| `src/app/api/collaborations/route.ts` | GET, POST, PATCH — CRUD operations |

### Database Table — `collaborations`
| Field | Purpose |
|---|---|
| id | Auto-increment primary key |
| brandId | FK → user.id (brand who initiated) |
| influencerId | FK → user.id (invited influencer) |
| campaignId | FK → campaigns.id (optional) |
| productId | FK → products.id (optional) |
| status | `pending`, `active`, `completed`, `cancelled` |
| rating | 1-5 from brand |
| influencerRating | 1-5 from influencer |
| performanceMetrics | JSON — engagement, reach, etc. |
| notes | Free text |
| startedAt, completedAt, createdAt, updatedAt | Timestamps |

---

## Collaborations Page — `src/app/dashboard/collaborations/page.tsx`

### For Brands
- Lists all collaborations they've initiated
- Shows status, influencer name, campaign name
- Can update status (activate, complete, cancel)

### For Influencers
- Lists all collaboration invitations received
- Can accept (status → `active`) or reject (status → `cancelled`)
- Shows brand name, campaign details

---

## API — `/api/collaborations`

### GET — List Collaborations
- Fetches collaborations filtered by user ID and role
- Brands see collaborations where `brandId = currentUser.id`
- Influencers see collaborations where `influencerId = currentUser.id`
- Joins with user table to get names

### POST — Create Collaboration (Invite)
- Brand sends: `{ influencerId, campaignId?, productId? }`
- Creates record with `status = 'pending'`
- Notification sent to the influencer

### PATCH — Update Status
- Accepts: `{ collaborationId, status, rating?, notes? }`
- Status transitions: `pending → active → completed` or `pending → cancelled`
- Both brand and influencer can update (different transitions allowed)
