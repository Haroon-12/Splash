# Software Requirements Specification (SRS)

Project: Influencer-Brand Collaboration Platform
Date: 2025-10-13
Author: (Your Name)

## 1. Introduction

This document describes the Software Requirements Specification (SRS) for an online collaboration platform that connects influencers and brands, enabling discovery, messaging, campaigns, and ad generation.

### 1.1 Purpose

The purpose of this SRS is to capture the functional and non-functional requirements, user classes, domain model, architecture, and design for the project. This SRS will be used as a reference for development, testing, and evaluation.

### 1.2 Scope

The system will provide discovery (browse) features for influencers and brands, account management and authentication, messaging (conversations), ad generation tools for brands, campaign management, and analytics. The platform supports roles: brand, influencer, and admin.

### 1.3 System Modules

The system is decomposed into the following major modules. Each module description contains a short summary and the primary features that module provides.

#### 1.3.1 Authentication & Account Management
Responsible for user registration, login, session management, password resets, and OAuth/third-party authentication where applicable. It ensures secure onboarding and user lifecycle management.

Features:
1. Registration, login, logout, password reset flows.
2. Role assignment (brand, influencer, admin) and account approval workflows.
3. Session management and bearer token issuance for API access.

#### 1.3.2 Discovery & Directory (Browse)
Provides searchable directories for influencers and brands, supports filtering, and presents results as profile cards. The module also powers the dashboard quick-action browse card and sidebar navigation linking.

Features:
1. Search and filtering by name, category, location, platform, and audience size.
2. Profile cards with avatar, brief stats, CTA buttons (View Profile, Message).
3. Canonical browse route so dashboard and sidebar entry points lead to the same page.

#### 1.3.3 Profile & Directory Management
Manages detailed profile content for platform users and imports from external directory sources (CSV). Allows editing, media/social links, and visibility settings.

Features:
1. Full profile pages with socials, bio, past collaborations, and metrics.
2. Admin/manual approval of profiles and flagging of external entries.
3. CSV import/seed process for directory data.

#### 1.3.4 Messaging & Conversations
Manages user-to-user conversations, message storage, read/unread state, and conversation listings. Designed for low-latency UX with eventual backend consistency.

Features:
1. Conversation list with last message, timestamp, and unread badge (show only when > 0).
2. Conversation view with messages ordered oldest→newest (top→bottom) and text input for new messages.
3. Mark-as-read behavior when a conversation is opened; backend API to persist read timestamps.

#### 1.3.5 Campaigns & Ad Generation
Provides tools for brands to create campaigns, generate AI-assisted ad drafts, save drafts, and manage campaign lifecycle (draft, active, completed).

Features:
1. Create/edit campaign entities with budget, timeline, and target criteria.
2. Ad generation interface (templates + AI generation) that stores results as drafts.
3. Campaign status transitions and assignment to influencers.

#### 1.3.6 Dashboard & Analytics
Aggregates metrics and provides quick-actions for users (brands see campaign metrics; influencers see partnership opportunities). Contains cards used on the dashboard home that link to module pages.

Features:
1. Dashboard cards (Browse, Messages, Generate Ad) that link to canonical module pages.
2. Campaign and message statistics, engagement metrics, and trend charts.

#### 1.3.7 Administration
Admin tools for user management, approvals, content moderation, and system-level settings. Admins can view audit logs and manage platform-wide configurations.

Features:
1. User listing with approve/reject actions and role management.
2. Reports, audit logs, and manual overrides for campaigns or content.

#### 1.3.8 Billing & Plans
Handles plan definitions, payment status, access control to paid features (e.g., messaging, ad generation limits), and subscription lifecycle events.

Features:
1. Plan definitions and purchase flow.
2. Enforcement of feature limits based on plan (e.g., message/chat restrictions, ad generation quotas).

#### 1.3.9 Settings & Profile Management
User-facing account settings, privacy controls, and notification preferences.

Features:
1. Edit profile, change password, manage notification preferences.
2. Privacy controls (profile visibility, contact permissions).


### 1.4 User Classes and Characteristics

User class | Description
---|---
Brand | Marketing teams or brand representatives who create campaigns and contact influencers. Can browse influencers, message, generate ads, view analytics. Expect moderate concurrent usage and occasional bulk actions.
Influencer | Content creators who register profiles, respond to brand messages, and accept campaigns. Use mobile and desktop; moderate frequency of activity.
Admin | Platform administrators who manage users, approve profiles, oversee analytics and content. Fewer users but higher privilege.
Guest | Unauthenticated visitors who can view public directory pages but must register to contact or message.


