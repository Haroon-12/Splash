# AI Recommendation Engine

## Overview
The platform features an AI-powered recommendation engine that uses **vector embeddings** and **cosine similarity** to match influencers with campaigns and products. This enables intelligent discovery — brands get influencer suggestions for their campaigns, and influencers see relevant campaign opportunities.

---

## Files Involved

| File | Purpose |
|---|---|
| `src/lib/recommendation-engine.ts` | Core engine (~42KB) — scoring algorithms, cosine similarity, weighted matching |
| `src/lib/embeddings.ts` | Vector embedding generation using Xenova Transformers |
| `src/app/api/recommendations/campaign/[campaignId]/route.ts` | API — get influencer recommendations for a campaign |
| `src/app/api/recommendations/product/[productId]/route.ts` | API — get influencer recommendations for a product |
| `src/app/api/recommendations/browse/route.ts` | API — general browse recommendations |
| `src/app/dashboard/products/recommend/page.tsx` | UI — product recommendation page |

---

## Embedding System — `src/lib/embeddings.ts`

### Technology
- **Model:** `@xenova/transformers` (Xenova) — runs transformer models in Node.js
- **Embedding Model:** `all-MiniLM-L6-v2` — produces 384-dimensional dense vectors
- **Purpose:** Convert text descriptions into numerical vectors for similarity comparison

### How Embeddings Are Created
1. Text is assembled from entity fields (e.g., campaign title + description + category)
2. Text passed to `pipeline('feature-extraction', 'all-MiniLM-L6-v2')`
3. Returns 384-float array (the embedding vector)
4. Stored as JSON string in the database `embedding` column

### Where Embeddings Are Stored
- `influencerProfiles.embedding` — based on category + description + previousBrands + socials
- `campaigns.embedding` — based on title + description + category + objectives
- `products.embedding` — based on name + description + category + features

---

## Recommendation Engine — `src/lib/recommendation-engine.ts`

### Core Algorithm: Cosine Similarity
```
similarity(A, B) = (A · B) / (||A|| × ||B||)
```
- Returns value between -1 and 1
- 1 = identical, 0 = unrelated, -1 = opposite

### Recommendation Types

#### 1. Campaign → Influencer Matching
Given a campaign, find the best matching influencers.

**Scoring factors (weighted):**
- **Embedding similarity** (40%) — cosine similarity between campaign and influencer embeddings
- **Category match** (25%) — exact or partial category name match
- **Platform overlap** (15%) — does the influencer have the required platforms?
- **Follower range** (10%) — is the influencer's following within the campaign's target range?
- **Engagement rate** (10%) — estimated engagement quality

#### 2. Product → Influencer Matching
Given a product, find influencers who would best promote it.

**Scoring factors:**
- **Embedding similarity** (40%) — product description vs influencer profile
- **Category alignment** (25%) — product category vs influencer category
- **Audience overlap** (20%) — product target audience vs influencer demographics
- **Brand fit** (15%) — influencer's preferred brands and content style

#### 3. Influencer → Campaign Matching
Given an influencer, find campaigns they should apply to.

- Reverse of campaign→influencer matching
- Same scoring algorithm but from the influencer's perspective

### Score Normalization
- Final scores normalized to 0-100 range
- Results sorted by score descending
- Minimum threshold: typically 20+ to be included in results

---

## API Endpoints

### Campaign Recommendations — `/api/recommendations/campaign/[campaignId]`
- GET request with campaign ID
- Fetches campaign data and its embedding
- Compares against all influencer profiles with embeddings
- Returns top N matches with scores and match reasons

### Product Recommendations — `/api/recommendations/product/[productId]`
- GET request with product ID
- Fetches product and its embedding
- Matches against influencer embeddings
- Returns scored influencer recommendations

### Browse Recommendations — `/api/recommendations/browse`
- GET request (uses session user context)
- For brands: recommends influencers based on brand profile
- For influencers: recommends campaigns based on influencer profile

---

## Product Recommendation Page — `src/app/dashboard/products/recommend/page.tsx`

### What It Does
- Brand selects or creates a product
- System generates recommendations for best-matching influencers
- Results shown as ranked cards with match percentage
- Click to view influencer profile from recommendations (navigates with `?from=product-recommendations`)

---

## Products System

### Database Table — `products`
- id, brandId, name, description, category, targetAudience, priceRange, features, useCases, brandValues, imageUrl, website, embedding, embeddingText

### API — `/api/products`
- GET — list products for the logged-in brand
- POST — create new product (auto-generates embedding)
