# Database Schema & ORM Configuration

## Overview
The project uses **SQLite** as the database (file: `local.db`), **Drizzle ORM** for type-safe queries, and **better-sqlite3** as the driver. The schema defines 14 tables covering users, messaging, campaigns, products, collaborations, analytics, and notifications.

---

## Files Involved

| File | Purpose |
|---|---|
| `src/db/index.ts` | Creates Drizzle ORM instance |
| `src/db/schema.ts` | All table definitions (346 lines) |
| `drizzle.config.ts` | Drizzle Kit config for migrations |
| `local.db` | SQLite database file |
| `drizzle/` | Migration files directory |

---

## ORM Setup — `src/db/index.ts`

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('local.db');
export const db = drizzle(sqlite);
```

- Uses `better-sqlite3` for synchronous SQLite access (fast, no network)
- Single `db` instance exported and used across all API routes
- Database file stored at project root: `local.db`

---

## Schema — `src/db/schema.ts`

### All Tables (14 total)

#### 1. `user` — Core user table
- `id` (text, PK), `name`, `email` (unique), `emailVerified` (boolean)
- `image` (avatar URL), `userType` ("admin"|"brand"|"influencer")
- `isApproved` (boolean), `approvedBy` (FK → user), `approvedAt`
- `createdAt`, `updatedAt`

#### 2. `session` — Auth sessions
- `id` (PK), `expiresAt`, `token` (unique), `userId` (FK → user, cascade)
- `ipAddress`, `userAgent`

#### 3. `account` — Auth credentials
- `id` (PK), `accountId`, `providerId`, `userId` (FK → user, cascade)
- `accessToken`, `refreshToken`, `password` (hashed)

#### 4. `verification` — OTP/email tokens
- `id` (PK), `identifier`, `value`, `expiresAt`

#### 5. `conversations` — Chat threads
- `id` (auto-increment), `participant1Id`, `participant2Id` (both FK → user)
- `lastMessageAt`, `createdAt`

#### 6. `messages` — Chat messages
- `id` (auto-increment), `conversationId` (FK → conversations)
- `senderId` (FK → user), `content` (encrypted text)
- `attachmentType`, `attachmentUrl`, `attachmentName`, `attachmentSize`
- `isRead`, `readAt`, `createdAt`

#### 7. `influencerProfiles` — Extended influencer data
- `id` (PK, FK → user), `category`, social URLs (instagram/youtube/facebook/tiktok)
- Followers/likes/views per platform (6 fields × 4 platforms = 24 metric fields)
- `description`, `previousBrands`, `gender`, `activeHours`
- JSON fields: `images`, `portfolioSamples`, `rateCard`, `availability`, `preferredBrands`, `contentPreferences`, `geographicReach`, `verificationBadges`
- `embedding` (384-dim vector as JSON), `embeddingText`
- `profileCompleteness` (0-100)

#### 8. `profileClaims` — Claim requests
- `id` (auto-increment), `userId` (FK → user), `csvRecordId`
- `claimReason`, `proofImages` (JSON), `idDocument`
- `status` ("pending"|"approved"|"rejected")
- `reviewedBy` (FK → user), `reviewedAt`, `rejectionReason`

#### 9. `notifications` — All notifications
- `id` (auto-increment), `userId` (FK → user)
- `type`, `title`, `message`, `isRead`, `isSmartAlert`
- `readAt`, `actionUrl`, `metadata` (JSON)

#### 10. `profileUpdateReminders` — Reminder tracking
- `id`, `userId`, `lastReminderSent`, `reminderCount`, `isActive`

#### 11. `adminAccounts` — Admin tracking
- `id` (PK, FK → user), `createdBy` (FK → user)
- `permissions` (JSON), `isSuperAdmin`

#### 12. `brandProfiles` — Extended brand data
- `id` (PK, FK → user), `companyName`, `industry` (JSON)
- `description`, `website`, `logo`
- `targetAudience` (JSON), `preferredCategories` (JSON)
- `budgetRange` (JSON), `geographicFocus` (JSON)

#### 13. `campaigns` — Marketing campaigns
- `id` (auto-increment), `brandId` (FK → user)
- `title`, `description`, `objectives` (JSON), `category`
- `targetAudience` (JSON), `budget`, `budgetRange` (JSON)
- `startDate`, `endDate`, `status`
- `requiredPlatforms` (JSON), `contentRequirements` (JSON)
- `geographicTarget` (JSON), `minFollowers`, `maxFollowers`
- `embedding`, `embeddingText`

#### 14. `products` — Brand products
- `id` (auto-increment), `brandId` (FK → user)
- `name`, `description`, `category`
- `targetAudience` (JSON), `priceRange` (JSON)
- `features` (JSON), `useCases` (JSON), `brandValues` (JSON)
- `imageUrl`, `website`, `embedding`, `embeddingText`

#### 15. `collaborations` — Brand-influencer work
- `id` (auto-increment), `brandId`, `influencerId` (both FK → user)
- `campaignId` (FK → campaigns), `productId` (FK → products)
- `status`, `rating`, `influencerRating`
- `performanceMetrics` (JSON), `notes`
- `startedAt`, `completedAt`

#### 16. `affiliateLinks` — Tracking links
- `id` (text PK — shortcode), `brandId` (FK → user)
- `influencerId` (FK → user, optional), `campaignId` (FK → campaigns, optional)
- `destinationUrl`, `title`, `isActive`

#### 17. `clickEvents` — Click tracking
- `id` (auto-increment), `linkId` (FK → affiliateLinks)
- `ipAddress`, `userAgent`, `deviceType`, `referrer`, `country`

---

## Drizzle Config — `drizzle.config.ts`

```typescript
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite3',
  dbCredentials: { url: 'local.db' }
}
```

### Migration Commands
- `npx drizzle-kit generate` — generate SQL migrations from schema changes
- `npx drizzle-kit push` — push schema directly to DB (dev mode)
- `npx drizzle-kit studio` — open Drizzle Studio UI for DB browsing
