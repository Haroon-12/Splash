# AI Ad Generation

## Overview
Brands can generate marketing ad images with taglines, captions, and hashtags using AI. The system uses the **Replicate API** to generate images from text prompts, and returns accompanying marketing copy.

---

## Files Involved

| File | Purpose |
|---|---|
| `src/app/dashboard/ad-generation/page.tsx` | Frontend — ad generation form & results display |
| `src/app/api/generate-ad/route.ts` | Backend — calls Replicate API, returns image + copy |
| `src/app/ads/page.tsx` | Legacy/alternate ad page (unused) |

---

## Ad Generation Page — `src/app/dashboard/ad-generation/page.tsx`

### Access Control
- **Brand-only** — influencers are redirected to `/dashboard`
- Requires authenticated session

### What It Does
1. User fills out a form with campaign details
2. Clicks "Generate Ad"
3. Backend generates an AI image + marketing copy
4. Results displayed: preview image, taglines, caption, hashtags
5. User can download image or copy text

### Form Fields
- **Campaign Name** — what the ad is for
- **Description** — detailed description of the product/campaign
- **Style** — dropdown (Modern, Minimalist, Bold, Elegant, Playful, etc.)
- **Platform** — target platform (Instagram, YouTube, TikTok, Facebook)
- **Image Prompt** — custom prompt for the AI image generator

### Tab System
- **Text tab** — fill out campaign details for text-to-ad generation
- **Image tab** — (currently hidden/commented out) — image-to-ad feature reserved for future

### Results Display
- Generated image in a preview card
- Array of taglines displayed as badges
- Caption text with copy button
- Hashtags displayed as clickable tags with copy button
- Download button for the generated image

### Technical Details
- Uses `useState` for form state, generation status, results
- File input ref for image upload (hidden feature)
- Loading state with spinner during generation
- Toast notifications for success/error feedback
- Copy-to-clipboard using `navigator.clipboard.writeText()`

---

## Generate Ad API — `src/app/api/generate-ad/route.ts`

### What It Does
- POST endpoint accepting campaign details
- Calls **Replicate API** with the image generation model
- Constructs a prompt from campaign name + description + style + platform
- Returns: `{ imageUrl, taglines[], caption, hashtags[] }`

### Technical Implementation
- Uses `replicate` npm package (v1.4.0)
- API token from `REPLICATE_API_TOKEN` environment variable
- Model: Stable Diffusion variant for ad-quality images
- Prompt engineering: combines user inputs into an optimized prompt
- Taglines, caption, hashtags generated alongside the image
- Error handling: returns 500 with error message on failure

### Environment Variable
```
REPLICATE_API_TOKEN=r8_xxxxx
```

---

## Image-to-Ad Feature (Hidden)
- The code for uploading an image and converting it to an ad exists but is **commented out** in the UI
- The `activeTab` state includes "image" but the tab trigger is hidden
- This was intentionally hidden per user request for future implementation
- The `fileInputRef` and `uploadedImageBase64` state still exist in the component
