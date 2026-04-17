# Technology Stack & Dependencies

## Overview
Complete breakdown of every technology and library used in the Splash platform.

---

## Core Framework

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.3.5 | Full-stack React framework (App Router) |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Turbopack** | (built-in) | Dev server bundler (`next dev --turbopack`) |

---

## Database & ORM

| Technology | Version | Purpose |
|---|---|---|
| **SQLite** | - | File-based relational database (`local.db`) |
| **better-sqlite3** | 12.4.1 | SQLite driver for Node.js |
| **Drizzle ORM** | 0.44.5 | Type-safe SQL query builder |
| **Drizzle Kit** | 0.31.4 | Migration tooling |

---

## Authentication

| Technology | Version | Purpose |
|---|---|---|
| **better-auth** | 1.3.10 | Auth framework (email/password, sessions) |
| **bcrypt** | 6.0.0 | Password hashing |
| **bcryptjs** | 3.0.2 | JS fallback for password hashing |

---

## AI & Machine Learning

| Technology | Version | Purpose |
|---|---|---|
| **@xenova/transformers** | 2.17.2 | ML model inference in Node.js (embeddings) |
| **Replicate** | 1.4.0 | Cloud AI API for image generation |
| **@google/genai** | 1.43.0 | Google Generative AI SDK |

---

## UI Components & Styling

| Technology | Version | Purpose |
|---|---|---|
| **Radix UI** | Various | Headless UI primitives (Dialog, Select, Tabs, etc.) |
| **shadcn/ui** | - | Pre-built components on top of Radix |
| **Framer Motion** | 12.23.12 | Animation library |
| **lucide-react** | 0.544.0 | Icon set |
| **Recharts** | 3.0.2 | Chart/graph library |
| **sonner** | 2.0.6 | Toast notification library |
| **class-variance-authority** | 0.7.1 | Component variant management |
| **clsx** | 2.1.1 | Class name composition |
| **tailwind-merge** | 3.3.1 | Tailwind class conflict resolution |
| **next-themes** | 0.4.6 | Dark/light theme toggle |
| **cmdk** | 1.1.1 | Command palette component |

---

## Data Processing

| Technology | Version | Purpose |
|---|---|---|
| **csv-parse** | 5.6.0 | CSV file parsing |
| **date-fns** | 4.1.0 | Date utility functions |
| **zod** | 4.1.8 | Schema validation |
| **react-hook-form** | 7.60.0 | Form state management |

---

## Advanced UI / Visual

| Technology | Version | Purpose |
|---|---|---|
| **Three.js** | 0.178.0 | 3D rendering (landing page visuals) |
| **@react-three/fiber** | 9.0.0-alpha | React Three.js bindings |
| **@react-three/drei** | 10.4.4 | Three.js helpers |
| **three-globe** | 2.43.0 | 3D globe component |
| **cobe** | 0.6.4 | Globe animation |
| **tsparticles** | 3.8.1 | Particle effects |
| **Swiper** | 12.0.1 | Touch slider/carousel |
| **embla-carousel** | 8.6.0 | Carousel component |
| **react-fast-marquee** | 1.6.5 | Marquee animation |
| **react-syntax-highlighter** | 15.6.1 | Code highlighting |
| **input-otp** | 1.4.2 | OTP input field |
| **vaul** | 1.1.2 | Drawer component |

---

## Email & Communication

| Technology | Version | Purpose |
|---|---|---|
| **nodemailer** | 7.0.9 | Email sending (password resets, notifications) |

---

## Payment (Planned)

| Technology | Version | Purpose |
|---|---|---|
| **Stripe** | 18.5.0 | Payment processing (dependency installed, not fully implemented) |

---

## Encryption

| Technology | Purpose |
|---|---|
| **Node.js crypto** | AES-256-GCM encryption/decryption |
| **PBKDF2** | Key derivation from shared secret |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Database connection string |
| `BETTER_AUTH_SECRET` | Auth session signing secret |
| `CHAT_ENCRYPTION_SECRET` | AES-256-GCM encryption master key |
| `REPLICATE_API_TOKEN` | Replicate AI API access token |
| `NEXTAUTH_URL` | Base URL for internal API calls |

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run seed:admin` | Seed initial admin user |
