/**
 * Search and Filter Utilities
 * 
 * Provides improved search and filtering functions for influencers
 */

/**
 * Parse follower count from string (handles K, M suffixes)
 */
export function parseFollowerCount(count: string | null | undefined): number {
  if (!count) return 0;
  
  const cleaned = count.toString().trim().replace(/,/g, '');
  const match = cleaned.match(/^([\d.]+)([KMkm]?)$/);
  
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  
  if (suffix === 'K') return value * 1000;
  if (suffix === 'M') return value * 1000000;
  return value;
}

/**
 * Search function - matches consecutive substrings (not single scattered letters)
 * Supports:
 * - Exact matches
 * - Consecutive substring matches (e.g., "john" matches "johnson" or "John Doe")
 * - Multi-word queries (AND logic - all words must match as consecutive substrings)
 * 
 * IMPORTANT: 
 * - Does NOT match single characters - only words (2+ characters)
 * - Matches consecutive characters (substring), not scattered letters
 * - "john" matches "johnson" (consecutive substring) ✓
 * - "john" matches "John Doe" (consecutive substring) ✓
 * - "john" does NOT match "hjon doe" (letters not consecutive) ✗
 */
export function matchesSearch(text: string | null | undefined, query: string): boolean {
  // If text is null/undefined or query is empty/null, no match
  if (!text || !query) return false;
  
  // Trim and normalize
  const textTrimmed = text.trim();
  const queryTrimmed = query.trim();
  
  // If either is empty after trimming, no match
  if (!textTrimmed || !queryTrimmed) return false;
  
  const textLower = textTrimmed.toLowerCase();
  const queryLower = queryTrimmed.toLowerCase();
  
  // Must be at least 2 characters - don't match single characters
  if (queryLower.length < 2) return false;
  
  // Exact match (entire text matches query exactly)
  if (textLower === queryLower) return true;
  
  // For multi-word queries, check if ALL words appear as consecutive substrings
  const queryWords = queryLower.split(/\s+/).filter(w => w.length >= 2); // Only words with 2+ chars
  
  if (queryWords.length > 1) {
    // All words must appear as consecutive substrings in the text
    return queryWords.every(word => textLower.includes(word));
  }
  
  // Single word query - check if it appears as consecutive substring
  // This allows "john" to match "johnson" or "John Doe"
  // This is what the user wants - consecutive substring matching
  return textLower.includes(queryLower);
}

/**
 * Check if influencer matches search query across all relevant fields
 */
export function influencerMatchesSearch(
  influencer: {
    name?: string | null;
    email?: string | null;
    category?: string | null;
    description?: string | null;
    previousBrands?: string | null;
    gender?: string | null;
    notes?: string | null;
  },
  query: string
): boolean {
  if (!query.trim()) return true;
  
  return (
    matchesSearch(influencer.name, query) ||
    matchesSearch(influencer.email, query) ||
    matchesSearch(influencer.category, query) ||
    matchesSearch(influencer.description, query) ||
    matchesSearch(influencer.previousBrands, query) ||
    matchesSearch(influencer.gender, query) ||
    matchesSearch(influencer.notes, query)
  );
}

/**
 * Check if influencer matches category filter
 */
export function matchesCategoryFilter(
  influencerCategory: string | null | undefined,
  filterCategory: string | null | undefined
): boolean {
  if (!filterCategory || filterCategory === "all") return true;
  if (!influencerCategory) return false;
  
  const filterLower = filterCategory.toLowerCase();
  const influencerLower = influencerCategory.toLowerCase();
  
  // Exact match
  if (filterLower === influencerLower) return true;
  
  // Check if filter is contained in influencer category or vice versa
  if (influencerLower.includes(filterLower) || filterLower.includes(influencerLower)) {
    return true;
  }
  
  // Word-based matching
  const filterWords = filterLower.split(/\s+/);
  const influencerWords = influencerLower.split(/\s+/);
  
  // Check if any significant word from filter appears in influencer category
  return filterWords.some(filterWord => 
    influencerWords.some(influencerWord => 
      influencerWord.includes(filterWord) || filterWord.includes(influencerWord)
    )
  );
}

/**
 * Check if influencer matches follower range filter
 */
export function matchesFollowerRange(
  influencer: {
    instagramFollowers?: string | null;
    youtubeFollowers?: string | null;
    facebookFollowers?: string | null;
    tiktokFollowers?: string | null;
  },
  minFollowers?: number | string | null,
  maxFollowers?: number | string | null
): boolean {
  if (!minFollowers && !maxFollowers) return true;
  
  const totalFollowers = 
    parseFollowerCount(influencer.instagramFollowers) +
    parseFollowerCount(influencer.youtubeFollowers) +
    parseFollowerCount(influencer.facebookFollowers) +
    parseFollowerCount(influencer.tiktokFollowers);
  
  const min = typeof minFollowers === 'string' ? parseInt(minFollowers) || 0 : (minFollowers || 0);
  const max = typeof maxFollowers === 'string' ? parseInt(maxFollowers) || Infinity : (maxFollowers || Infinity);
  
  return totalFollowers >= min && totalFollowers <= max;
}

/**
 * Check if influencer matches platform filter
 */
export function matchesPlatformFilter(
  influencer: {
    socials?: {
      instagram?: string | null;
      youtube?: string | null;
      facebook?: string | null;
      tiktok?: string | null;
    };
  },
  requiredPlatforms?: string[]
): boolean {
  if (!requiredPlatforms || requiredPlatforms.length === 0) return true;
  
  const hasPlatform = requiredPlatforms.some(platform => {
    const platformLower = platform.toLowerCase();
    return (
      (platformLower === 'instagram' && influencer.socials?.instagram) ||
      (platformLower === 'youtube' && influencer.socials?.youtube) ||
      (platformLower === 'facebook' && influencer.socials?.facebook) ||
      (platformLower === 'tiktok' && influencer.socials?.tiktok)
    );
  });
  
  return hasPlatform;
}

