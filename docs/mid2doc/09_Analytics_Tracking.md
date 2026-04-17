# Analytics Dashboard & Affiliate Link Tracking

## Overview
The analytics module allows brands to create trackable affiliate links, assign them to influencers and campaigns, and monitor click performance through charts and statistics. It uses a redirect-based tracking system.

---

## Files Involved

| File | Purpose |
|---|---|
| `src/components/platform/analytics-dashboard.tsx` | Main analytics UI component (~33KB) — charts, link management, stats |
| `src/app/dashboard/analytics/page.tsx` | Page wrapper — renders the analytics dashboard component |
| `src/app/api/affiliates/` | API for affiliate link CRUD |
| `src/app/api/track/[linkId]/route.ts` | Click tracking redirect endpoint |

### Database Tables
| Table | Purpose |
|---|---|
| `affiliateLinks` | Stores tracking links: id (shortcode), brandId, influencerId, campaignId, destinationUrl, title, isActive |
| `clickEvents` | Records every click: linkId, ipAddress, userAgent, deviceType, referrer, country, createdAt |

---

## Analytics Dashboard Component — `analytics-dashboard.tsx`

### What It Shows

#### Stats Cards (Top Row)
- **Total Clicks** — sum of all click events across all links
- **Active Links** — count of links with `isActive = true`
- **Unique Visitors** — distinct IP addresses
- **Avg Clicks/Link** — total clicks ÷ active links

#### Click Trend Chart
- **Recharts** `AreaChart` showing clicks over time
- Date range: configurable (default: last 30 days)
- Data grouped by day
- Gradient fill under the curve (primary color)

#### Tracking Links Table
- Lists all affiliate links with: title, destination URL, assigned influencer, campaign, click count, status
- Generate new link button
- Copy link button (copies tracking URL to clipboard)
- Toggle active/inactive

#### Device Breakdown
- Pie chart showing mobile vs desktop vs tablet clicks

### Link Generation
- Brand enters: title, destination URL, selects influencer (optional), selects campaign (optional)
- System generates a unique shortcode ID
- Tracking URL format: `{baseUrl}/api/track/{linkId}`
- Copy button copies the full tracking URL

---

## Click Tracking — `/api/track/[linkId]`

### How It Works
1. When someone clicks a tracking link, they hit `/api/track/[linkId]`
2. Server looks up the `affiliateLinks` record by ID
3. Records a `clickEvent` with: IP address, user agent, parsed device type, referrer, timestamp
4. **Redirects** (302) the user to the `destinationUrl`
5. The click is transparent — the end user arrives at the actual website

### Device Detection
- Parses `User-Agent` header
- Categorizes as: `mobile`, `desktop`, or `tablet`
- Stored in `clickEvents.deviceType`

### Referrer Tracking
- Captures `Referer` header (Instagram, YouTube, direct, etc.)
- Stored in `clickEvents.referrer`

---

## Data Flow
```
Brand creates link → affiliateLinks table (id = shortcode)
  → Brand shares: /api/track/{shortcode}
  → User clicks link → clickEvents recorded → 302 redirect to destination
  → Brand views analytics → charts + stats from clickEvents data
```

---

## Analytics Page Wrapper — `src/app/dashboard/analytics/page.tsx`

- Simple page that renders `<AnalyticsDashboard />` inside `<PlatformLayout>`
- The heavy logic is in the component file, not the page
