# CSV Data Management & Influencer Data Pipeline

## Overview
The platform maintains a master CSV file (`influencers.csv`) containing 100+ influencer records with social media data, follower counts, engagement metrics, and demographics. This CSV is the primary data source for the influencer directory and is merged with database records at runtime.

---

## Files Involved

| File | Purpose |
|---|---|
| `influencers.csv` | Master data file (~89KB, 100+ records) |
| `src/lib/csv-loader.ts` | Parses CSV into structured TypeScript objects |
| `src/lib/search-utils.ts` | Search and filter utilities |
| `src/app/api/csv-influencers/route.ts` | API — read/search CSV data |
| `src/app/api/csv-data/route.ts` | API — fetch specific CSV record |
| `src/app/api/influencers-with-accounts/route.ts` | API — merge CSV + DB data |

---

## CSV Structure — `influencers.csv`

### Columns
| Column | Content |
|---|---|
| Name | Full name |
| Category | Niche (Fashion, Travel, Food, etc.) |
| Instagram | Instagram handle/URL |
| YouTube | YouTube channel URL |
| Facebook | Facebook page URL |
| TikTok | TikTok handle/URL |
| Email | Contact email |
| Gender | Male/Female/Non-binary |
| Description | Bio/profile description |
| Previous Brands | Brands worked with before |
| Instagram Followers | Follower count |
| Instagram Likes | Average likes |
| Instagram Views | Average views |
| YouTube Followers | Subscriber count |
| YouTube Likes | Average likes |
| YouTube Views | Average views |
| Facebook Followers | Page followers |
| Facebook Likes | Average likes |
| Facebook Views | Average views |
| TikTok Followers | Follower count |
| TikTok Likes | Average likes |
| TikTok Views | Average views |
| Active Hours | When they post |
| Notes | Additional info |
| Image URL | Profile image |

---

## CSV Loader — `src/lib/csv-loader.ts`

### What It Does
- Uses `csv-parse` library with `sync` parser
- Reads file from project root: `path.join(process.cwd(), 'influencers.csv')`
- Maps each row to a typed object with proper field names
- Handles: empty values, whitespace trimming, missing columns
- Returns typed array: `InfluencerCSVRecord[]`

### Parser Configuration
```typescript
parse(csvContent, {
  columns: true,        // first row as headers
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true
})
```

---

## Search Utilities — `src/lib/search-utils.ts`

### Functions
1. **`searchByName(name, records)`** — fuzzy name matching (lowercase comparison, partial match)
2. **`searchByCategory(category, records)`** — exact or partial category match
3. **`filterByFollowerRange(min, max, records)`** — parses K/M suffixes, filters by total followers
4. **`filterByPlatform(platform, records)`** — checks if influencer has presence on specified platform
5. **`parseFollowerCount(str)`** — converts "150K" → 150000, "1.2M" → 1200000

---

## Data Merge API — `/api/influencers-with-accounts`

### What It Does
Creates a unified view combining CSV records with database user accounts:

1. Load all CSV records
2. Fetch all DB users where `userType = 'influencer'`
3. Fetch all `influencerProfiles` from DB
4. For each CSV record:
   - Try to match with a DB user (by email first, then name)
   - If match: merge CSV data + DB data, mark `isPlatformUser = true`
   - If no match: use CSV data only, mark `isPlatformUser = false`
5. Add DB-only users (not in CSV) to the list
6. Return combined array

### Merged Object Shape
```typescript
{
  // CSV fields
  name, category, instagram, youtube, facebook, tiktok,
  email, gender, description, previousBrands,
  followers: { instagram, youtube, facebook, tiktok },
  likes: { instagram, youtube, facebook, tiktok },
  views: { instagram, youtube, facebook, tiktok },
  activeHours, notes, imageUrl,
  
  // DB fields (if matched)
  userId, isPlatformUser, isApproved,
  platformImage, profileCompleteness,
  rateCard, availability, portfolio,
  embedding, embeddingText
}
```
