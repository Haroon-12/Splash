# Technical Q&A — Platform Implementation Details

This document provides exact file locations and line-by-line explanations for the core technical features of the Splash platform, prepared for the panel presentation.

---

### 1. How is the pipeline for AI Ad Generation configured and where is it implemented?

The ad generation uses a dual pipeline: **Google Gemini** for marketing copy (text) and **Replicate (FLUX model)** for image generation.

- **File:** [src/app/api/generate-ad/route.ts](file:///e:/FYP_IT_1/src/app/api/generate-ad/route.ts)
- **Implementation Details:**
  - **Text Pipeline (Lines 31-68):** Uses `ai.models.generateContent` with the `gemini-1.5-flash` model. It takes the campaign description and style to generate a JSON response containing taglines, a caption, and hashtags.
  - **Image Pipeline (Lines 71-130):** Uses the `replicate.run` method calling the `black-forest-labs/flux-dev` model (Line 99). 
  - **Prompt Engineering (Lines 26-29):** Constructs a descriptive prompt by combining the user's input with quality descriptors like "8k, photorealistic, best quality".
  - **Image Processing (Lines 106-126):** Handles various Replicate return types (URLs or readable streams) to ensure a valid image URL is returned to the frontend.

---

### 2. How are recommendations generated for products and campaigns using embeddings?

The system uses a hybrid approach: **Vector Semantic Similarity** (using embeddings) + **Rule-Based Scoring** (category, followers, platform).

- **Implementation Logic:** [src/lib/recommendation-engine.ts](file:///e:/FYP_IT_1/src/lib/recommendation-engine.ts)
- **Workflow:**
  - **Data Fetching (Lines 722-780):** `getAllInfluencers()` gathers influencers from both the database and the CSV file, deduplicating them to ensure unique results.
  - **Campaign Matching (Lines 628-666):** `recommendInfluencersForCampaign()` parses the campaign requirements (budget, followers, platforms) into a "brief".
  - **Product Matching (Lines 671-714):** `recommendInfluencersForProduct()` specifically checks for gender-specific product categories (Lines 695-699) to ensure high-relevance matches.
  - **Hybrid Scoring (Lines 717-800+):** The `recommendInfluencersWithRules` function calculates a weighted score (from 0-100) based on:
    - **Category Match:** (Lines 298-385) Uses exact match, synonym dictionary, and semantic fallback.
    - **Semantic Similarity:** (Line 365 onwards) Uses vector embeddings to find influencers who "feel" right for the campaign description, even if keywords don't match exactly.

---

### 3. How are profile claims checked against the CSV during creation?

The system performs a priority-based name and email match against the loaded CSV data before allowing a user to claim a profile.

- **File:** [src/app/api/csv-influencers/route.ts](file:///e:/FYP_IT_1/src/app/api/csv-influencers/route.ts)
- **Implementation Details:**
  - **CSV Loading (Lines 40-93):** `getCSVData()` reads `influencers.csv` from the root directory and parses it into structured JavaScript objects.
  - **Matching Logic (Lines 138-154):** 
    - **Priority 1 (Lines 140-143):** Checks for a match between the registration Name and the CSV `Name` field using the `matchesSearch` helper.
    - **Priority 2 (Lines 145-150):** If name doesn't match, it checks if the registration Email matches the CSV `Email` field.
  - **Result Return (Lines 156-187):** Returns `hasMatch: true` if matches are found, along with the full profile details so the user can confirm it is indeed them.

---

### 4. How are conversations and messages encrypted?

We use **End-to-End Encryption (E2EE)** logic where messages are encrypted server-side using **AES-256-GCM** before being saved to the database.

- **File:** [src/lib/encryption.ts](file:///e:/FYP_IT_1/src/lib/encryption.ts)
- **Implementation Details:**
  - **Key Derivation (Lines 32-57):** `deriveConversationKey()` uses **PBKDF2** with 100,000 iterations. It generates a unique key for every conversation based on the participant IDs (sorted to ensure both see the same key) and a server-side secret.
  - **Encryption (Lines 63-98):** `encryptText()` generates a random **IV (Initialization Vector)**, creates a cipher, and produces an **Authentication Tag** (Line 87) to ensure message integrity.
  - **Decryption (Lines 104-141):** `decryptText()` reverses the process. If decryption fails (e.g., for messages sent before encryption was implemented), it returns the raw text as a fallback (Line 139).

---

### 5. How are links tracked and redirected in the Analytics Dashboard?

Tracking uses a **Shortcode Redirect System** that captures metadata before sending the user to their destination.

- **Files:**
  - **Redirect Handler:** [src/app/api/track/[linkId]/route.ts](file:///e:/FYP_IT_1/src/app/api/track/[linkId]/route.ts)
  - **Creation Logic:** [src/app/api/affiliates/route.ts](file:///e:/FYP_IT_1/src/app/api/affiliates/route.ts)
- **Implementation Details:**
  - **Capturing Clicks (Lines 20-45 in track/route.ts):** When the `linkId` (shortcode) is hit, the system extracts the `ipAddress`, `userAgent`, and `referrer`.
  - **Device Detection (Lines 37-41):** Parses the User-Agent to categorize the device (Mobile, Tablet, Desktop).
  - **Data Storage (Lines 47-56):** Saves the event to the `clickEvents` table.
  - **Redirection (Line 58):** Finally, it performs a `NextResponse.redirect(link.destinationUrl)` to send the user to the actual brand website.

---

### 6. Which transformers are used for recommendation embeddings and where is it implemented?

We use the **Xenova Transformers** library to run a locally-hosted NLP model, ensuring privacy and speed without external API costs.

- **File:** [src/lib/embeddings.ts](file:///e:/FYP_IT_1/src/lib/embeddings.ts)
- **Implementation Details:**
  - **Model Choice (Line 22):** Uses the **`Xenova/all-MiniLM-L6-v2`** model. This is a lightweight, high-performance sentence transformer that maps text to a 384-dimensional vector space.
  - **Quantization (Line 24):** Uses `quantized: true` to reduce the model size and memory footprint for faster execution.
  - **Semantic Pipeline (Lines 34-47):** The `generateEmbedding` function uses `pooling: 'mean'` and `normalize: true` to create consistent, high-quality vector representations of influencer bios and campaign descriptions.
  - **Similarity Measurement (Lines 52-71):** `cosineSimilarity()` calculates the dot product of two vectors to determine how "close" they are in semantic meaning.

---

### Additional Questions

#### Q: How is user data secured across different roles?
**A:** We use **Next.js Middleware** ([middleware.ts](file:///e:/FYP_IT_1/middleware.ts)) to intercept every request. It checks the `userType` in the session. If an influencer tries to access `/admin/*` or a brand's private tools, the middleware automatically redirects them back to the dashboard.

#### Q: How does the platform handle large data files like the influencer CSV?
**A:** We implement a **Buffer-based Loader** ([src/lib/csv-loader.ts](file:///e:/FYP_IT_1/src/lib/csv-loader.ts)) that reads the file once and provides helper methods to the rest of the app. This prevents repeated disk I/O and keeps the application responsive.

#### Q: What happens if the AI Ad Generation fails?
**A:** The API has a robust **Fallback System** ([src/app/api/generate-ad/route.ts](file:///e:/FYP_IT_1/src/app/api/generate-ad/route.ts) Lines 46-50 & 73). If the AI models are down or the API key is missing, it provides high-quality placeholder taglines and a default image so the UI doesn't break for the user.
