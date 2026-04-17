# Profile Claim System

## Overview
When influencers register, the system checks if their name/email matches any record in the master CSV (`influencers.csv`). If a match is found, the influencer can "claim" that profile, which goes through an admin review process before the account is created.

---

## Files Involved

### Frontend
| File | Route | Purpose |
|---|---|---|
| `src/app/register/page.tsx` | `/register` | Step 3 — claim form (if CSV match found) |
| `src/app/claim-status/page.tsx` | `/claim-status?claimId=xxx` | Public claim status page |
| `src/app/dashboard/claim-status/page.tsx` | `/dashboard/claim-status` | Authenticated claim status view |
| `src/app/admin/claims/page.tsx` | `/admin/claims` | Admin claim review page |

### Backend API
| File | Endpoint | Purpose |
|---|---|---|
| `src/app/api/csv-influencers/route.ts` | `/api/csv-influencers` | POST — check for CSV matches by name/email |
| `src/app/api/profile-claims/route.ts` | `/api/profile-claims` | POST — submit claim, GET — list claims |
| `src/app/api/claim-status/[claimId]/route.ts` | `/api/claim-status/[id]` | GET — public status check (no auth needed) |
| `src/app/api/admin/profile-claims/route.ts` | `/api/admin/profile-claims` | GET — list all claims, PATCH — approve/reject |
| `src/app/api/create-approved-account/route.ts` | `/api/create-approved-account` | POST — create account after admin approval |

### Data Store
| File | Purpose |
|---|---|
| `src/lib/file-claims-store.ts` | File-based JSON store for claims (`claims-store.json`) |
| `claims-store.json` | Persistent claim data storage |

---

## Complete Flow

### 1. Registration — CSV Match Check
```
User fills registration form → clicks "Create Account"
  → POST /api/csv-influencers with { email, name }
  → Server loads influencers.csv, searches for matches
  → Match found? → Show claim form (Step 3)
  → No match? → Create account directly
```

### 2. Claim Submission
```
User selects matching profile → fills claim reason → uploads proof images + ID (optional)
  → Files uploaded via POST /api/upload
  → Claim submitted: POST /api/profile-claims with:
    - registrationData: { name, email, password, userType }
    - csvRecordId, claimReason, proofImages, idDocument
  → Account is NOT created yet
  → User redirected to /claim-status?claimId=xxx
```

### 3. Admin Review
```
Admin opens /admin/claims → sees pending claims list
  → Each claim shows: user info, CSV profile matched, claim reason, proof images, ID
  → Admin clicks "Approve" or "Reject" (with rejection reason)
  → PATCH /api/admin/profile-claims with { claimId, action, rejectionReason? }
```

### 4. Account Creation (on Approval)
```
Admin approves → server parses registrationData from claim
  → POST /api/create-approved-account with registration data
  → Account created via better-auth signUp API
  → User's isApproved set to true
  → Claim status updated to "approved" with admin's name as reviewer
```

---

## Claim Status Page — `src/app/claim-status/page.tsx`

### What It Shows
- Status icon (✅ approved, ❌ rejected, ⏳ pending)
- Status badge with color coding
- Status message explaining what to do next
- **Claim Details:** Profile name (from registration data, not csvRecordId), email, submitted date, claim reason
- **Review Details** (if reviewed): Reviewer name (actual admin name, not "admin-user-id"), review date, rejection reason
- **Action Buttons:** Check Status (refresh), Login to Dashboard (if approved), Back to Registration

### Key Fixes Applied
- Profile field shows `userName` (from parsed registrationData) instead of raw `csvRecordId`
- Email displayed from registrationData
- Reviewer shows actual admin session name (from `auth.api.getSession()` at review time)

---

## File Claims Store — `src/lib/file-claims-store.ts`

### Why File-Based?
- Claims must persist even before the user has an account in the database
- The claim contains registration data (including password) that will be used to create the account later
- JSON file store avoids database dependency for pre-registration claims

### ClaimData Interface
```typescript
{
  id: string;           // timestamp ID
  userId: string;       // empty before account creation
  csvRecordId: string;  // matched CSV record identifier
  claimReason: string;
  proofImages?: ImageData[];
  idDocument?: ImageData;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;  // admin's name
  reviewedAt?: Date;
  rejectionReason?: string;
  registrationData?: string;  // JSON string with name, email, password, userType
  createdAt: Date;
  updatedAt: Date;
}
```

### Methods
- `createClaim()` — adds claim to JSON file
- `getClaimById()` — fetches by ID (reloads file first)
- `getAllClaims()` — returns all claims
- `updateClaimStatus()` — updates status, reviewer, rejection reason
- `getClaimsByUserId()` — filter by user ID

---

## Admin Claims Page — `src/app/admin/claims/page.tsx`

### What It Shows
- List of all profile claims with status tabs (All, Pending, Approved, Rejected)
- Each claim card shows: user name, email, CSV profile matched, claim reason, submission date
- Proof images and ID document previews
- "Approve" and "Reject" buttons (with rejection reason input for rejections)
- Real admin name stored as reviewer (from session)
