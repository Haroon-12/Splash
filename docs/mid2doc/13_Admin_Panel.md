# Admin Panel

## Overview
The admin panel provides platform management capabilities: user management, account creation, profile claim reviews, and platform statistics. Only users with `userType = 'admin'` can access these pages (enforced by middleware).

---

## Files Involved

### Frontend Pages
| File | Route | Purpose |
|---|---|---|
| `src/app/admin/dashboard/page.tsx` | `/admin/dashboard` | Admin dashboard — platform overview stats |
| `src/app/admin/users/page.tsx` | `/admin/users` | User listing — view/approve/suspend all users |
| `src/app/admin/user-management/page.tsx` | `/admin/user-management` | Advanced user administration |
| `src/app/admin/create-accounts/page.tsx` | `/admin/create-accounts` | Create new brand/influencer accounts |
| `src/app/admin/add-admin/page.tsx` | `/admin/add-admin` | Create new admin accounts |
| `src/app/admin/claims/page.tsx` | `/admin/claims` | Review profile claims (see doc 12) |

### Backend API
| File | Endpoint | Purpose |
|---|---|---|
| `src/app/api/admin/create/` | `/api/admin/create` | POST — create accounts |
| `src/app/api/admin/created-accounts/` | `/api/admin/created-accounts` | GET — list admin-created accounts |
| `src/app/api/admin/delete-account/` | `/api/admin/delete-account` | DELETE — remove user account |
| `src/app/api/admin/users/` | `/api/admin/users` | GET — admin user listing |
| `src/app/api/admin/profile-claims/route.ts` | `/api/admin/profile-claims` | GET, PATCH — claims management |
| `src/app/api/users/[id]/approve/route.ts` | `/api/users/[id]/approve` | PUT — approve user account |

### Database Table
| Table | Purpose |
|---|---|
| `adminAccounts` | Tracks admin privileges: createdBy, permissions, isSuperAdmin |

---

## Admin Dashboard — `/admin/dashboard`

### What It Shows
- **Total Users** count (all types)
- **Brands** count (approved)
- **Influencers** count (approved)
- **Pending Approvals** count
- **Recent signups** list
- **Pending claims** summary
- Navigation cards to other admin pages

---

## User Management — `/admin/users`

### What It Does
- Table listing all platform users
- Columns: name, email, type, status, join date, actions
- **Actions per user:**
  - Approve (sets `isApproved = true`)
  - Suspend/unsuspend
  - Delete account
- Search and filter by user type
- Pagination for large user lists

---

## Create Accounts — `/admin/create-accounts`

### What It Does
- Admin creates accounts on behalf of brands/influencers
- Form: name, email, password, user type (brand/influencer)
- Account created with `isApproved = true` automatically

### Form Validation (recently added)
- **Name:** Cannot be empty, cannot contain numbers, cannot contain special characters (allows hyphens, spaces, apostrophes)
- **Email:** Required, must match standard email format
- **Password:** Minimum 8 characters

### Technical Details
- Uses `/api/admin/create` POST endpoint
- Admin's session used for `createdBy` tracking
- Created accounts tracked in `adminAccounts` table

---

## Add Admin — `/admin/add-admin`

### What It Does
- Creates new admin user accounts
- Same form as create accounts but always sets `userType = 'admin'`
- Records in `adminAccounts` table with `createdBy` and `isSuperAdmin` flag

---

## Route Protection

### Middleware (`middleware.ts`)
```
if (path starts with "/admin") {
  if (session.user.userType !== "admin") {
    redirect to /dashboard
  }
}
```
- All `/admin/*` routes protected at the middleware level
- Non-admin users get silently redirected — no error page shown
