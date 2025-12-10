# Complete Project Documentation - Splash Platform

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Project Flow](#4-project-flow)
5. [File-by-File Documentation](#5-file-by-file-documentation)
6. [Key Algorithms Explained](#6-key-algorithms-explained)
7. [Database Schema](#7-database-schema)
8. [API Endpoints](#8-api-endpoints)
9. [Authentication Flow](#9-authentication-flow)
10. [Encryption Implementation](#10-encryption-implementation)

---

## 1. Project Overview

**Splash** is an AI-powered influencer-brand collaboration platform that connects brands with influencers for marketing campaigns. The platform provides:

- **User Management**: Registration, authentication, and role-based access (Brand, Influencer, Admin)
- **Discovery System**: Browse and search influencers/brands with advanced filtering
- **Recommendation Engine**: AI-powered matching based on category, engagement, audience alignment
- **Messaging System**: End-to-end encrypted real-time messaging with file attachments
- **Profile Claims**: Influencers can claim their profiles from CSV data with verification
- **Admin Panel**: User management, claim reviews, and platform statistics
- **Analytics Dashboard**: Role-specific statistics and insights

---

## 2. Technology Stack

### Frontend
- **Next.js 15.3.5**: React framework with App Router
- **React 19.0.0**: UI library
- **TypeScript 5.x**: Type-safe JavaScript
- **Tailwind CSS 4.x**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible components
- **Framer Motion**: Animation library

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Better Auth 1.3.10**: Authentication library
- **Drizzle ORM 0.44.5**: TypeScript ORM
- **SQLite (better-sqlite3)**: Embedded database

### Security & Encryption
- **Node.js Crypto**: Server-side encryption
- **Web Crypto API**: Client-side encryption
- **AES-256-GCM**: Encryption algorithm
- **PBKDF2**: Key derivation

### Other Libraries
- **csv-parse**: CSV file parsing
- **bcrypt**: Password hashing
- **date-fns**: Date manipulation
- **Recharts**: Data visualization

---

## 2.1 Project Architecture

### Architecture Type: **Full-Stack Monolithic with Client-Server Pattern**

**Detailed Architecture Classification**:

1. **Primary Pattern: Client-Server Architecture**
   - **Client**: Next.js frontend (React components, browser)
   - **Server**: Next.js API Routes (Node.js backend)
   - **Communication**: HTTP/REST API
   - **Separation**: Clear separation between client and server logic

2. **Application Architecture: Monolithic**
   - **Single Codebase**: Frontend and backend in one Next.js application
   - **Single Deployment**: One application handles both UI and API
   - **Shared Code**: TypeScript types, utilities shared between client/server
   - **Not Microservices**: All features in one application (not split into separate services)

3. **Framework Pattern: Next.js App Router (File-Based Routing)**
   - **Pages**: File-based routing (`app/page.tsx` = `/`, `app/login/page.tsx` = `/login`)
   - **API Routes**: File-based API (`app/api/messages/route.ts` = `/api/messages`)
   - **Server Components**: React Server Components for server-side rendering
   - **Client Components**: React Client Components for interactivity

4. **Data Architecture: Three-Tier Architecture**
   ```
   Presentation Layer (Frontend)
        ↓
   Application Layer (API Routes)
        ↓
   Data Layer (Database)
   ```
   - **Presentation**: React components, UI
   - **Application**: Business logic, API endpoints
   - **Data**: SQLite database, file storage

5. **Design Pattern: MVC-like (Model-View-Controller)**
   - **Model**: Database schema (`src/db/schema.ts`), Drizzle ORM
   - **View**: React components (`src/components/`, `src/app/*/page.tsx`)
   - **Controller**: API routes (`src/app/api/**/route.ts`)

6. **State Management: Component-Level State + Server State**
   - **Client State**: React hooks (`useState`, `useEffect`)
   - **Server State**: API calls, database queries
   - **No Global State Management**: No Redux/Zustand (uses React Context for auth)

**Why This Architecture?**

1. **Next.js Full-Stack Framework**:
   - Combines frontend and backend in one framework
   - Reduces complexity (no separate frontend/backend projects)
   - Shared TypeScript types between client and server
   - Server-side rendering for better SEO and performance

2. **Monolithic Approach**:
   - Simpler for development and deployment
   - Easier to maintain (one codebase)
   - Good for MVP and small-to-medium applications
   - Can be split into microservices later if needed

3. **Client-Server Separation**:
   - Clear API boundaries
   - Client handles UI and encryption
   - Server handles business logic and database
   - Secure (sensitive operations on server)

4. **File-Based Routing**:
   - Intuitive (file structure = URL structure)
   - Easy to navigate codebase
   - Next.js handles routing automatically

**Architecture Diagram**:
```
┌─────────────────────────────────────────┐
│         Client (Browser)                 │
│  ┌───────────────────────────────────┐   │
│  │  React Components (UI)            │   │
│  │  - Pages (page.tsx)               │   │
│  │  - Components (components/)       │   │
│  │  - Client-side Encryption         │   │
│  └───────────────────────────────────┘   │
└──────────────┬────────────────────────────┘
               │ HTTP Requests (REST API)
               │ JSON Data
               ↓
┌─────────────────────────────────────────┐
│      Server (Next.js API Routes)        │
│  ┌───────────────────────────────────┐   │
│  │  API Endpoints (app/api/)         │   │
│  │  - Authentication                 │   │
│  │  - Business Logic                 │   │
│  │  - Server-side Encryption         │   │
│  │  - Validation                     │   │
│  └───────────────────────────────────┘   │
└──────────────┬────────────────────────────┘
               │ Database Queries
               │ (Drizzle ORM)
               ↓
┌─────────────────────────────────────────┐
│         Data Layer                      │
│  ┌───────────────────────────────────┐   │
│  │  SQLite Database (local.db)        │   │
│  │  - User data                      │   │
│  │  - Messages (encrypted)           │   │
│  │  - Conversations                  │   │
│  │  - Profiles                       │   │
│  └───────────────────────────────────┘   │
│  ┌───────────────────────────────────┐   │
│  │  File Storage (public/uploads)    │   │
│  │  - Encrypted files (.enc)         │   │
│  │  - Profile images                 │   │
│  └───────────────────────────────────┘   │
│  ┌───────────────────────────────────┐   │
│  │  JSON Store (claims-store.json)   │   │
│  │  - Profile claims                 │   │
│  └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Demo Answer for Architecture Question**:

"This project uses a **Full-Stack Monolithic Architecture with Client-Server Pattern**, built on Next.js 15. 

The architecture consists of three main layers:

1. **Presentation Layer (Client)**: React components running in the browser, handling UI rendering and client-side encryption using Web Crypto API.

2. **Application Layer (Server)**: Next.js API Routes that handle business logic, authentication, server-side encryption, and data validation.

3. **Data Layer**: SQLite database for structured data, file system for file storage, and JSON file for profile claims.

The architecture is monolithic because frontend and backend are in a single Next.js application, which simplifies development and deployment. However, it follows client-server separation with clear API boundaries, making it secure and maintainable. The file-based routing system makes the codebase intuitive and easy to navigate.

This architecture is suitable for our platform because:
- It's efficient for our scale (not too large to require microservices)
- Next.js provides excellent developer experience
- Server-side rendering improves performance
- Single deployment simplifies operations
- Can be migrated to microservices architecture later if needed"

---

## 3. Project Structure

```
FYP_IT_1/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/               # API endpoints
│   │   ├── admin/             # Admin pages
│   │   ├── dashboard/         # User dashboard pages
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── messages/          # Messaging page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── platform/          # Platform-specific components
│   │   └── ui/                # shadcn/ui components
│   ├── db/                    # Database files
│   │   ├── schema.ts          # Database schema
│   │   ├── index.ts           # Database connection
│   │   └── seeds/             # Database seed files
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts            # Authentication config
│   │   ├── encryption.ts      # Server-side encryption
│   │   ├── encryption-client.ts # Client-side encryption
│   │   ├── recommendation-engine.ts # Recommendation algorithm
│   │   ├── search-utils.ts    # Search utilities
│   │   └── file-claims-store.ts # Claims storage
│   └── hooks/                 # React hooks
├── public/                    # Static files
│   └── uploads/              # Uploaded files
├── drizzle/                  # Database migrations
├── scripts/                  # Utility scripts
├── influencers.csv           # CSV data file
├── local.db                  # SQLite database
├── package.json              # Dependencies
├── next.config.ts            # Next.js config
├── middleware.ts             # Route middleware
└── tsconfig.json             # TypeScript config
```

---

## 4. Project Flow

### 4.1 User Registration Flow

1. **User visits `/register`**
2. **Selects user type** (Brand/Influencer)
3. **Fills registration form** (name, email, password)
4. **If Influencer**: System checks CSV for matching records
5. **If match found**: User can claim profile or continue registration
6. **Account created** in database with `isApproved=false`
7. **Redirect to login** or claim status page

### 4.2 User Login Flow

1. **User visits `/login`**
2. **Enters credentials** (email, password)
3. **Better Auth authenticates** user
4. **Session created** and stored in database
5. **Session cookie set** (HTTP-only, 7 days expiry)
6. **Check `isApproved` status**
7. **If approved**: Redirect to dashboard
8. **If not approved**: Show pending approval message

### 4.3 Profile Claim Flow

1. **Influencer finds CSV match** during registration
2. **User submits claim** with proof documents
3. **Claim stored** in file-based store (`claims-store.json`)
4. **Admin reviews claim** in admin panel
5. **Admin approves/rejects** with reason
6. **If approved**: Account created from registration data
7. **User notified** and can login

### 4.4 Messaging Flow

1. **User A clicks "Message"** on User B's profile
2. **System checks** for existing conversation
3. **If exists**: Open existing conversation
4. **If not**: Create new conversation
5. **User A types message**
6. **Message encrypted** on client-side
7. **Encrypted message sent** to API
8. **Message stored** in database (encrypted)
9. **User B receives** message
10. **Message decrypted** on client-side
11. **Message displayed** in chat

### 4.5 Recommendation Flow

1. **Brand navigates** to Browse Influencers
2. **Brand applies filters** (category, followers, platforms)
3. **System fetches** all influencers (database + CSV)
4. **Recommendation engine** calculates match scores
5. **Scores based on**: Category (30%), Audience (25%), Engagement (20%), etc.
6. **Results sorted** by match score
7. **Top N influencers** returned and displayed

---

## 5. File-by-File Documentation

### 5.1 Root Configuration Files

#### `package.json`

**Purpose**: Defines project dependencies, scripts, and metadata.

**Key Sections**:
- **scripts**: Development, build, and utility commands
- **dependencies**: Production dependencies
- **devDependencies**: Development-only dependencies

**Important Scripts**:
- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build production bundle
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

#### `next.config.ts`

**Purpose**: Next.js configuration file.

**Line-by-Line Explanation**:

```typescript
import type { NextConfig } from "next";
```
- Imports Next.js configuration type for TypeScript type checking

```typescript
const nextConfig: NextConfig = {
```
- Creates configuration object with proper typing

```typescript
  images: {
    dangerouslyAllowSVG: true,
```
- Allows SVG images (needed for some icons/logos)

```typescript
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
```
- Allows images from any remote URL (both HTTP and HTTPS)
- `**` is a wildcard matching any hostname
- This is needed for profile images and uploaded content

```typescript
};
```
- Closes configuration object

**Why This Config**:
- Allows loading images from external sources
- Needed for social media profile images and uploaded files

#### `middleware.ts`

**Purpose**: Next.js middleware for route protection and authentication checks.

**Line-by-Line Explanation**:

```typescript
import { NextRequest, NextResponse } from "next/server";
```
- Imports Next.js request/response types for middleware

```typescript
import { headers } from "next/headers";
```
- Imports headers function to access request headers

```typescript
import { auth } from "@/lib/auth";
```
- Imports authentication instance from Better Auth

```typescript
export async function middleware(request: NextRequest) {
```
- Exports middleware function that runs on every matched route
- `request`: The incoming HTTP request object

```typescript
	const session = await auth.api.getSession({
		headers: await headers()
	})
```
- Gets current user session from Better Auth
- `auth.api.getSession()`: Better Auth method to get session
- `headers()`: Gets request headers (cookies, etc.)

```typescript
	if(!session) {
		return NextResponse.redirect(new URL("/login", request.url));
	}
```
- If no session exists (user not logged in)
- Redirect to login page
- `NextResponse.redirect()`: Creates redirect response

```typescript
	// Check if accessing admin routes
	if (request.nextUrl.pathname.startsWith("/admin")) {
```
- Checks if user is trying to access admin routes
- `pathname`: The URL path (e.g., "/admin/dashboard")

```typescript
		// @ts-ignore - userType exists on session.user
		if (session.user?.userType !== "admin") {
```
- Checks if user is admin
- `@ts-ignore`: Suppresses TypeScript error (userType not in default type)
- `?.`: Optional chaining (safe if user is null)
- If not admin, redirect to dashboard

```typescript
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}
	}
```
- Redirects non-admin users away from admin routes

```typescript
	return NextResponse.next();
```
- If all checks pass, allow request to continue
- `NextResponse.next()`: Proceeds to the route handler

```typescript
export const config = {
  runtime: "nodejs",
```
- Configures middleware to run on Node.js runtime (not Edge)

```typescript
  matcher: ["/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*", "/profile", "/analytics", "/campaigns"],
```
- Defines which routes this middleware applies to
- `:path*`: Matches any sub-path (e.g., "/dashboard/chat", "/admin/users")

**Purpose**: 
- Protects routes requiring authentication
- Enforces admin-only access to admin routes
- Runs before page/API route handlers

---

### 5.2 Database Files

#### `src/db/index.ts`

**Purpose**: Database connection and initialization.

**Line-by-Line Explanation**:

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
```
- Imports Drizzle ORM function for SQLite
- `drizzle-orm/better-sqlite3`: Adapter for better-sqlite3 driver

```typescript
import Database from 'better-sqlite3';
```
- Imports SQLite database class
- `better-sqlite3`: Fast, synchronous SQLite driver for Node.js

```typescript
import * as schema from '@/db/schema';
```
- Imports all schema definitions
- `* as schema`: Imports everything as `schema` object
- Used for type inference and query building

```typescript
// Use local SQLite database for development
const sqlite = new Database('local.db');
```
- Creates SQLite database connection
- `'local.db'`: Database file name (in project root)
- If file doesn't exist, SQLite creates it
- Synchronous connection (blocking)

```typescript
export const db = drizzle(sqlite, { schema });
```
- Creates Drizzle ORM instance
- `sqlite`: The database connection
- `{ schema }`: Schema object for type inference
- Exports `db` for use throughout the application

```typescript
export type Database = typeof db;
```
- Exports TypeScript type of the database instance
- Useful for type annotations in other files

**Purpose**: 
- Centralized database connection
- Provides typed database access via Drizzle ORM
- Single connection instance (singleton pattern)

---

#### `src/db/schema.ts` (Partial - Key Tables)

**Purpose**: Defines database schema using Drizzle ORM.

**Line-by-Line Explanation**:

```typescript
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
```
- Imports Drizzle ORM functions for SQLite
- `sqliteTable`: Creates a table definition
- `integer`, `text`: Column type definitions

```typescript
export const user = sqliteTable("user", {
```
- Creates `user` table definition
- `"user"`: Table name in database
- Exported for use in queries

```typescript
  id: text("id").primaryKey(),
```
- `id` column: Text type, primary key
- Primary keys uniquely identify each row
- Text type allows UUIDs or custom IDs

```typescript
  name: text("name").notNull(),
```
- `name` column: Text type, required (cannot be null)
- Stores user's full name

```typescript
  email: text("email").notNull().unique(),
```
- `email` column: Text type, required, unique
- `.unique()`: Ensures no duplicate emails
- Used for login

```typescript
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
```
- `emailVerified`: Integer stored as boolean
- `{ mode: "boolean" }`: Drizzle converts 0/1 to boolean
- `.$defaultFn(() => false)`: Default value is false
- `.notNull()`: Required field

```typescript
  image: text("image"),
```
- `image` column: Text type, optional (nullable)
- Stores profile image URL

```typescript
  userType: text("user_type"),
```
- `userType`: Text type, optional
- Values: "brand", "influencer", "admin"
- Determines user role and permissions

```typescript
  isApproved: integer("is_approved", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
```
- `isApproved`: Boolean flag
- Default: false (requires admin approval)
- Controls access to platform features

```typescript
  approvedBy: text("approved_by").references(() => user.id),
```
- `approvedBy`: Foreign key to user table
- `.references(() => user.id)`: References user.id
- Stores ID of admin who approved the user

```typescript
  approvedAt: integer("approved_at", { mode: "timestamp" }),
```
- `approvedAt`: Timestamp of approval
- `{ mode: "timestamp" }`: Converts integer to Date object
- Optional (null until approved)

```typescript
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
```
- `createdAt`: Timestamp of account creation
- `.$defaultFn(() => new Date())`: Auto-sets to current date/time
- Required field

**Other Important Tables**:

- **`session`**: Stores user sessions (tokens, expiry, IP address)
- **`account`**: Stores authentication credentials (password hashes)
- **`conversations`**: Stores chat conversations between users
- **`messages`**: Stores encrypted messages with attachments
- **`influencerProfiles`**: Extended profile data for influencers
- **`profileClaims`**: Profile claim requests and status

---

### 5.3 Authentication Files

#### `src/lib/auth.ts`

**Purpose**: Better Auth configuration and setup.

**Line-by-Line Explanation**:

```typescript
import { betterAuth } from "better-auth";
```
- Imports Better Auth main function
- Better Auth: Modern authentication library for Next.js

```typescript
import { drizzleAdapter } from "better-auth/adapters/drizzle";
```
- Imports Drizzle adapter for Better Auth
- Allows Better Auth to use Drizzle ORM for database operations

```typescript
import { NextRequest } from 'next/server';
```
- Imports Next.js request type (for helper functions)

```typescript
import { headers } from "next/headers"
```
- Imports headers function to access request headers

```typescript
import { db } from "@/db";
```
- Imports database instance

```typescript
export const auth = betterAuth({
```
- Creates and exports Better Auth instance
- `betterAuth()`: Main configuration function

```typescript
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
```
- Configures database adapter
- `drizzleAdapter()`: Connects Better Auth to Drizzle
- `provider: "sqlite"`: Specifies SQLite database

```typescript
	emailAndPassword: {    
		enabled: true,
		requireEmailVerification: false,
	},
```
- Enables email/password authentication
- `enabled: true`: Turns on email/password login
- `requireEmailVerification: false`: Users don't need to verify email

```typescript
	user: {
		additionalFields: {
			userType: {
				type: "string",
				required: false,
			},
			isApproved: {
				type: "boolean",
				required: false,
			}
		}
	},
```
- Adds custom fields to user model
- `userType`: Stores role (brand/influencer/admin)
- `isApproved`: Stores approval status
- Both optional (can be null)

```typescript
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60 * 24 * 7, // 7 days
		},
		cookieName: "better-auth.session_token",
		expiresIn: 60 * 60 * 24 * 7, // 7 days
	},
```
- Configures session management
- `cookieCache.enabled: true`: Caches sessions in memory
- `maxAge`: Cookie expiration (7 days in seconds)
- `cookieName`: Name of session cookie
- `expiresIn`: Session expiration time (7 days)

```typescript
	plugins: []
```
- Empty plugins array (can add OAuth, etc. here)

```typescript
});
```
- Closes Better Auth configuration

```typescript
// Session validation helper
export async function getCurrentUser(request: NextRequest) {
```
- Helper function to get current user from request
- `request`: Next.js request object

```typescript
  const session = await auth.api.getSession({ headers: await headers() });
```
- Gets session from Better Auth
- `auth.api.getSession()`: Better Auth API method
- `headers()`: Gets request headers (contains cookies)

```typescript
  return session?.user || null;
```
- Returns user object if session exists, otherwise null
- `?.`: Optional chaining (safe if session is null)
- `|| null`: Returns null if user is undefined

**Purpose**:
- Centralized authentication configuration
- Provides session management
- Extends user model with custom fields

---

### 5.4 Encryption Files

#### `src/lib/encryption.ts` (Server-Side)

**Purpose**: Server-side encryption/decryption using Node.js crypto.

**Key Functions**:

**`deriveConversationKey()`**:
- Derives unique encryption key for each conversation
- Uses PBKDF2 with conversation ID and participant IDs
- Ensures same key for same conversation pair
PBKDF2 (Password-Based Key Derivation Function 2) is a standard cryptographic algorithm for deriving keys from passwords, designed to resist brute-force and dictionary attacks by making the process slow. It works by repeatedly applying a pseudorandom function (like HMAC) to the password along with a unique salt, performing thousands or even millions of iterations to create a strong, derived key. This process ensures that even if the password is weak, the resulting key is difficult to crack. 

**`encryptText()`**:
- Encrypts text messages using AES-256-GCM
- Generates random IV for each encryption
- Returns base64-encoded string

**`decryptText()`**:
- Decrypts encrypted text messages
- Extracts IV and auth tag from encrypted data
- Verifies authentication tag

**`encryptBinary()`**:
- Encrypts binary data (files, images, audio)
- Same algorithm as text encryption
- Handles ArrayBuffer/Buffer data

**`decryptBinary()`**:
- Decrypts encrypted binary data
- Returns Buffer for file operations

**`isEncrypted()`**:
- Heuristic check if data is encrypted
- Checks base64 format and minimum length
- Used for backward compatibility

---

#### `src/lib/encryption-client.ts` (Client-Side)

**Purpose**: Client-side encryption/decryption using Web Crypto API.

**Key Differences from Server-Side**:
- Uses `crypto.subtle` (Web Crypto API)
- Async functions (returns Promises)
- Fetches encryption secret from API endpoint
- Compatible with server-side encryption

**Important**: Client and server use same algorithm (AES-256-GCM) and parameters for compatibility.

---

### 5.5 Recommendation Engine

#### `src/lib/recommendation-engine.ts`

**Purpose**: AI-powered matching algorithm for brands and influencers.

**Key Functions**:

**`recommendInfluencersForBrowsing()`**:
- Main function for browse page recommendations
- Takes brand ID and filters
- Returns sorted list of influencers with match scores

**`calculateInfluencerScore()`**:
- Calculates match score for single influencer
- Uses weighted scoring system:
  - Category Match: 30%
  - Audience Alignment: 25%
  - Engagement Quality: 20%
  - Platform Match: 10%
  - Follower Range: 5%
  - Geographic Match: 5%
  - Budget Alignment: 2%
  - Profile Completeness: 2%
  - Past Collaborations: 1%

**`getAverageEngagementRate()`**:
- Calculates average engagement across all platforms
- Formula: `(likes + views/10) / followers * 100`
- Views weighted less (divided by 10)

**Why This Specific Formula? (Demo Answer)**:

The engagement rate formula `(likes + views/10) / followers * 100` is designed based on industry best practices:

1. **Likes are weighted at 100%**: 
   - Likes represent active engagement (user took action)
   - More valuable indicator of audience interest
   - Example: 1000 likes from 10,000 followers = 10% engagement

2. **Views are weighted at 10% (divided by 10)**:
   - Views are passive engagement (user just watched)
   - Much easier to get than likes (autoplay, scrolling)
   - Views can be inflated (repeated views, accidental views)
   - Dividing by 10 normalizes views to be comparable to likes
   - Example: 10,000 views = 1,000 "equivalent likes"

3. **Why not just (likes + views) / followers?**:
   - Would overvalue views (views are 10-100x more common than likes)
   - Would give misleading engagement rates
   - Example: 100 likes + 10,000 views from 10,000 followers
     - Without weighting: (100 + 10,000) / 10,000 = 101% (impossible!)
     - With weighting: (100 + 10,000/10) / 10,000 = 2% (realistic)

4. **Industry Standard**:
   - Similar to how Instagram, YouTube calculate engagement
   - Views are considered "soft engagement" vs "hard engagement" (likes)
   - Weighting ensures accurate representation of true audience interest

5. **Practical Example**:
   - Influencer A: 1M followers, 50K likes, 500K views
     - Engagement = (50,000 + 500,000/10) / 1,000,000 * 100 = 10%
   - Influencer B: 1M followers, 50K likes, 50K views
     - Engagement = (50,000 + 50,000/10) / 1,000,000 * 100 = 5.5%
   - Influencer A has better engagement (more views indicate content is being watched)

**`categoryMatch()`**:
- Advanced fuzzy matching algorithm for category comparison
- **Exact Match (100 points)**: Categories are identical after normalization
- **High Similarity (70-90 points)**: One category contains the other (e.g., "Fashion" in "Fashion & Lifestyle")
  - Score varies based on overlap ratio (70-90 points)
- **Word-Based Matching (30-100 points)**:
  - All words match: 60-100 points (base 60 + bonuses for exact/partial/synonym matches)
  - Partial word match: 30-70 points based on word similarity
  - Uses synonym dictionary for semantic matching (e.g., "Beauty" matches "Cosmetics")
- **Synonym Matching (50 points)**: Both categories relate to same synonym group
- **Weak Match (20 points)**: First 4 characters match
- **No Match (0 points)**: Categories are completely different

**Category Matching Features**:
- Normalizes categories (removes special chars, handles "&" and commas)
- Extracts meaningful words (filters out words < 3 characters)
- Uses synonym dictionary for semantic matching:
  - Fashion ↔ Style, Clothing, Apparel
  - Beauty ↔ Cosmetics, Makeup, Skincare
  - Fitness ↔ Health, Workout, Exercise
  - And 15+ more category groups
- Word-based similarity calculation
- Handles multi-word categories (e.g., "Fashion & Lifestyle" vs "Fashion Blogging")

**`audienceAlignment()`**:
- Checks audience compatibility
- Gender match: +40 points
- Age range: +10 points
- Interests: +20 points per match

---

### 5.6 API Routes

#### `src/app/api/messages/route.ts`

**Purpose**: Handles message sending and retrieval.

**GET Method**:
- Retrieves messages for a user
- Supports filtering by conversation
- Returns messages with pagination

**POST Method**:
- Creates new message
- Validates sender, conversation, content
- Stores encrypted message in database
- Updates conversation's lastMessageAt

---

#### `src/app/api/conversations/route.ts`

**Purpose**: Handles conversation creation and listing.

**GET Method**:
- Lists conversations for a user
- Includes unread message count
- Joins with user table for participant info
- Orders by lastMessageAt (most recent first)

**POST Method**:
- Creates new conversation
- Checks for duplicate conversations
- Returns existing conversation if duplicate found (409 Conflict)

---

#### `src/app/api/upload/route.ts`

**Purpose**: Handles file uploads with encryption support.

**POST Method**:
- Accepts multipart form data
- Validates file type and size
- Supports encrypted file uploads (`.enc` extension)
- Saves files to `/public/uploads`
- Returns file URL and metadata

---

### 5.7 Page Components

#### `src/app/page.tsx` (Home Page)

**Purpose**: Landing page for the platform.

**Line-by-Line Explanation**:

```typescript
"use client";
```
- Marks component as Client Component
- Needed for interactivity (animations, state)

```typescript
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
```
- Imports all landing page sections
- Each section is a separate component

```typescript
export default function Home() {
```
- Default export (Next.js page component)
- Function name matches file name

```typescript
  return (
    <div className="min-h-screen">
```
- Root div with minimum height (full screen)
- `min-h-screen`: Tailwind class for full viewport height

```typescript
      <Header />
```
- Header component (navigation, login/register buttons)

```typescript
      <HeroSection />
```
- Hero section (main banner, CTA)

```typescript
      <HowItWorksSection />
```
- "How It Works" section (explains platform)

```typescript
      <FeaturesSection />
```
- Features section (platform capabilities)

```typescript
      <TestimonialsSection />
```
- Testimonials section (user reviews)

```typescript
      <CTASection />
```
- Call-to-action section (encourages signup)

```typescript
      <Footer />
```
- Footer component (links, copyright)

```typescript
    </div>
  );
}
```
- Closes root div and component

---

#### `src/app/layout.tsx` (Root Layout)

**Purpose**: Root layout wrapper for all pages.

**Line-by-Line Explanation**:

```typescript
import type { Metadata } from "next";
```
- Imports Metadata type for SEO

```typescript
import "./global.css";
```
- Imports global CSS styles
- Applied to all pages

```typescript
import ErrorReporter from "@/components/ErrorReporter";
```
- Imports error boundary component
- Catches and reports React errors

```typescript
import Script from "next/script";
```
- Imports Next.js Script component
- Optimized script loading

```typescript
import { Toaster } from "@/components/ui/sonner";
```
- Imports toast notification component
- Shows success/error messages

```typescript
export const metadata: Metadata = {
  title: "Splash - Brand Influencer Collaboration Platform",
  description: "Connect brands with perfect influencers. AI-powered matching, seamless collaboration, and real-time analytics for modern marketing.",
};
```
- SEO metadata
- `title`: Page title (browser tab)
- `description`: Meta description (search engines)

```typescript
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
```
- Root layout component
- `children`: Page content (varies by route)
- `Readonly<>`: TypeScript type (prevents mutation)

```typescript
  return (
    <html lang="en">
```
- HTML root element
- `lang="en"`: Language attribute (accessibility)

```typescript
      <body className="antialiased">
```
- Body element
- `antialiased`: Tailwind class (smooth font rendering)

```typescript
        <ErrorReporter />
```
- Error boundary (catches React errors)

```typescript
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
```
- External script for route messaging
- `strategy="afterInteractive"`: Loads after page is interactive
- `data-*`: Custom data attributes for script configuration

```typescript
        {children}
```
- Renders page content (varies by route)

```typescript
        <Toaster />
```
- Toast notification container
- Renders at bottom of screen

```typescript
      </body>
    </html>
  );
}
```
- Closes body and html tags

---

### 5.8 Authentication Pages

#### `src/app/login/page.tsx`

**Purpose**: User login page with email/password authentication.

**Line-by-Line Explanation**:

```typescript
"use client";
```
- Marks component as Client Component (needed for state and interactivity)

```typescript
import { useState } from "react";
```
- Imports React useState hook for form state management

```typescript
import { useRouter } from "next/navigation";
```
- Imports Next.js router for navigation after login

```typescript
import { authClient } from "@/lib/auth-client";
```
- Imports Better Auth client for authentication

```typescript
export default function LoginPage() {
```
- Default export (Next.js page component)

```typescript
  const router = useRouter();
```
- Gets router instance for navigation

```typescript
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
```
- Form state: email, password, rememberMe checkbox
- `useState`: React hook for component state

```typescript
  const [isLoading, setIsLoading] = useState(false);
```
- Loading state (prevents double submission)

```typescript
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
```
- Updates form state when input changes
- `...formData`: Spreads existing state (immutability)
- `[e.target.name]`: Dynamic property name (email or password)

```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
```
- Form submission handler
- `e.preventDefault()`: Prevents default form submission (page reload)

```typescript
    setIsLoading(true);
```
- Sets loading state (disables button, shows spinner)

```typescript
    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
```
- Calls Better Auth sign-in method
- `authClient.signIn.email()`: Better Auth email/password login
- Returns `data` (session) and `error` (if any)

```typescript
      if (error?.code) {
        console.error("Login error:", error);
```
- Checks for authentication error
- `error?.code`: Optional chaining (safe if error is null)

```typescript
        if (error.message && error.message.includes("suspended")) {
          toast.error("Your account has been suspended...");
        } else {
          toast.error("Invalid email or password...");
        }
```
- Shows appropriate error message
- Checks for suspension error specifically

```typescript
      toast.success("Welcome back!");
```
- Shows success message

```typescript
      await new Promise(resolve => setTimeout(resolve, 1000));
```
- Waits 1 second for session to be established
- Ensures session cookie is set before navigation

```typescript
      router.push("/dashboard");
```
- Navigates to dashboard after successful login

**Purpose**: 
- Provides login interface
- Authenticates users via Better Auth
- Handles errors and loading states
- Redirects to dashboard on success

---

#### `src/app/register/page.tsx` (Key Sections)

**Purpose**: User registration page with CSV matching and profile claim support.

**Key State Variables**:

```typescript
const [step, setStep] = useState<"type" | "form" | "claim">("type");
```
- Multi-step registration flow
- Steps: "type" (select brand/influencer), "form" (enter details), "claim" (claim profile)

```typescript
const [userType, setUserType] = useState<string>("");
```
- Selected user type (brand or influencer)

```typescript
const [csvMatches, setCsvMatches] = useState<any[]>([]);
```
- CSV matching results (if influencer matches CSV data)

**Key Functions**:

```typescript
const checkCSVMatches = async () => {
```
- Checks if user's name/email matches CSV records
- Called when influencer enters name/email
- Returns matching CSV records for profile claim

```typescript
const createAccount = async () => {
  const { data, error } = await authClient.signUp.email({
    email: formData.email,
    password: formData.password,
    name: formData.name,
    userType: userType,
  });
```
- Creates new user account
- `authClient.signUp.email()`: Better Auth registration
- Includes custom `userType` field

```typescript
const submitClaim = async () => {
  const { uploadedProofImages, uploadedIdDocument } = await uploadFiles();
  
  const response = await fetch("/api/profile-claims", {
    method: "POST",
    body: JSON.stringify({
      registrationData: { name, email, password, userType },
      csvRecordId: selectedMatch.csvRecordId,
      claimReason: claimReason,
      proofImages: uploadedProofImages,
      idDocument: uploadedIdDocument,
    }),
  });
```
- Submits profile claim with proof documents
- Uploads files first, then creates claim
- Stores registration data for account creation after approval

**Purpose**:
- Handles user registration
- Matches influencers with CSV data
- Supports profile claim workflow
- Multi-step form with validation

---

### 5.9 Chat/Messaging System

#### `src/app/dashboard/chat/page.tsx` (Key Sections)

**Purpose**: Real-time encrypted messaging interface.

**Key State Variables**:

```typescript
const [conversations, setConversations] = useState<Conversation[]>([]);
```
- List of user's conversations

```typescript
const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
```
- Currently open conversation

```typescript
const [messages, setMessages] = useState<Message[]>([]);
```
- Messages in selected conversation

```typescript
const [attachment, setAttachment] = useState<{
  type: 'image' | 'document' | 'voice';
  url: string;
  name: string;
  size: number;
} | null>(null);
```
- Selected file attachment (before sending)

**Key Functions**:

```typescript
const fetchConversations = async () => {
  const response = await fetch(`/api/conversations?userId=${session.user.id}`);
  const data = await response.json();
  setConversations(data);
};
```
- Fetches all conversations for current user
- Includes unread message counts
- Updates conversation list

```typescript
const fetchMessages = async (conversationId: number, markAsRead: boolean = false) => {
  const response = await fetch(`/api/conversations/${conversationId}/messages`);
  const messages = await response.json();
  
  // Decrypt messages
  const decryptedMessages = await Promise.all(
    messages.map(async (msg: Message) => {
      if (isEncrypted(msg.content)) {
        const decrypted = await decryptText(
          msg.content,
          conversationId,
          selectedConversation.participant1Id,
          selectedConversation.participant2Id
        );
        return { ...msg, content: decrypted };
      }
      return msg;
    })
  );
  
  setMessages(decryptedMessages);
  
  if (markAsRead) {
    // Mark all messages as read
    await fetch(`/api/messages/${messageId}/read`, { method: 'PATCH' });
  }
};
```
- Fetches messages for a conversation
- Decrypts encrypted messages on client-side
- Marks messages as read when conversation is opened

```typescript
const handleSendMessage = async () => {
  if (!newMessage.trim() && !attachment) return;
  
  setIsSending(true);
  
  // Encrypt message content
  const encryptedContent = await encryptText(
    newMessage,
    selectedConversation.id,
    session.user.id,
    otherParticipant.id
  );
  
  // If attachment exists, encrypt it
  let encryptedAttachment = null;
  if (attachment) {
    const fileData = await attachment.file.arrayBuffer();
    const encryptedFile = await encryptBinary(
      fileData,
      selectedConversation.id,
      session.user.id,
      otherParticipant.id
    );
    
    // Upload encrypted file
    const formData = new FormData();
    formData.append('file', new Blob([encryptedFile]), 'encrypted.enc');
    formData.append('encrypted', 'true');
    formData.append('originalName', await encryptText(attachment.name, ...));
    
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    encryptedAttachment = await uploadResponse.json();
  }
  
  // Send message
  const response = await fetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({
      conversationId: selectedConversation.id,
      senderId: session.user.id,
      content: encryptedContent,
      attachmentType: attachment?.type,
      attachmentUrl: encryptedAttachment?.fileUrl,
      attachmentName: encryptedAttachment?.originalName,
    }),
  });
  
  // Refresh messages
  await fetchMessages(selectedConversation.id);
  setNewMessage("");
  setAttachment(null);
};
```
- Sends encrypted message
- Encrypts text content before sending
- Encrypts file attachments
- Uploads encrypted files to server
- Stores encrypted data in database

**AttachmentDisplay Component**:

```typescript
function AttachmentDisplay({ message, selectedConversation, session, isSent }) {
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
```
- Component for displaying encrypted attachments
- `decryptedUrl`: Blob URL for decrypted file
- `isDecrypting`: Loading state during decryption

```typescript
  const handleDecryptFile = async () => {
    // Fetch encrypted file
    const response = await fetch(message.attachmentUrl!);
    const encryptedBlob = await response.blob();
    const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();
    
    // Decrypt file
    const decrypted = await decryptBinary(
      await new Response(encryptedArrayBuffer).text(), // Convert to base64 string
      selectedConversation.id,
      participant1Id,
      participant2Id
    );
    
    // Create blob URL for display
    const blob = new Blob([decrypted], { type: message.attachmentType });
    const blobUrl = URL.createObjectURL(blob);
    setDecryptedUrl(blobUrl);
  };
```
- Decrypts file on-demand (when user clicks "Decrypt & View")
- Fetches encrypted file from server
- Decrypts using conversation key
- Creates blob URL for browser display

**Purpose**:
- Provides real-time messaging interface
- Handles encryption/decryption transparently
- Supports text, images, documents, and voice notes
- Manages unread message counts

---

### 5.10 Search and Filtering Utilities

#### `src/lib/search-utils.ts`

**Purpose**: Search and filtering functions for influencer directory.

**`parseFollowerCount()` Function**:

```typescript
export function parseFollowerCount(count: string | null): number {
  if (!count) return 0;
```
- Parses follower count strings (e.g., "1.5M", "500K")
- Returns 0 if count is null/undefined

```typescript
  const cleaned = count.toString().trim().replace(/,/g, '');
```
- Removes commas and whitespace
- `replace(/,/g, '')`: Global regex replace (removes all commas)

```typescript
  const match = cleaned.match(/^([\d.]+)([KMkm]?)$/);
```
- Regex pattern: `^([\d.]+)([KMkm]?)$`
- `^`: Start of string
- `([\d.]+)`: Captures digits and decimal point (e.g., "1.5")
- `([KMkm]?)`: Optionally captures K or M suffix
- `$`: End of string

```typescript
  if (!match) return 0;
```
- If pattern doesn't match, return 0

```typescript
  const value = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
```
- Extracts numeric value and suffix
- `match[1]`: First capture group (number)
- `match[2]`: Second capture group (suffix)

```typescript
  if (suffix === 'K') return value * 1000;
  if (suffix === 'M') return value * 1000000;
  return value;
```
- Converts based on suffix
- "K" = multiply by 1,000
- "M" = multiply by 1,000,000
- No suffix = return as-is

**`matchesSearch()` Function**:

```typescript
export function matchesSearch(text: string | null | undefined, query: string): boolean {
  if (!text || !query) return false;
```
- Main search matching function
- Returns false if text or query is null/empty

```typescript
  const textLower = textTrimmed.toLowerCase();
  const queryLower = queryTrimmed.toLowerCase();
```
- Normalizes to lowercase for case-insensitive matching

```typescript
  if (queryLower.length < 2) return false;
```
- Rejects single-character queries (prevents too many results)

```typescript
  if (textLower === queryLower) return true;
```
- Exact match check (highest priority)

```typescript
  const queryWords = queryLower.split(/\s+/).filter(w => w.length >= 2);
```
- Splits query into words
- `split(/\s+/)`: Splits on whitespace (handles multiple spaces)
- `filter(w => w.length >= 2)`: Only keeps words with 2+ characters

```typescript
  if (queryWords.length > 1) {
    return queryWords.every(word => textLower.includes(word));
  }
```
- Multi-word query: ALL words must match (AND logic)
- `every()`: Returns true only if all words match

```typescript
  return textLower.includes(queryLower);
```
- Single-word query: Check if query appears as substring
- Allows "john" to match "johnson" or "John Doe"

**Purpose**:
- Provides intelligent search matching
- Handles follower count parsing
- Supports multi-word queries with AND logic
- Prevents single-character matches

---

### 5.11 File Claims Store

#### `src/lib/file-claims-store.ts`

**Purpose**: File-based storage for profile claims (alternative to database).

**Why File-Based?**:
- Simple storage (no database overhead)
- Easy to inspect (JSON file)
- Good for development/prototyping
- Can migrate to database later

**Line-by-Line Explanation**:

```typescript
const STORE_FILE = path.join(process.cwd(), 'claims-store.json');
```
- Path to claims storage file
- `process.cwd()`: Current working directory (project root)
- `claims-store.json`: JSON file storing all claims

```typescript
export class FileClaimsStore {
  private claims: ClaimData[] = [];
```
- Class for managing claims
- `private claims`: Internal array storing claims in memory

```typescript
  constructor() {
    this.loadClaimsSync();
  }
```
- Constructor loads claims from file on initialization
- `loadClaimsSync()`: Synchronous file read

```typescript
  private loadClaimsSync() {
    try {
      const data = require('fs').readFileSync(STORE_FILE, 'utf-8');
      this.claims = JSON.parse(data);
    } catch (error) {
      this.claims = [];
    }
  }
```
- Loads claims from JSON file
- `readFileSync()`: Synchronous file read (blocks until complete)
- `JSON.parse()`: Converts JSON string to JavaScript object
- If file doesn't exist, starts with empty array

```typescript
  private async saveClaims() {
    await fs.writeFile(STORE_FILE, JSON.stringify(this.claims, null, 2));
  }
```
- Saves claims to JSON file
- `fs.writeFile()`: Async file write
- `JSON.stringify(this.claims, null, 2)`: Pretty-prints JSON (2-space indent)

```typescript
  async createClaim(claimData: Omit<ClaimData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClaimData> {
    const id = Date.now().toString();
    const now = new Date();
```
- Creates new claim
- `Date.now()`: Current timestamp (milliseconds since epoch)
- Used as unique ID

```typescript
    const claim: ClaimData = {
      ...claimData,
      id,
      createdAt: now,
      updatedAt: now,
    };
```
- Creates claim object with auto-generated fields
- `...claimData`: Spreads provided data

```typescript
    this.claims.push(claim);
    await this.saveClaims();
    return claim;
```
- Adds claim to array
- Saves to file
- Returns created claim

```typescript
  async getClaimById(id: string): Promise<ClaimData | null> {
    this.loadClaimsSync();
    return this.claims.find(claim => claim.id === id) || null;
  }
```
- Gets claim by ID
- Reloads from file (ensures latest data)
- `find()`: Returns first matching claim or undefined
- `|| null`: Converts undefined to null

**Purpose**:
- Provides simple storage for profile claims
- File-based (no database required)
- Easy to inspect and debug
- Can be migrated to database later

---

### 5.12 Dashboard Page

#### `src/app/dashboard/page.tsx` (Key Sections)

**Purpose**: Main dashboard showing role-specific statistics and quick actions.

**Key Sections**:

```typescript
const { data: session, isPending } = useSession();
```
- Gets current user session
- `isPending`: Loading state while checking session

```typescript
useEffect(() => {
  const fetchStats = async () => {
    const response = await fetch('/api/dashboard/stats', {
      credentials: 'include',
    });
    const data = await response.json();
    setStats(data);
  };
  fetchStats();
}, [session]);
```
- Fetches dashboard statistics when session is available
- `credentials: 'include'`: Sends cookies with request
- Statistics vary by user type (admin/influencer/brand)

**Role-Specific Metrics**:

**For Admin**:
- Pending claims count
- Approved/rejected claims
- Total users by type
- Platform statistics

**For Influencer**:
- Profile completeness percentage
- Unread notifications count
- Unread messages count
- Active campaigns count

**For Brand**:
- Active campaigns count
- Connected influencers count
- Unread messages count
- Total ROI

**Quick Action Cards**:
- Browse Influencers/Brands
- Messages
- Analytics
- Profile Edit
- Campaign Management

**Purpose**:
- Provides overview of user's activity
- Role-specific metrics and actions
- Quick navigation to key features

---

### 5.13 API Routes - Detailed Explanations

#### `src/app/api/messages/route.ts`

**GET Method** - Retrieve Messages:

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const conversationWith = searchParams.get('conversationWith');
```
- Gets query parameters from URL
- `userId`: User requesting messages
- `conversationWith`: Optional conversation ID filter

```typescript
  let whereConditions;
  if (conversationWith) {
    whereConditions = or(
      and(
        eq(messages.senderId, userId),
        eq(messages.conversationId, parseInt(conversationWith))
      ),
      // ... more conditions
    );
  }
```
- Builds database query conditions
- If `conversationWith` provided, filters by conversation
- Otherwise, gets all messages for user

```typescript
  const results = await db
    .select()
    .from(messages)
    .where(whereConditions)
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
```
- Executes database query
- `select()`: Selects all columns
- `orderBy(desc(...))`: Orders by creation date (newest first)
- `limit()`: Limits number of results
- `offset()`: Pagination support

**POST Method** - Send Message:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { senderId, conversationId, content, attachmentType, attachmentUrl, attachmentName, attachmentSize } = body;
```
- Gets message data from request body
- Content is already encrypted (encryption happens on client)

```typescript
  if (!senderId || typeof senderId !== 'string' || senderId.trim() === '') {
    return NextResponse.json({ error: 'Sender ID is required' }, { status: 400 });
  }
```
- Validates required fields
- Returns 400 error if validation fails

```typescript
  const newMessage = await db
    .insert(messages)
    .values({
      senderId: senderId.trim(),
      conversationId: conversationId,
      content: trimmedContent, // Encrypted content
      attachmentType: attachmentType || null,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null, // Encrypted filename
      attachmentSize: attachmentSize || null,
      isRead: false,
      createdAt: new Date(),
    })
    .returning();
```
- Inserts message into database
- `insert()`: Creates new record
- `values()`: Sets field values
- `returning()`: Returns created record

```typescript
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));
```
- Updates conversation's last message timestamp
- Used for sorting conversations by most recent activity

---

#### `src/app/api/conversations/route.ts`

**GET Method** - List Conversations:

```typescript
const results = await db
  .select({
    id: conversations.id,
    participant1Id: conversations.participant1Id,
    participant2Id: conversations.participant2Id,
    lastMessageAt: conversations.lastMessageAt,
    unreadCount: sql`(
      select count(*) from messages m
      where m.conversation_id = ${conversations.id}
        and m.is_read = 0
        and m.sender_id <> ${userId}
    )`,
```
- Selects conversation fields
- `sql``: Raw SQL for unread count calculation
- Subquery counts unread messages not sent by current user

```typescript
    participant1: sql`json_object(
      'id', ${participant1.id},
      'name', ${participant1.name},
      'email', ${participant1.email},
      'image', ${participant1.image},
      'userType', ${participant1.userType}
    )`,
```
- Creates JSON object for participant data
- `json_object()`: SQLite function to create JSON
- Includes user details for display

**POST Method** - Create Conversation:

```typescript
const existingConversation = await db
  .select()
  .from(conversations)
  .where(
    or(
      and(
        eq(conversations.participant1Id, participant1Id),
        eq(conversations.participant2Id, participant2Id)
      ),
      and(
        eq(conversations.participant1Id, participant2Id),
        eq(conversations.participant2Id, participant1Id)
      )
    )
  )
  .limit(1);
```
- Checks for existing conversation
- Checks both participant order combinations (A-B and B-A)
- Prevents duplicate conversations

```typescript
if (existingConversation.length > 0) {
  return NextResponse.json({
    error: 'Conversation already exists',
    conversationId: existingConversation[0].id,
  }, { status: 409 });
}
```
- Returns 409 Conflict if conversation exists
- Includes existing conversation ID for redirect

---

#### `src/app/api/upload/route.ts`

**POST Method** - File Upload:

```typescript
const formData = await request.formData();
const file = formData.get('file') as File;
const isEncrypted = formData.get('encrypted') === 'true';
```
- Gets file from multipart form data
- Checks if file is pre-encrypted

```typescript
if (!isEncrypted) {
  const allowedTypes = [
    'image/',
    'application/pdf',
    'audio/',
    // ... more types
  ];
  const isValidType = allowedTypes.some(type => 
    file.type.startsWith(type) || file.type === type
  );
  if (!isValidType) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
}
```
- Validates file type (only for unencrypted files)
- Encrypted files skip validation (they're binary)

```typescript
const maxSize = (originalType?.startsWith('audio/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024) * (isEncrypted ? 1.2 : 1);
if (file.size > maxSize) {
  return NextResponse.json({ error: 'File too large' }, { status: 400 });
}
```
- Validates file size
- Audio: 5MB max, Others: 10MB max
- Encrypted files: 20% overhead allowed

```typescript
const timestamp = Date.now();
const randomString = Math.random().toString(36).substring(2, 15);
const fileName = `${timestamp}-${randomString}.${fileExtension}${isEncryptedUpload ? '.enc' : ''}`;
```
- Generates unique filename
- `Date.now()`: Timestamp for uniqueness
- `Math.random().toString(36)`: Random alphanumeric string
- `.enc` extension for encrypted files

```typescript
const filePath = join(uploadsDir, fileName);
const bytes = await file.arrayBuffer();
const buffer = Buffer.from(bytes);
await writeFile(filePath, buffer);
```
- Saves file to disk
- `arrayBuffer()`: Gets file as binary data
- `Buffer.from()`: Converts to Node.js Buffer
- `writeFile()`: Writes to filesystem

---

### 5.14 Recommendation Engine - Detailed Explanation

#### `src/lib/recommendation-engine.ts` (Key Functions)

**`recommendInfluencersForBrowsing()`**:

```typescript
export async function recommendInfluencersForBrowsing(
  brandId: string,
  filters?: {
    category?: string;
    minFollowers?: number;
    maxFollowers?: number;
    platforms?: string[];
    searchQuery?: string;
  },
  limit: number = 100
): Promise<RecommendationScore[]> {
```
- Main function for browse page recommendations
- `brandId`: Brand requesting recommendations
- `filters`: Optional filters (category, followers, platforms, search)
- `limit`: Maximum number of results

```typescript
  const brief: CampaignBrief = {
    category: filters?.category,
    minFollowers: filters?.minFollowers,
    maxFollowers: filters?.maxFollowers,
    requiredPlatforms: filters?.platforms,
  };
```
- Builds campaign brief from filters
- Used for scoring algorithm

```typescript
  let recommendations = await recommendInfluencersWithRules(
    brief,
    brandId,
    false,
    limit * 2
  );
```
- Gets recommendations using rule-based scoring
- Gets `limit * 2` to filter down later

```typescript
  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const searchQuery = filters.searchQuery.trim().toLowerCase();
    recommendations = recommendations.filter((rec: RecommendationScore) => {
      const nameMatch = matchesSearch(rec.influencerName, searchQuery);
      const emailMatch = matchesSearch(rec.influencerEmail, searchQuery);
      if (nameMatch || emailMatch) return true;
      // ... more field checks
      return false;
    });
  }
```
- Filters by search query if provided
- Priority: name first, then email, then other fields
- Only keeps matching influencers

```typescript
  return recommendations.slice(0, limit);
```
- Returns top N recommendations

**`calculateInfluencerScore()`**:

```typescript
async function calculateInfluencerScore(
  influencer: any,
  profile: any,
  brief: CampaignBrief,
  brandId: string,
  enforceGenderMatch: boolean
): Promise<RecommendationScore | null> {
```
- Calculates match score for single influencer
- Returns null if influencer doesn't meet hard filters

```typescript
  // Hard filters first
  if (brief.category && profile.category) {
    const briefCategory = brief.category.toLowerCase();
    const profileCategory = profile.category.toLowerCase();
    const exactMatch = briefCategory === profileCategory;
    const partialMatch = profileCategory.includes(briefCategory) || briefCategory.includes(profileCategory);
    
    if (!exactMatch && !partialMatch) {
      // Check word-based matching
      const briefWords = briefCategory.split(/\s+/);
      const profileWords = profileCategory.split(/\s+/);
      const hasCommonWord = briefWords.some((bw: string) => 
        profileWords.some((pw: string) => pw.includes(bw) || bw.includes(pw))
      );
      
      if (!hasCommonWord) {
        return null; // Skip this influencer
      }
    }
  }
```
- Category filter (hard filter)
- Exact match: keep
- Partial match: keep
- Word match: keep
- No match: skip (return null)

```typescript
  // Gender filter (critical for makeup, beauty products)
  if (enforceGenderMatch && brief.targetAudience?.gender) {
    const targetGender = brief.targetAudience.gender.toLowerCase();
    const profileGender = (profile.gender || '').toLowerCase();
    
    if (targetGender !== 'all' && targetGender !== 'any' && targetGender !== profileGender) {
      return null; // Skip if gender doesn't match
    }
  }
```
- Gender filter for gender-specific products
- Skips influencers with wrong gender
- Critical for makeup, beauty products

```typescript
  // Scoring (soft filters)
  const categoryMatchScore = brief.category
    ? categoryMatch(brief.category, profile.category)
    : 50; // Neutral if no category specified
```
- Calculates category match score
- 100 for exact match, 70 for partial, 0 for no match
- 50 (neutral) if brand didn't specify category

```typescript
  const matchScore =
    categoryMatchScore * 0.30 +
    audienceAlignmentScore * 0.25 +
    engagementScore * 0.20 +
    platformMatchScore * 0.10 +
    followerRangeScore * 0.05 +
    geographicMatchScore * 0.05 +
    budgetAlignmentScore * 0.02 +
    profileCompletenessScore * 0.02 +
    pastCollaborationsScore * 0.01;
```
- Weighted combination of all scores
- Weights sum to 1.0 (100%)
- Final score: 0-100

**Purpose**:
- Provides intelligent matching algorithm
- Hard filters eliminate non-matching influencers
- Soft filters score remaining influencers
- Returns sorted list by match score

---

## 6. Key Algorithms Explained

### 6.1 Encryption Algorithm Flow

1. **Key Derivation**:
   - Sort participant IDs alphabetically
   - Create salt: `SHA-256(conversationId:participant1:participant2)`
   - Derive key: `PBKDF2(masterSecret, salt, 100000 iterations, 32 bytes)`

2. **Encryption**:
   - Generate random 16-byte IV
   - Encrypt: `AES-256-GCM(plaintext, key, IV)`
   - Extract 16-byte auth tag
   - Combine: `IV + EncryptedData + AuthTag`
   - Encode as base64

3. **Decryption**:
   - Decode base64
   - Extract IV (first 16 bytes), AuthTag (last 16 bytes), EncryptedData
   - Decrypt: `AES-256-GCM(encryptedData, key, IV, authTag)`
   - Verify auth tag (automatic in GCM mode)

### 6.2 Recommendation Algorithm Flow

1. **Hard Filtering**:
   - Filter by category (exact/partial/word match)
   - Filter by follower range (min/max)
   - Filter by required platforms
   - Filter by gender (if applicable)

2. **Scoring**:
   - Calculate 9 component scores
   - Apply weights to each component
   - Sum weighted scores = final match score

3. **Sorting**:
   - Sort by match score (descending)
   - If search query: Sort by search relevance first

4. **Return Top N**:
   - Return top `limit` influencers
   - Include score breakdown for transparency

---

## 7. Database Schema

### Key Tables:

1. **`user`**: Core user accounts
   - `id`, `name`, `email`, `userType`, `isApproved`
   
2. **`session`**: User sessions
   - `id`, `token`, `userId`, `expiresAt`
   
3. **`conversations`**: Chat conversations
   - `id`, `participant1Id`, `participant2Id`, `lastMessageAt`
   
4. **`messages`**: Encrypted messages
   - `id`, `conversationId`, `senderId`, `content` (encrypted), `attachmentType`, `attachmentUrl`, `isRead`
   
5. **`influencerProfiles`**: Extended influencer data
   - `id`, `category`, social links, metrics, `profileCompleteness`
   
6. **`profileClaims`**: Profile claim requests
   - `id`, `userId`, `csvRecordId`, `status`, `proofImages`, `idDocument`

---

## 8. API Endpoints Summary

### Authentication:
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/sign-up/email` - Register

### Messages:
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `PATCH /api/messages/[messageId]/read` - Mark as read

### Conversations:
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/[id]/messages` - Get conversation messages

### Directory:
- `GET /api/directory/influencers` - Get influencers
- `GET /api/csv-influencers` - Check CSV matches

### Recommendations:
- `GET /api/recommendations/browse` - Get recommendations

### Profile Claims:
- `POST /api/profile-claims` - Submit claim
- `PATCH /api/admin/profile-claims` - Approve/reject claim

### Admin:
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/[id]/approve` - Approve user
- `PATCH /api/admin/users/[id]/suspend` - Suspend user

### Upload:
- `POST /api/upload` - Upload file

---

## 9. Authentication Flow

1. **User submits login form**
2. **Client calls `authClient.signIn.email()`**
3. **Better Auth validates credentials**
4. **Session created in database**
5. **Session cookie set (HTTP-only)**
6. **Middleware checks session on protected routes**
7. **Session expires after 7 days**

---

## 10. Encryption Implementation

### Client-Side (Browser):
- Uses Web Crypto API
- Encrypts before sending to server
- Decrypts after receiving from server

### Server-Side (Node.js):
- Uses Node.js crypto module
- Compatible with client-side encryption
- Same algorithm and parameters

### Key Features:
- AES-256-GCM (authenticated encryption)
- PBKDF2 key derivation (100,000 iterations)
- Unique key per conversation
- Backward compatible with unencrypted messages

### What is AuthTag? (Authentication Tag)

**AuthTag (Authentication Tag)** is a cryptographic security feature used in AES-GCM encryption mode.

**Purpose**:
- **Data Integrity**: Ensures the encrypted data hasn't been tampered with
- **Authentication**: Verifies the data came from the legitimate sender
- **Tamper Detection**: If someone modifies the encrypted data, decryption will fail

**How It Works**:

1. **During Encryption**:
   ```typescript
   const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
   let encrypted = cipher.update(plaintext);
   encrypted = Buffer.concat([encrypted, cipher.final()]);
   const authTag = cipher.getAuthTag(); // 16 bytes
   ```
   - AES-GCM automatically generates a 16-byte authentication tag
   - Tag is calculated from: plaintext + key + IV + additional data
   - Tag is unique for each encryption (even same plaintext = different tag)

2. **Storage**:
   - AuthTag is appended to encrypted data
   - Format: `IV (16 bytes) + EncryptedData + AuthTag (16 bytes)`
   - All stored together as base64 string

3. **During Decryption**:
   ```typescript
   const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
   decipher.setAuthTag(authTag); // Must set before decrypting
   let decrypted = decipher.update(encrypted);
   decrypted = Buffer.concat([decrypted, decipher.final()]);
   ```
   - AuthTag is extracted from encrypted data
   - Must be set on decipher before decryption
   - AES-GCM automatically verifies the tag during decryption

4. **What Happens if Tag is Wrong?**:
   - Decryption throws error: "Unsupported state or unable to authenticate data"
   - This means:
     - Data was tampered with (modified)
     - Wrong key was used
     - Data is corrupted
   - **Security**: Prevents attackers from modifying encrypted messages

**Why AuthTag is Important**:
- **Without AuthTag**: Attacker could modify encrypted data, and you wouldn't know
- **With AuthTag**: Any modification is detected immediately
- **Example**: If someone changes "Transfer $100" to "Transfer $1000" in encrypted message, AuthTag verification fails

**In Our Implementation**:
- AuthTag is 16 bytes (128 bits)
- Automatically generated by AES-GCM
- Included in every encrypted message
- Verified automatically during decryption
- Provides end-to-end security and integrity

**Demo Answer**: 
"AuthTag is a 16-byte authentication tag generated by AES-GCM encryption. It ensures data integrity - if someone tries to modify an encrypted message, the AuthTag verification will fail during decryption, preventing tampering. It's like a cryptographic signature that proves the data hasn't been altered."

---

This documentation provides a comprehensive overview of the Splash platform. Each file, function, and algorithm is explained in detail to help you prepare for your demo and defense.

**Next Steps for Demo Preparation**:
1. Review this documentation thoroughly
2. Practice explaining each module
3. Understand the data flow
4. Be ready to answer questions about:
   - Why certain design decisions were made
   - How encryption works
   - How the recommendation engine calculates scores
   - How the search algorithm works
   - Database schema and relationships

**Key Points to Emphasize**:
- End-to-end encryption for privacy
- AI-powered recommendation engine
- Scalable architecture (Next.js, SQLite, Drizzle ORM)
- Role-based access control
- Profile claim verification system

---

## 11. Additional File Explanations

### 11.1 CSV Loader

#### `src/lib/csv-loader.ts`

**Purpose**: Loads and parses CSV influencer data file.

**`getCSVData()` Function**:

```typescript
export function getCSVData(): CSVInfluencer[] {
  const csvPath = path.join(process.cwd(), 'influencers.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
```
- Gets path to CSV file in project root
- `readFileSync()`: Synchronously reads file (blocks until complete)
- `'utf-8'`: Reads as text (not binary)

```typescript
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
```
- Splits CSV into lines
- `split('\n')`: Splits on newline character
- `filter()`: Removes empty lines

```typescript
  const headers = lines[0].split(',').map(h => h.trim());
```
- Gets column headers from first line
- `split(',')`: Splits on comma
- `map(h => h.trim())`: Removes whitespace from each header

```typescript
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
```
- Loops through data lines (skips header)
- `values`: Array to store parsed values
- `current`: Current field being built
- `inQuotes`: Tracks if we're inside quoted field

```typescript
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
```
- Parses CSV line character by character
- `char === '"'`: Toggles quote state
- `char === ',' && !inQuotes`: Field separator (only if not in quotes)
- `current += char`: Builds current field

```typescript
    const record: any = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] || '').trim();
    });
    records.push(record as CSVInfluencer);
```
- Creates object from headers and values
- Maps each header to corresponding value
- Adds record to array

**`csvToProfile()` Function**:

```typescript
export function csvToProfile(csvRecord: CSVInfluencer): any {
  return {
    id: `csv-${csvRecord.Email || csvRecord.Name}`,
    name: csvRecord.Name,
    // ... maps all CSV fields to profile format
    dataSource: 'csv',
  };
}
```
- Converts CSV record to profile-like object
- Used by recommendation engine
- `dataSource: 'csv'`: Marks as CSV data (not database user)

**Purpose**:
- Loads 490+ influencer records from CSV
- Handles quoted fields and commas in data
- Converts to usable format for application

---

### 11.2 Platform Layout Component

#### `src/components/platform/platform-layout.tsx`

**Purpose**: Wrapper layout for all platform pages (dashboard, chat, etc.).

**Line-by-Line Explanation**:

```typescript
export function PlatformLayout({ children }: { children: React.ReactNode }) {
```
- Layout component that wraps page content
- `children`: Page content to render

```typescript
  const { data: session, isPending } = useSession();
```
- Gets current user session
- `isPending`: True while checking session

```typescript
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPending && !session?.user) {
        router.push("/login");
        return;
      }
      
      if (!isPending && session?.user && (session.user as any)?.isApproved === false) {
        router.push("/login");
        return;
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [session, isPending, router]);
```
- Checks session on mount and when session changes
- `setTimeout()`: Small delay to ensure session is loaded
- Redirects to login if no session or user is suspended
- `clearTimeout()`: Cleanup on unmount

```typescript
  if (isPending) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
```
- Shows loading spinner while checking session

```typescript
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden">
          <Button onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu />
          </Button>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <HelpChatbot />
    </div>
  );
}
```
- Renders layout with sidebar, header, main content, and help chatbot
- `flex h-screen`: Full height flex container
- `overflow-hidden`: Prevents page scroll (content scrolls independently)
- Mobile header with menu button (only on small screens)

**Purpose**:
- Provides consistent layout for all platform pages
- Handles authentication checks
- Includes sidebar navigation and notifications

---

### 11.3 Conversation Messages API

#### `src/app/api/conversations/[conversationId]/messages/route.ts`

**Purpose**: Fetches messages for a specific conversation.

**Line-by-Line Explanation**:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
```
- GET handler for conversation messages
- `params`: Route parameters (conversationId from URL)

```typescript
  const { conversationId } = await params;
```
- Extracts conversationId from route params
- `await`: Next.js 15 requires awaiting params

```typescript
  const parsedConversationId = parseInt(conversationId);
  if (isNaN(parsedConversationId)) {
    return NextResponse.json({ error: 'Invalid conversationId' }, { status: 400 });
  }
```
- Validates conversationId is a number
- `parseInt()`: Converts string to integer
- `isNaN()`: Checks if result is not a number

```typescript
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');
  const before = searchParams.get('before');
```
- Gets query parameters
- `limit`: Max messages to return (capped at 200)
- `offset`: Pagination offset
- `before`: Optional timestamp for pagination (get messages before this date)

```typescript
  const whereConditions = [eq(messages.conversationId, parsedConversationId)];
  
  if (before) {
    const beforeDate = new Date(before);
    if (!isNaN(beforeDate.getTime())) {
      whereConditions.push(lt(messages.createdAt, beforeDate));
    }
  }
```
- Builds query conditions
- Always filters by conversationId
- If `before` provided, adds date filter (for pagination)

```typescript
  const results = await db
    .select({
      id: messages.id,
      content: messages.content, // Encrypted content
      attachmentType: messages.attachmentType,
      attachmentUrl: messages.attachmentUrl,
      attachmentName: messages.attachmentName, // Encrypted filename
      // ... more fields
      sender: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(messages)
    .leftJoin(user, eq(messages.senderId, user.id))
    .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0])
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
```
- Queries messages with sender details
- `leftJoin()`: Joins with user table to get sender info
- `and(...whereConditions)`: Combines multiple conditions
- `orderBy(desc(...))`: Newest messages first
- Returns encrypted content (decryption happens on client)

**Purpose**:
- Retrieves messages for a conversation
- Supports pagination
- Includes sender information
- Returns encrypted data (client decrypts)

---

### 11.4 Dashboard Statistics API

#### `src/app/api/dashboard/stats/route.ts` (Key Sections)

**Purpose**: Returns role-specific dashboard statistics.

**For Influencer**:

```typescript
// Calculate profile completeness
const fields = [
  profile.category,
  profile.description,
  profile.instagram,
  // ... more fields
];
const filledFields = fields.filter(field => field && field.trim() !== '').length;
```
- Defines required profile fields
- Counts how many are filled (not null/empty)

```typescript
const socialMetrics = [
  profile.instagramFollowers,
  profile.youtubeFollowers,
  // ... more metrics
].filter(field => field && field.trim() !== '').length;
```
- Counts filled social media metrics

```typescript
const totalFields = fields.length + 4; // Include social metrics
const completedFields = filledFields + socialMetrics;
profileCompleteness = Math.round((completedFields / totalFields) * 100);
```
- Calculates percentage
- `Math.round()`: Rounds to nearest integer
- Formula: `(filled / total) * 100`

```typescript
// Update database if changed
if (profileCompleteness !== profile.profileCompleteness) {
  await db.update(influencerProfiles)
    .set({ profileCompleteness, updatedAt: new Date() })
    .where(eq(influencerProfiles.id, userId));
}
```
- Updates database if completeness changed
- Keeps database in sync with calculated value

**For Brand**:

```typescript
// Get active campaigns
const allCampaigns = await db.query.campaigns.findMany({
  where: eq(campaigns.brandId, userId)
});
const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;
```
- Gets all campaigns for brand
- Filters by status='active'
- Counts active campaigns

```typescript
// Get unique influencers connected
const allCollaborations = await db.query.collaborations.findMany({
  where: eq(collaborations.brandId, userId)
});
const uniqueInfluencerIds = new Set(
  allCollaborations
    .filter(c => c.status === 'active' || c.status === 'completed')
    .map(c => c.influencerId)
);
const influencersConnected = uniqueInfluencerIds.size;
```
- Gets all collaborations
- Filters active/completed collaborations
- Uses `Set` to get unique influencer IDs
- `Set.size`: Count of unique influencers

**Purpose**:
- Provides role-specific statistics
- Calculates metrics in real-time
- Updates database when needed

---

## 12. Complete Project Flow Diagrams

### 12.1 User Registration Flow

```
1. User visits /register
   ↓
2. Selects user type (Brand/Influencer)
   ↓
3. Fills registration form
   ↓
4. If Influencer: System checks CSV for matches
   ↓
5a. If CSV match found: User can claim profile
   ↓
5b. If no match: Continue with registration
   ↓
6. Account created (isApproved=false)
   ↓
7. Redirect to login or claim status page
```

### 12.2 Message Sending Flow

```
1. User A types message in chat
   ↓
2. User A clicks Send
   ↓
3. Client encrypts message (encryptText)
   ↓
4. If attachment: Encrypt file (encryptBinary)
   ↓
5. Upload encrypted file to server
   ↓
6. Send encrypted message to API
   ↓
7. Server stores encrypted data in database
   ↓
8. Server updates conversation.lastMessageAt
   ↓
9. User B receives message
   ↓
10. Client decrypts message (decryptText)
   ↓
11. Message displayed in chat
```

### 12.3 Profile Claim Flow

```
1. Influencer finds CSV match during registration
   ↓
2. User selects matching CSV record
   ↓
3. User enters claim reason
   ↓
4. User uploads proof documents
   ↓
5. Files uploaded to /public/uploads
   ↓
6. Claim created in claims-store.json
   ↓
7. Status: "pending"
   ↓
8. Admin reviews claim
   ↓
9a. If approved: Account created from registration data
   ↓
9b. If rejected: Claim status updated, user notified
```

---

## 13. Important Code Patterns

### 13.1 Error Handling Pattern

```typescript
try {
  // Operation
  const result = await someAsyncOperation();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Operation failed', details: error.message },
    { status: 500 }
  );
}
```
- Always wrap async operations in try-catch
- Log errors for debugging
- Return user-friendly error messages

### 13.2 Authentication Check Pattern

```typescript
const session = await auth.api.getSession({ headers: request.headers });
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
- Check session before protected operations
- Return 401 if not authenticated

### 13.3 Database Query Pattern

```typescript
const results = await db
  .select()
  .from(table)
  .where(condition)
  .orderBy(desc(table.createdAt))
  .limit(limit)
  .offset(offset);
```
- Use Drizzle ORM for type-safe queries
- Chain methods for readability
- Always use pagination for large datasets

---

## 14. Demo Preparation Checklist

### Technical Understanding:
- [ ] Understand encryption algorithm (AES-256-GCM, PBKDF2)
- [ ] Understand recommendation scoring system
- [ ] Understand search algorithm (substring matching)
- [ ] Understand database schema and relationships
- [ ] Understand API endpoint structure

### Key Features to Demo:
- [ ] User registration with CSV matching
- [ ] Profile claim submission and approval
- [ ] Encrypted messaging (text, images, voice)
- [ ] Recommendation engine with filters
- [ ] Search functionality
- [ ] Admin panel (user management, claims)

### Common Questions to Prepare For:
1. **Why file-based claims store instead of database?**
   - Simple for development, easy to inspect, can migrate later

2. **How does encryption work?**
   - AES-256-GCM with PBKDF2 key derivation, unique key per conversation

3. **How does recommendation engine work?**
   - Rule-based scoring with weighted components (category 30%, audience 25%, etc.)

4. **Why SQLite instead of PostgreSQL?**
   - Simpler for development, embedded (no server needed), can migrate to PostgreSQL for production

5. **How do you handle backward compatibility?**
   - `isEncrypted()` heuristic detects encrypted vs plain text, displays accordingly

---

## 15. Project Startup Instructions

To start the development server:

```bash
npm run dev
```

This will:
1. Start Next.js development server
2. Enable Turbopack for faster builds
3. Server runs on http://localhost:3000
4. Hot reload enabled (changes reflect immediately)

**Environment Variables Required**:
- `CHAT_ENCRYPTION_SECRET`: Master encryption secret (base64 string)

**Database**:
- SQLite database file: `local.db`
- Migrations in `drizzle/` folder
- Run migrations automatically on first start

---

## 16. Potential Demo/Defense Questions

This section contains comprehensive questions that might be asked during your project demo and defense. Review these questions and prepare answers based on the documentation above.

---

### 16.1 Architecture & Design Questions

**Q1: What type of architecture does your project use?**
- **Answer**: Full-Stack Monolithic Architecture with Client-Server Pattern. Three-tier architecture: Presentation Layer (React), Application Layer (API Routes), and Data Layer (SQLite + File Storage). See Section 2.1 for detailed explanation.

**Q2: Why did you choose Next.js over other frameworks?**
- **Answer**: Next.js provides full-stack capabilities in one framework, server-side rendering for better performance, file-based routing for intuitive structure, API routes for backend logic, and excellent TypeScript support. It simplifies development by combining frontend and backend.

**Q3: Why did you choose SQLite instead of PostgreSQL or MySQL?**
- **Answer**: SQLite is embedded (no separate server needed), simpler for development and deployment, sufficient for our current scale, and can easily migrate to PostgreSQL for production if needed. It's perfect for MVP and small-to-medium applications.

**Q4: Why is your architecture monolithic instead of microservices?**
- **Answer**: Monolithic architecture is simpler for development, easier to maintain with one codebase, sufficient for our current scale, reduces deployment complexity, and can be split into microservices later if the application grows. It's the right choice for MVP.

**Q5: How do you handle separation of concerns in your architecture?**
- **Answer**: Clear separation between client (React components, UI logic) and server (API routes, business logic). Client handles encryption and UI, server handles validation, database operations, and sensitive operations. TypeScript ensures type safety across layers.

**Q6: What design patterns did you use in this project?**
- **Answer**: MVC-like pattern (Model: Database schema, View: React components, Controller: API routes), Client-Server pattern, File-based routing pattern, and Component-based architecture for UI.

---

### 16.2 Encryption & Security Questions

**Q7: How does your encryption system work?**
- **Answer**: We use AES-256-GCM (authenticated encryption) with PBKDF2 key derivation. Each conversation has a unique key derived from a master secret and conversation ID. Messages are encrypted on the client before sending, stored encrypted in the database, and decrypted on the receiver's client. See Section 10 for details.

**Q8: What is AES-256-GCM and why did you choose it?**
- **Answer**: AES-256-GCM is an authenticated encryption algorithm that provides both confidentiality (encryption) and integrity (authentication tag). It's industry-standard, secure, and prevents tampering. The 256-bit key provides strong security.

**Q9: What is PBKDF2 and why is it used?**
- **Answer**: PBKDF2 (Password-Based Key Derivation Function 2) derives encryption keys from a master secret. We use 100,000 iterations to make brute-force attacks computationally expensive. It ensures each conversation has a unique, consistent key.

**Q10: What is an AuthTag (Authentication Tag)?**
- **Answer**: AuthTag is a 16-byte cryptographic tag generated by AES-GCM that ensures data integrity. If encrypted data is modified, the AuthTag verification fails during decryption, preventing tampering. See Section 10 for detailed explanation.

**Q11: How do you ensure backward compatibility with old unencrypted messages?**
- **Answer**: We use an `isEncrypted()` heuristic that checks if data starts with the encryption prefix. If encrypted, we decrypt it. If not, we display it as plain text. This allows old messages to remain readable while new messages are encrypted.

**Q12: Where is the encryption key stored?**
- **Answer**: The master secret (`CHAT_ENCRYPTION_SECRET`) is stored in environment variables on the server. It's never exposed to the client directly. The client fetches it via an authenticated API endpoint. Conversation keys are derived on-the-fly and never stored.

**Q13: How do you handle encryption for different file types (images, videos, PDFs)?**
- **Answer**: All files are converted to binary (ArrayBuffer), encrypted using `encryptBinary()`, then uploaded. The encrypted file is saved with `.enc` extension. On download, files are decrypted and converted back to their original format using Blob URLs.

**Q14: What happens if someone intercepts an encrypted message?**
- **Answer**: Without the encryption key (derived from master secret + conversation ID), the attacker cannot decrypt the message. Even if they have the master secret, they need the specific conversation ID. The AuthTag ensures data hasn't been tampered with.

**Q15: Why encrypt on the client side instead of only on the server?**
- **Answer**: Client-side encryption ensures end-to-end security. Even if the server is compromised, messages remain encrypted. The server never sees plain text, providing true end-to-end encryption similar to WhatsApp or Signal.

**Q16: How do you prevent key leakage or exposure?**
- **Answer**: Master secret is in environment variables (never in code), API endpoint requires authentication to fetch secret, conversation keys are derived on-the-fly (never stored), and we use secure key derivation with high iteration count.

---

### 16.3 Recommendation Engine Questions

**Q17: How does your recommendation engine work?**
- **Answer**: Rule-based recommendation engine with weighted scoring. It filters influencers based on hard criteria (category match, platform match, follower range), then calculates a weighted score based on category (30%), audience alignment (25%), engagement rate (20%), and other factors. See Section 6.3 for details.

**Q18: Why rule-based instead of machine learning?**
- **Answer**: Rule-based is transparent (explainable), doesn't require training data, provides consistent results, easier to debug and modify, and sufficient for our use case. ML could be added later for personalization.

**Q19: How do you calculate engagement rate?**
- **Answer**: Formula: `(likes + views/10) / followers * 100`. Likes are weighted at 100% (active engagement), views at 10% (passive engagement, easier to get). This prevents inflated engagement rates. See Section 6.3 for detailed explanation.

**Q20: Why divide views by 10 in the engagement formula?**
- **Answer**: Views are passive engagement and much easier to get than likes. Without weighting, views would dominate the formula and give misleading engagement rates. Dividing by 10 normalizes views to be comparable to likes, following industry best practices.

**Q21: How do you match categories between brands and influencers?**
- **Answer**: Advanced fuzzy matching algorithm with multiple levels:
  - **Exact Match (100 points)**: Categories are identical after normalization
  - **High Similarity (70-90 points)**: One category contains the other, score based on overlap ratio
  - **Word-Based Matching (30-100 points)**: Extracts words from categories, matches them with exact/partial/synonym matching
  - **Synonym Matching (50 points)**: Uses a synonym dictionary (e.g., "Beauty" matches "Cosmetics", "Fashion" matches "Style")
  - **Weak Match (20 points)**: First 4 characters match
  - The algorithm normalizes categories, extracts meaningful words, and uses semantic similarity for better matching than simple string comparison.

**Q22: What is audience alignment and how is it calculated?**
- **Answer**: Audience alignment checks compatibility between brand's target audience and influencer's audience. Gender match (+40 points), age range overlap (+10 points), and interests matching (+20 points per match). Higher alignment = better recommendation.

**Q23: How do you handle influencers with missing data (no engagement metrics)?**
- **Answer**: Missing data is handled gracefully: missing followers = 0 engagement rate, missing categories = 0 category match score, missing audience data = 0 audience alignment. The recommendation engine still works but gives lower scores.

**Q24: Can brands customize the recommendation weights?**
- **Answer**: Currently, weights are fixed (category 30%, audience 25%, etc.). This could be a future enhancement to allow brands to prioritize what matters most to them (e.g., engagement over category).

**Q25: How do you ensure recommendations are fair and not biased?**
- **Answer**: Rule-based system uses objective criteria (engagement rate, follower count, category match). No personal data or demographics are used for bias. All influencers are evaluated using the same criteria.

---

### 16.4 Database & Data Management Questions

**Q26: Why did you use Drizzle ORM instead of Prisma or TypeORM?**
- **Answer**: Drizzle is lightweight, has excellent TypeScript support, provides type-safe queries, works well with SQLite, and has a simple API. It's perfect for our use case and doesn't add unnecessary complexity.

**Q27: How do you handle database migrations?**
- **Answer**: Drizzle Kit generates migration files in `drizzle/` folder. Migrations are SQL files that modify the schema. We run migrations automatically on application start or manually using Drizzle commands.

**Q28: Why store profile claims in a JSON file instead of the database?**
- **Answer**: Claims are temporary (pending approval), simpler for development (easy to inspect), can be migrated to database later, and reduces database complexity. For production, we'd move to database for better querying.

**Q29: How do you handle file storage?**
- **Answer**: Files are stored in `public/uploads/` directory. Encrypted files have `.enc` extension. Original filenames and types are stored in the database. Files are served statically, and decryption happens on the client side.

**Q30: What is the database schema structure?**
- **Answer**: Main tables: `user` (accounts), `session` (authentication), `influencerProfiles` (influencer data), `conversations` (chat threads), `messages` (encrypted messages), `notifications` (user notifications). See Section 7 for complete schema.

**Q31: How do you ensure data consistency?**
- **Answer**: Drizzle ORM provides type safety, foreign key constraints in schema, transactions for critical operations, and validation in API routes before database operations.

**Q32: How do you handle CSV data import?**
- **Answer**: Custom CSV parser handles commas in parentheses (e.g., "Name (City, State)"). CSV data is loaded on-demand, matched against user registration, and used to populate influencer profiles upon claim approval.

---

### 16.5 Authentication & Authorization Questions

**Q33: How does user authentication work?**
- **Answer**: Better Auth library handles authentication. Users register with email/password, credentials are hashed with bcrypt, sessions are stored in database, and JWT tokens are used for API authentication. See Section 9 for flow.

**Q34: Why did you choose Better Auth over NextAuth or Auth0?**
- **Answer**: Better Auth is lightweight, has excellent TypeScript support, works seamlessly with Next.js, provides email/password auth out of the box, and is easy to customize for our needs.

**Q35: How do you handle role-based access control (RBAC)?**
- **Answer**: Users have a `userType` field (brand, influencer, admin). Middleware checks user type for route protection. API routes verify user type before allowing operations. Admin routes require admin role.

**Q36: How do you handle user approval workflow?**
- **Answer**: New users have `isApproved=false` by default. Admins can approve users via admin panel. Unapproved users are redirected to a pending approval page. Suspended users (`isSuspended=true`) cannot access the platform.

**Q37: How do you prevent unauthorized access to encrypted messages?**
- **Answer**: API endpoints verify user authentication and conversation membership. Users can only access conversations they're part of. Encryption keys are derived per conversation, so even if someone accesses the database, they can't decrypt without the master secret.

**Q38: How do you handle password security?**
- **Answer**: Passwords are hashed using bcrypt (one-way hashing), never stored in plain text, and validated for strength during registration (minimum length, complexity requirements).

---

### 16.6 API & Backend Questions

**Q39: How are your API endpoints structured?**
- **Answer**: Next.js App Router file-based API routes. Each endpoint is in `app/api/[route]/route.ts`. GET for retrieval, POST for creation, PATCH for updates, DELETE for deletion. See Section 8 for all endpoints.

**Q40: How do you handle API errors and validation?**
- **Answer**: Try-catch blocks in all API routes, validation of input data before processing, meaningful error messages returned to client, HTTP status codes (400 for bad request, 401 for unauthorized, 500 for server errors).

**Q41: How do you handle file uploads?**
- **Answer**: Multipart form data in POST request, files saved to `public/uploads/`, encrypted files saved with `.enc` extension, original filename and type stored in database, file URL returned to client.

**Q42: How do you implement pagination for messages and conversations?**
- **Answer**: API endpoints accept `limit` and `offset` parameters. Database queries use LIMIT and OFFSET. Client requests pages of data, reducing load time and memory usage.

**Q43: How do you handle real-time messaging?**
- **Answer**: Currently, polling (client periodically fetches new messages). For true real-time, we could add WebSockets or Server-Sent Events (SSE). Polling is simpler and sufficient for MVP.

**Q44: How do you ensure API security?**
- **Answer**: Authentication required for all protected endpoints, user authorization checks (users can only access their own data), input validation and sanitization, rate limiting (can be added), and HTTPS in production.

---

### 16.7 Frontend & UI Questions

**Q45: Why did you choose React over Vue or Angular?**
- **Answer**: React has large ecosystem, excellent Next.js integration, component-based architecture, strong TypeScript support, and is widely used in industry. Next.js is built on React.

**Q46: Why Tailwind CSS instead of traditional CSS or CSS-in-JS?**
- **Answer**: Tailwind provides utility-first approach (faster development), consistent design system, smaller bundle size (unused styles removed), and excellent developer experience with IntelliSense.

**Q47: How do you handle state management?**
- **Answer**: React hooks (`useState`, `useEffect`) for component state, React Context for authentication state, API calls for server state. No global state management library (Redux/Zustand) needed for current scale.

**Q48: How do you ensure responsive design?**
- **Answer**: Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`), mobile-first approach, flexible layouts with Flexbox/Grid, and testing on different screen sizes.

**Q49: How do you handle loading states and errors in the UI?**
- **Answer**: Loading spinners during API calls, error messages displayed to users, try-catch blocks with error handling, and fallback UI for empty states.

**Q50: Why shadcn/ui components?**
- **Answer**: Accessible components out of the box, customizable (copy code to project), built on Radix UI primitives, and consistent design system.

---

### 16.8 Search & Filtering Questions

**Q51: How does your search algorithm work?**
- **Answer**: Substring matching with priority: exact name match first, then email match, then partial name match. Multi-word queries match all words. Case-insensitive search. See `src/lib/search-utils.ts` for implementation.

**Q52: Why substring matching instead of full-text search?**
- **Answer**: Simpler implementation, sufficient for our use case, works with SQLite (no full-text search extension needed), and provides good user experience for name/email searches.

**Q53: How do you handle search performance with large datasets?**
- **Answer**: Database indexes on name and email fields, client-side filtering after initial fetch, and pagination to limit results. For very large datasets, we'd implement server-side search with database queries.

**Q54: How do you filter influencers by multiple criteria simultaneously?**
- **Answer**: Client-side filtering applies all selected filters (category, platform, follower range, location) sequentially. Each filter narrows down the results. All filters must match for an influencer to appear.

**Q55: How do you handle special characters in search (commas, parentheses)?**
- **Answer**: Search is case-insensitive and handles special characters in names. CSV parser specifically handles commas in parentheses (e.g., "Name (City, State)") to avoid parsing errors.

---

### 16.9 Profile Claims & Admin Questions

**Q56: How does the profile claim system work?**
- **Answer**: Influencers register and check if their profile exists in CSV data. If found, they submit a claim with proof documents (ID, social media proof). Admin reviews and approves/rejects. Upon approval, account is created and profile populated from CSV. See Section 4.3 for flow.

**Q57: Why require proof documents for profile claims?**
- **Answer**: Prevents impersonation, verifies influencer identity, ensures only legitimate influencers claim profiles, and maintains platform integrity.

**Q58: How do admins review profile claims?**
- **Answer**: Admin panel shows all pending claims with submitted documents. Admins can view proof, verify against CSV data, and approve or reject with a reason. Approved claims trigger automatic account creation.

**Q59: What happens if multiple users claim the same profile?**
- **Answer**: First approved claim gets the profile. Subsequent claims for the same profile would be rejected. This could be enhanced to show a warning or queue system.

**Q60: How do you prevent duplicate profile claims?**
- **Answer**: Claims are stored with user ID and profile identifier. System checks if a claim already exists for a user-profile combination before creating a new claim.

---

### 16.10 Testing & Quality Assurance Questions

**Q61: What testing did you perform?**
- **Answer**: Manual testing of all features (registration, login, messaging, encryption, recommendations), encryption/decryption verification scripts, backward compatibility testing, and cross-browser testing.

**Q62: How do you test encryption?**
- **Answer**: Created test scripts (`scripts/test-encryption.ts`) that verify encryption/decryption works correctly, test different data types (text, binary), and verify backward compatibility with unencrypted messages.

**Q63: How do you ensure encryption works for all file types?**
- **Answer**: Tested with text files, images (JPG, PNG), videos, PDFs, and voice notes. All file types are converted to binary, encrypted, and decrypted successfully. Blob URLs are used for display.

**Q64: Did you write unit tests?**
- **Answer**: Manual testing and verification scripts. Unit tests could be added using Jest or Vitest for automated testing. For production, we'd implement comprehensive unit and integration tests.

**Q65: How do you handle edge cases?**
- **Answer**: Input validation in API routes, error handling with try-catch blocks, graceful degradation (missing data handled), and user-friendly error messages.

---

### 16.11 Performance & Scalability Questions

**Q66: How do you handle performance with large datasets?**
- **Answer**: Pagination for messages and conversations, database indexes on frequently queried fields, client-side filtering for small datasets, and efficient database queries with Drizzle ORM.

**Q67: What are the scalability limitations of your current architecture?**
- **Answer**: SQLite has limitations for very high concurrency, file storage in `public/uploads` won't scale for millions of files, and single server deployment. Solutions: migrate to PostgreSQL, use cloud storage (S3), and horizontal scaling with load balancer.

**Q68: How would you scale this application for production?**
- **Answer**: Migrate to PostgreSQL for database, use cloud storage (AWS S3) for files, implement caching (Redis), add CDN for static assets, use WebSockets for real-time messaging, and implement horizontal scaling with multiple servers.

**Q69: How do you optimize database queries?**
- **Answer**: Database indexes on foreign keys and frequently searched fields (name, email), efficient JOIN queries, pagination to limit results, and avoiding N+1 queries by fetching related data in single queries.

**Q70: How do you handle concurrent users?**
- **Answer**: SQLite handles moderate concurrency. For high concurrency, we'd migrate to PostgreSQL which supports better concurrent access. Better Auth handles session management for multiple users.

---

### 16.12 Project-Specific Questions

**Q71: What problem does your project solve?**
- **Answer**: Connects brands with influencers for marketing campaigns. Provides discovery, recommendation, secure messaging, and profile verification. Streamlines the influencer marketing process.

**Q72: Who are your target users?**
- **Answer**: Three user types: Brands (looking for influencers), Influencers (looking for brand partnerships), and Admins (platform management).

**Q73: What makes your platform unique?**
- **Answer**: End-to-end encrypted messaging, rule-based recommendation engine, profile claim system with CSV integration, and comprehensive admin panel.

**Q74: What are the main features of your platform?**
- **Answer**: User registration and authentication, influencer/brand discovery with search and filters, recommendation engine, encrypted messaging with file attachments, profile claims system, admin panel for user and claim management, and role-specific dashboards.

**Q75: How do you ensure data privacy?**
- **Answer**: End-to-end encryption for messages, authentication required for all data access, users can only access their own conversations, and encrypted file storage.

**Q76: What technologies did you learn while building this project?**
- **Answer**: Next.js App Router, TypeScript, Drizzle ORM, Web Crypto API, AES-GCM encryption, PBKDF2 key derivation, Better Auth, Tailwind CSS, and file-based routing.

**Q77: What challenges did you face during development?**
- **Answer**: Implementing client-server compatible encryption, handling backward compatibility with unencrypted messages, parsing CSV with special characters, implementing recommendation scoring algorithm, and ensuring type safety with TypeScript.

**Q78: What would you improve if you had more time?**
- **Answer**: Add unit and integration tests, implement WebSockets for real-time messaging, migrate to PostgreSQL for production, add machine learning for personalized recommendations, implement rate limiting, and add comprehensive error logging.

**Q79: How do you handle errors and exceptions?**
- **Answer**: Try-catch blocks in all API routes, error messages returned to client, logging errors to console (could add proper logging service), and user-friendly error messages in UI.

**Q80: What is the future scope of this project?**
- **Answer**: Machine learning for recommendations, real-time messaging with WebSockets, mobile app (React Native), payment integration for campaigns, analytics dashboard for brands, and social media integration for automatic profile updates.

---

### 16.13 Technical Deep-Dive Questions

**Q81: Explain the encryption key derivation process step by step.**
- **Answer**: 1) Master secret retrieved from environment variable, 2) Conversation ID combined with master secret, 3) PBKDF2 derives key with 100,000 iterations, 4) Key used for AES-256-GCM encryption, 5) Same process on receiver side derives same key for decryption.

**Q82: How does PBKDF2 key derivation work?**
- **Answer**: PBKDF2 takes a password (master secret), salt (conversation ID), iteration count (100,000), and hash function (SHA-256). It repeatedly hashes the password with the salt to create a derived key. High iteration count makes brute-force attacks computationally expensive.

**Q83: What is the difference between symmetric and asymmetric encryption?**
- **Answer**: Symmetric (AES) uses same key for encryption/decryption (faster, used in our project). Asymmetric (RSA) uses public/private key pairs (slower, used for key exchange). We use symmetric because both parties can derive the same key.

**Q84: How do you ensure message ordering in conversations?**
- **Answer**: Messages have `createdAt` timestamp. Database queries order by `createdAt ASC`. Client displays messages in chronological order. Timestamps ensure correct ordering even with network delays.

**Q85: How do you handle file size limits?**
- **Answer**: Currently no explicit limit (browser/Node.js limits apply). Could add file size validation in upload API (e.g., max 10MB per file) and return error if exceeded.

**Q86: How do you prevent SQL injection attacks?**
- **Answer**: Drizzle ORM uses parameterized queries (prevents SQL injection), input validation in API routes, and type-safe queries with TypeScript.

**Q87: How do you prevent XSS (Cross-Site Scripting) attacks?**
- **Answer**: React automatically escapes content, input sanitization in API routes, and no `dangerouslySetInnerHTML` used (except for trusted content).

**Q88: How do you handle session management?**
- **Answer**: Better Auth manages sessions in database, JWT tokens for API authentication, session expiration, and secure cookie storage.

**Q89: What is the difference between server-side and client-side encryption in your project?**
- **Answer**: Both use same algorithm (AES-256-GCM) but different APIs: Server uses Node.js `crypto` module, client uses Web Crypto API. They're compatible - data encrypted on client can be decrypted on server and vice versa (though we encrypt on client for E2EE).

**Q90: How do you ensure type safety across client and server?**
- **Answer**: TypeScript provides type checking, shared types between client/server, Drizzle ORM generates types from schema, and API routes have typed request/response.

---

### 16.14 Algorithm & Logic Questions

**Q91: Walk through how a brand gets recommendations for influencers.**
- **Answer**: 1) Brand selects campaign criteria (category, audience, budget), 2) Recommendation engine fetches all influencers, 3) Hard filters applied (category, platform, follower range), 4) Weighted scoring calculated for each influencer, 5) Results sorted by score descending, 6) Top influencers returned to brand.

**Q92: How do you calculate the weighted recommendation score?**
- **Answer**: Category match (30%) + Audience alignment (25%) + Engagement rate (20%) + Engagement quality (20%) + Platform match (10%) + Follower range (5%) + Geographic match (5%) + Budget alignment (2%) + Profile completeness (2%) + Past collaborations (1%) = Total score out of 100.

**Q93: Explain the search algorithm with an example.**
- **Answer**: Search "John Doe": 1) Exact match "John Doe" (highest priority), 2) Email contains "john.doe" (second priority), 3) Name contains "John" AND "Doe" (third priority), 4) Name contains "John" OR "Doe" (lowest priority). Results sorted by match quality.

**Q94: How do you parse follower counts like "1.5M" or "500K"?**
- **Answer**: `parseFollowerCount()` function: removes commas, checks for "M" (multiply by 1,000,000), "K" (multiply by 1,000), or number (use as-is). Example: "1.5M" → 1,500,000, "500K" → 500,000.

**Q95: How do you match categories (exact, partial, word match)?**
- **Answer**: Multi-level fuzzy matching algorithm:
  1. **Exact Match (100 points)**: Categories identical after normalization
  2. **High Similarity (70-90 points)**: One contains the other (e.g., "Fashion" in "Fashion & Lifestyle")
  3. **Word-Based (30-100 points)**: Extracts words, matches with exact/partial/synonym scoring
     - Example: "Fashion & Style" vs "Fashion Blogging" → extracts ["fashion", "style"] and ["fashion", "blogging"] → "fashion" matches → 60+ points
  4. **Synonym Matching (50 points)**: Uses synonym dictionary (e.g., "Beauty" ↔ "Cosmetics", "Fitness" ↔ "Health")
  5. **Weak Match (20 points)**: First 4 characters match
  - Algorithm normalizes categories, handles special characters, and uses semantic similarity for better matching.

---

### 16.15 Deployment & Production Questions

**Q96: How would you deploy this application to production?**
- **Answer**: Build Next.js app (`npm run build`), deploy to Vercel/Netlify (Next.js hosting), set environment variables, migrate database to PostgreSQL, use cloud storage (AWS S3) for files, configure HTTPS, and set up monitoring.

**Q97: What environment variables are required?**
- **Answer**: `CHAT_ENCRYPTION_SECRET` (master encryption key), `BETTER_AUTH_SECRET` (session encryption), `DATABASE_URL` (if using external database), and any API keys for third-party services.

**Q98: How do you handle database backups?**
- **Answer**: SQLite file can be backed up by copying `local.db`. For production with PostgreSQL, use automated backups, point-in-time recovery, and regular backup testing.

**Q99: How do you monitor the application in production?**
- **Answer**: Could add error logging (Sentry), performance monitoring (Vercel Analytics), database query monitoring, and user analytics. Currently, console logging for development.

**Q100: What security measures would you add for production?**
- **Answer**: HTTPS only, rate limiting on API routes, CORS configuration, input sanitization, security headers (CSP, XSS protection), regular security audits, and dependency updates.

---

## Tips for Answering Questions

1. **Be Honest**: If you don't know something, admit it and explain how you would find out or implement it.

2. **Reference the Code**: Point to specific files or sections when explaining concepts.

3. **Show Understanding**: Explain the "why" behind decisions, not just the "what".

4. **Be Concise**: Answer directly, then provide details if asked.

5. **Use Examples**: Concrete examples make explanations clearer.

6. **Acknowledge Limitations**: It's okay to mention what could be improved or what you'd do differently.

7. **Demonstrate Learning**: Show what you learned and how you solved problems.

---

This completes the comprehensive project documentation with potential demo/defense questions. Review these questions and prepare answers based on your project implementation!