## 2. Project Requirements

### 2.1 Use-case / Storyboarding
Key high-level use cases:
- UC1: Brand browses influencers and starts a conversation.
- UC2: Influencer views brand profile and replies to conversation.
- UC3: Brand generates an AI ad and stores it in campaign drafts.
- UC4: Admin reviews and approves influencer accounts.

(Use-case diagrams provided in docs/diagrams/usecase.puml)


### 2.2 Functional Requirements

#### 2.2.1 Discovery & Directory (Module 1)
FR1: The system shall allow users to search the directory by name, category, location, and social platform.
FR2: The system shall display profile cards with: avatar, name, category/industry, location, followers/metrics, primary CTA buttons (View Profile, Message).
FR3: The system shall navigate from dashboard browse card and sidebar links to the same browse pages.

#### 2.2.2 Messaging & Conversations (Module 2)
FR1: The system shall display a conversation list with last message preview and timestamp.
FR2: The system shall show unread message indicators only when unread count > 0.
FR3: When a user opens a conversation, the unread count shall be cleared (both UI and via backend API).
FR4: The conversation shall display messages in chronological order (oldest at top, newest at bottom). Messages should be scrollable and input supports sending a message.


### 2.3 Non-Functional Requirements

#### 2.3.1 Reliability
- NFR-REL-1: The messaging system should be resilient to transient network failures. Failed message sends should be retried or show a clear error.

#### 2.3.2 Usability
- NFR-USE-1: Users shall be able to retrieve previous conversations and profile details with a single click.

#### 2.3.3 Performance
- NFR-PERF-1: Browse pages should load within 2 seconds for typical result sets (<=100 items).

#### 2.3.4 Security
- NFR-SEC-1: All API endpoints that modify user data or read private conversations must require authentication.
- NFR-SEC-2: Sensitive data in transit must use TLS.


### 2.4 Domain Model

(See docs/diagrams/class.puml for class-level domain model)

Entities: User, Profile (influencer/brand directory entry), Conversation, Message, Campaign, AdDraft


## 3. System Overview

### 3.1 Architectural Design

The platform follows a client-server architecture with Next.js front-end, API routes for backend operations, and a relational database (drizzle ORM present in the repo). The platform layout contains a shared sidebar and platform-specific pages. Authentication uses bearer tokens/session.

(Component diagram: docs/diagrams/component.puml)


### 3.2 Design Models

Provided diagrams (PlantUML): use-case, class, sequence for starting conversation and sending a message.


### 3.3 Data Design

Major tables:
- users (id, name, email, userType, image, createdAt, isApproved)
- profiles/directory (id, name, category, socials, location, followers, isPlatformUser, platformUserId)
- conversations (id, participant1Id, participant2Id, lastMessageAt)
- messages (id, conversationId, senderId, content, createdAt, deliveredAt, readAt)
- campaigns, ad_drafts


## 4. Diagrams

Diagrams are included in `docs/diagrams/` as PlantUML `.puml` files. Render them using PlantUML or VS Code PlantUML extension.


## 5. Appendix

 References: Project proposal document (attached). 

 How to render diagrams locally (Windows PowerShell):

  1. Install Graphviz (https://graphviz.org/download/) and PlantUML (https://plantuml.com/starting). Make sure both are on your PATH.

  2. From the workspace root, run this PowerShell command to render PNGs for each diagram:

```powershell
Get-ChildItem -Path .\docs\diagrams\*.puml | ForEach-Object { plantuml -tpng $_.FullName }
```

  3. PNG files will be written next to each `.puml` (for example `docs/diagrams/usecase.png`).

 Convert SRS Markdown to PDF (using Pandoc + LaTeX) after rendering diagrams so images are available:

```powershell
# render diagrams first


```

 Alternative (VS Code):
  - Use the PlantUML extension to preview and export individual diagrams.
  - Use a Markdown PDF extension to export `docs/SRS.md` directly to PDF (ensure images are rendered or embedded).

 Checklist before final delivery:
  1. Render all `.puml` files to PNG.
  2. Verify images are in `docs/diagrams/` and open correctly.
  3. Convert `docs/SRS.md` to `docs/SRS.pdf` using Pandoc or VS Code export.


---
Generated on 2025-10-13
---
Generated on 2025-10-13
