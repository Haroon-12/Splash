# Notification System & Smart Alerts

## Overview
The platform has a dual notification system: **standard notifications** (triggered by user actions like messages, claim approvals) and **AI-powered Smart Alerts** (proactively generated suggestions based on platform activity).

---

## Files Involved

| File | Purpose |
|---|---|
| `src/components/platform/notification-bell.tsx` | Notification dropdown UI — bell icon, tabs, list |
| `src/app/api/notifications/route.ts` | GET, PATCH, DELETE — notification CRUD |
| `src/app/api/notifications/generate-smart-alerts/route.ts` | POST — AI smart alert generation |
| `src/app/api/profile-update-notification/route.ts` | POST, GET — profile update reminders |

### Database Tables
| Table | Purpose |
|---|---|
| `notifications` | id, userId, type, title, message, isRead, isSmartAlert, actionUrl, metadata, createdAt |
| `profileUpdateReminders` | id, userId, lastReminderSent, reminderCount, isActive |

---

## Notification Bell Component — `notification-bell.tsx`

### UI Layout
- **Bell icon** in the header with unread count badge (hidden when 0, shows "9+" for 10+)
- Click opens a **dropdown panel** (fixed position, 90vw on mobile, 384px on desktop)
- **3 tabs:** All | Notifications | 🌟 Smart Alerts
- Each notification shows: icon, title, message text, date
- Unread notifications have a blue dot indicator and subtle background highlight
- Smart alerts have an orange tint background

### Tab Filtering
- **All:** Shows everything
- **Notifications:** `isSmartAlert = false` only
- **Smart Alerts:** `isSmartAlert = true` only (orange-themed tab button)

### Interaction
- Click a notification → marks as read + navigates to `actionUrl` (if any)
- "Mark all read" button (visible when unread count > 0)
- Close button (X) to dismiss dropdown

### Notification Types & Icons
| Type | Icon | Color |
|---|---|---|
| `claim_approved` | ✅ | green |
| `claim_rejected` | ❌ | red |
| `profile_update_reminder` | 📝 | blue |
| `new_message` | 💬 | purple |
| `new_profile_claim` | 🔔 | gray |
| `campaign_match` | 🔔 | orange |
| `conversation_follow_up` | 🔔 | amber |
| `profile_optimization` | 📝 | blue |

### Polling
- Generates smart alerts on component mount (POST `/api/notifications/generate-smart-alerts`)
- Fetches notifications initially, then every 30 seconds via `setInterval`

---

## Notifications API — `/api/notifications`

### GET — Fetch Notifications
- Query params: `limit` (default 20)
- Returns notifications for the authenticated user, sorted by `createdAt` DESC
- Response: `{ notifications: [...] }`

### PATCH — Mark as Read
- Body: `{ notificationId }` → marks single notification read
- Body: `{ markAllAsRead: true }` → marks all user's notifications read
- Updates `isRead = true` and `readAt = now()`

### DELETE — Delete Notification
- Query param: `id`
- Deletes single notification by ID

---

## Smart Alerts — `/api/notifications/generate-smart-alerts`

### What It Does
AI-generated proactive notifications based on user activity analysis:
- **Profile optimization tips** — suggests missing profile fields
- **Campaign match alerts** — new campaigns matching influencer profile
- **Conversation follow-ups** — reminds about unanswered messages
- **Engagement suggestions** — tips to improve platform engagement

### Technical Details
- POST endpoint, called on notification bell mount
- Analyzes user's profile completeness, recent activity, campaign matches
- Creates notifications with `isSmartAlert = true`
- Rate-limited: doesn't generate duplicates within a time window

---

## Profile Update Reminders — `/api/profile-update-notification`

### POST — Generate Reminder
- Checks if influencer's profile was updated recently
- If not, creates a reminder notification
- Tracks reminder count and last sent time in `profileUpdateReminders` table

### GET — Check Reminder Status
- Returns current reminder state for the user
