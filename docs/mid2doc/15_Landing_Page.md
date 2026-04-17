# Landing Page & Public Components

## Overview
The public-facing landing page at `/` showcases the platform's value proposition with animated sections, feature highlights, testimonials, and a call-to-action. It redirects authenticated users to the dashboard.

---

## Files Involved

| File | Purpose |
|---|---|
| `src/app/page.tsx` | Root page — redirects to `/login` |
| `src/app/layout.tsx` | Root layout — HTML structure, fonts, theme provider, Toaster |
| `src/app/global.css` | Global styles — Tailwind base, custom variables, animations |
| `src/components/Header.tsx` | Landing page header/nav bar |
| `src/components/HeroSection.tsx` | Hero section with animated text and CTA buttons |
| `src/components/FeaturesSection.tsx` | Feature cards grid |
| `src/components/HowItWorksSection.tsx` | Step-by-step process explanation |
| `src/components/TestimonialsSection.tsx` | User testimonial carousel |
| `src/components/CTASection.tsx` | Final call-to-action section |
| `src/components/Footer.tsx` | Page footer with links and info |
| `src/components/AccountModal.tsx` | Account type selection modal |
| `src/components/ErrorReporter.tsx` | Global error boundary reporter |

---

## Root Layout — `src/app/layout.tsx`

### What It Does
- Sets up HTML with `<html lang="en">` and dark/light theme support via `next-themes`
- Imports global CSS (`global.css`)
- Wraps entire app in `<ThemeProvider>`
- Includes `<Toaster />` from `sonner` for toast notifications
- Sets metadata: title, description for SEO

---

## Root Page — `src/app/page.tsx`

- Simple redirect: authenticated users go to `/dashboard`, others to `/login`

---

## Landing Page Components

### Header — `Header.tsx`
- Logo + navigation links
- "Login" and "Get Started" CTA buttons
- Responsive: hamburger menu on mobile
- Animated entrance with Framer Motion

### Hero Section — `HeroSection.tsx`
- Large headline with animated text
- Subtitle describing the platform
- Two CTA buttons: "Get Started" and "Learn More"
- Animated visual elements (particles, gradients)
- Responsive layout: stacked on mobile, side-by-side on desktop

### Features Section — `FeaturesSection.tsx`
- Grid of feature cards (4-6 cards)
- Each card: icon, title, description
- Features: Influencer Discovery, AI Ad Generation, Campaign Management, Analytics, E2E Encrypted Chat, Smart Recommendations
- Framer Motion staggered entrance animation

### How It Works — `HowItWorksSection.tsx`
- 3-4 step process:
  1. Sign Up & Create Profile
  2. Discover & Connect
  3. Collaborate & Create
  4. Track & Grow
- Step numbers with connecting lines
- Animated entrance per step

### Testimonials — `TestimonialsSection.tsx`
- Carousel of user testimonials
- Each testimonial: quote, name, role, avatar
- Auto-scroll or manual navigation

### CTA Section — `CTASection.tsx`
- Final call-to-action before footer
- "Join Splash Today" message
- Registration button
- Background gradient/animation

### Footer — `Footer.tsx`
- Platform logo and tagline
- Link groups: Platform, Company, Legal, Support
- Social media links
- Copyright notice

---

## Global Styles — `src/app/global.css`

### What's Defined
- Tailwind CSS v4 imports (`@tailwind base`, `@tailwind components`, `@tailwind utilities`)
- CSS custom properties for theme colors (primary, accent, background, foreground, etc.)
- Dark mode overrides using `[data-theme="dark"]`
- Custom scrollbar styles
- Glassmorphism utilities
- Animation keyframes
- Typography overrides
- Responsive breakpoint utilities
