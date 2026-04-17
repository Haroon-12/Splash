# Platform Layout, Sidebar & Navigation

## Overview
The platform uses a consistent layout wrapper with a responsive sidebar for navigation. The sidebar changes its menu items based on the user's role (brand, influencer, admin). The layout also includes the notification bell and a help chatbot.

---

## Files Involved

| File | Purpose |
|---|---|
| `src/components/platform/platform-layout.tsx` | Layout wrapper — sidebar + main content area |
| `src/components/platform/sidebar.tsx` | Sidebar navigation — role-based menu, sign-out |
| `src/components/platform/notification-bell.tsx` | Notification dropdown (see doc 11) |
| `src/components/platform/help-chatbot.tsx` | In-app help chatbot floating button |

---

## Platform Layout — `platform-layout.tsx`

### What It Does
- Wraps all dashboard/authenticated pages
- Renders sidebar on the left, content on the right
- Includes notification bell in the top bar
- Responsive: sidebar collapses on mobile, hamburger menu toggle

### Structure
```
<PlatformLayout>
  <Sidebar />        ← left side
  <TopBar>           ← top of content area
    <NotificationBell />
  </TopBar>
  <MainContent>      ← children rendered here
    {children}
  </MainContent>
</PlatformLayout>
```

---

## Sidebar — `sidebar.tsx`

### Menu Items by Role

#### Brand Menu
| Label | Route | Icon |
|---|---|---|
| Dashboard | `/dashboard` | Home |
| Browse Influencers | `/dashboard/browse-influencers` | Search |
| Campaigns | `/dashboard/campaigns` | Megaphone |
| Collaborations | `/dashboard/collaborations` | Handshake |
| Ad Generation | `/dashboard/ad-generation` | Sparkles |
| Analytics | `/dashboard/analytics` | BarChart |
| Messages | `/dashboard/chat` | MessageSquare |
| Product Recommendations | `/dashboard/products/recommend` | Package |

#### Influencer Menu
| Label | Route | Icon |
|---|---|---|
| Dashboard | `/dashboard` | Home |
| Browse Brands | `/dashboard/browse-brands` | Building2 |
| Browse Campaigns | `/dashboard/campaigns/browse` | Megaphone |
| Collaborations | `/dashboard/collaborations` | Handshake |
| Messages | `/dashboard/chat` | MessageSquare |
| Edit Profile | `/dashboard/profile/edit` | UserCog |

#### Admin Menu
| Label | Route | Icon |
|---|---|---|
| Admin Dashboard | `/admin/dashboard` | LayoutDashboard |
| User Management | `/admin/users` | Users |
| Create Accounts | `/admin/create-accounts` | UserPlus |
| Add Admin | `/admin/add-admin` | ShieldPlus |
| Profile Claims | `/admin/claims` | FileCheck |

### Sign Out
- Sign out button at the bottom of the sidebar
- Calls `authClient.signOut()` → redirects to `/login`

### Responsive Behavior
- Desktop: fixed sidebar, always visible
- Mobile: hidden by default, toggle button in top bar
- Active route highlighted with primary color

---

## Help Chatbot — `help-chatbot.tsx`

### What It Does
- Floating action button (bottom-right corner)
- Opens a chat-style help interface
- Pre-defined FAQ responses and guidance
- Helps users navigate the platform
