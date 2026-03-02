/**
 * Recommendation Engine
 * 
 * This module provides intelligent matching between brands and influencers
 * based on verified metrics, campaign context, and past collaboration outcomes.
 */

import { db } from '@/db';
import { influencerProfiles, campaigns, products, collaborations, user } from '@/db/schema';
import { eq, and, or, sql, gte, lte } from 'drizzle-orm';
import { getCSVData, csvToProfile } from './csv-loader';

export interface RecommendationScore {
  influencerId: string;
  influencerName: string;
  influencerEmail: string | null;
  matchScore: number; // 0-100
  scoreBreakdown: {
    categoryMatch: number;
    engagementQuality: number;
    audienceAlignment: number;
    pastCollaborations: number;
    profileCompleteness: number;
    followerRange: number;
    platformMatch: number;
    geographicMatch: number;
    budgetAlignment: number;
  };
  influencer: any; // Full influencer profile data
}

export interface CampaignBrief {
  category?: string;
  targetAudience?: any; // JSON object
  budget?: string;
  budgetRange?: { min?: number; max?: number };
  requiredPlatforms?: string[];
  minFollowers?: number;
  maxFollowers?: number;
  minEngagementRate?: number;
  geographicTarget?: string[];
  contentRequirements?: string[];
  objectives?: string[];
}

export interface ProductBrief {
  category: string;
  targetAudience?: any;
  priceRange?: { min?: number; max?: number };
  features?: string[];
  useCases?: string[];
  brandValues?: string[];
}

/**
 * Calculate engagement rate from follower and engagement metrics
 */
function calculateEngagementRate(
  followers: string | null,
  likes: string | null,
  views: string | null
): number {
  if (!followers) return 0;

  const followerCount = parseFollowerCount(followers);
  if (followerCount === 0) return 0;

  const likeCount = parseFollowerCount(likes || '0');
  const viewCount = parseFollowerCount(views || '0');

  // Engagement rate = (likes + views/10) / followers * 100
  // Views are weighted less as they're easier to get
  const engagement = (likeCount + viewCount / 10) / followerCount * 100;
  return Math.min(engagement, 100); // Cap at 100%
}

/**
 * Parse follower count from string (handles K, M suffixes)
 */
function parseFollowerCount(count: string | null): number {
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
 * Calculate total followers across all platforms
 */
function getTotalFollowers(profile: any): number {
  const instagram = parseFollowerCount(profile.instagramFollowers);
  const youtube = parseFollowerCount(profile.youtubeFollowers);
  const facebook = parseFollowerCount(profile.facebookFollowers);
  const tiktok = parseFollowerCount(profile.tiktokFollowers);

  return instagram + youtube + facebook + tiktok;
}

/**
 * Calculate average engagement rate across all platforms
 */
function getAverageEngagementRate(profile: any): number {
  const rates = [];

  if (profile.instagramFollowers) {
    rates.push(calculateEngagementRate(
      profile.instagramFollowers,
      profile.instagramLikes,
      profile.instagramViews
    ));
  }

  if (profile.youtubeFollowers) {
    rates.push(calculateEngagementRate(
      profile.youtubeFollowers,
      profile.youtubeLikes,
      profile.youtubeViews
    ));
  }

  if (profile.tiktokFollowers) {
    rates.push(calculateEngagementRate(
      profile.tiktokFollowers,
      profile.tiktokLikes,
      profile.tiktokViews
    ));
  }

  if (profile.facebookFollowers) {
    rates.push(calculateEngagementRate(
      profile.facebookFollowers,
      profile.facebookLikes,
      profile.facebookViews
    ));
  }

  if (rates.length === 0) return 0;
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

/**
 * Category synonyms and related terms for better matching
 */
const categorySynonyms: Record<string, string[]> = {
  'fashion': ['style', 'clothing', 'apparel', 'wardrobe', 'outfit', 'fashionista', 'fashionable', 'menswear', 'womenswear'],
  'beauty': ['cosmetics', 'makeup', 'skincare', 'cosmetic', 'grooming', 'haircare', 'fragrance'],
  'lifestyle': ['wellness', 'wellbeing', 'productivity', 'habits', 'minimalism'],
  'fitness': ['health', 'workout', 'exercise', 'gym', 'training', 'athletic', 'sports', 'bodybuilding', 'yoga', 'crossfit'],
  'food': ['cooking', 'recipe', 'cuisine', 'culinary', 'restaurant', 'dining', 'gastronomy', 'baking', 'nutrition'],
  'travel': ['tourism', 'adventure', 'exploration', 'vacation', 'trip', 'journey', 'wanderlust', 'hotel'],
  'technology': ['tech', 'gadgets', 'electronics', 'innovation', 'software', 'hardware', 'reviews', 'crypto', 'web3', 'programming', 'coding'],
  'gaming': ['games', 'video games', 'esports', 'gamer', 'streaming', 'twitch', 'playstation', 'xbox', 'nintendo'],
  'music': ['musician', 'singer', 'artist', 'audio', 'sound', 'song', 'producer', 'dj'],
  'photography': ['photo', 'photographer', 'camera', 'visual', 'images', 'pictures', 'videography', 'filmmaking'],
  'education': ['learning', 'teaching', 'academic', 'study', 'knowledge', 'tutorial', 'course', 'university'],
  'business': ['entrepreneur', 'startup', 'commerce', 'finance', 'investment', 'corporate', 'marketing', 'sales'],
  'parenting': ['family', 'kids', 'children', 'mom', 'dad', 'parent', 'motherhood', 'fatherhood'],
  'comedy': ['humor', 'funny', 'entertainment', 'comic', 'jokes', 'standup', 'sketch'],
  'diy': ['craft', 'handmade', 'creative', 'artisan', 'homemade', 'projects', 'woodworking', 'crafting'],
  'automotive': ['cars', 'vehicle', 'auto', 'driving', 'automobile', 'motorcycle', 'racing'],
  'pets': ['animals', 'dogs', 'cats', 'pet care', 'animal', 'veterinary'],
  'home decor': ['interior', 'decoration', 'furniture', 'design', 'home improvement', 'renovation', 'architecture'],
};

/**
 * Normalize category string (remove special chars, trim, lowercase)
 */
function normalizeCategory(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[&,\/]/g, ' ') // Replace &, comma, and slash with space
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/[^\w\s]/g, '') // Remove other special characters
    .trim();
}

/**
 * Extract words from category string
 */
function extractWords(category: string): string[] {
  const normalized = normalizeCategory(category);
  return normalized.split(/\s+/).filter(word => word.length > 2); // Filter out short words
}

/**
 * Check if categories share common words
 */
function hasCommonWords(words1: string[], words2: string[]): boolean {
  return words1.some(word1 => words2.some(word2 =>
    word1 === word2 ||
    (word1.length > 4 && word2.length > 4 && (word1.startsWith(word2) || word2.startsWith(word1)))
  ));
}

/**
 * Check if a word matches any synonym
 */
function matchesSynonym(word: string, targetCategory: string): boolean {
  const targetLower = normalizeCategory(targetCategory);

  // Create a helper to check strict word matching (equals or plural/singular variation)
  const isStrictMatch = (w1: string, w2: string) => {
    if (w1 === w2) return true;
    // Basic plural/singular check (e.g., cosmetic/cosmetics)
    if (w1.length > 3 && w2.length > 3) {
      if (w1 + 's' === w2 || w2 + 's' === w1) return true;
      if (w1 + 'es' === w2 || w2 + 'es' === w1) return true;
      if (w1.endsWith('y') && w2.endsWith('ies') && w1.slice(0, -1) === w2.slice(0, -3)) return true;
      if (w2.endsWith('y') && w1.endsWith('ies') && w2.slice(0, -1) === w1.slice(0, -3)) return true;
    }
    return false;
  };

  const synonyms = categorySynonyms[targetLower] || [];

  // Check direct match
  if (synonyms.some(syn => isStrictMatch(syn, word))) {
    return true;
  }

  // Check if word matches any synonym of target category
  for (const [key, values] of Object.entries(categorySynonyms)) {
    if (values.some(syn => isStrictMatch(syn, word))) {
      if (isStrictMatch(key, targetLower)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate word-based similarity score
 */
function calculateWordSimilarity(words1: string[], words2: string[]): number {
  if (words1.length === 0 || words2.length === 0) return 0;

  let matches = 0;
  let totalWords = Math.max(words1.length, words2.length);

  // Helper for strict matching
  const isStrictMatch = (w1: string, w2: string) => {
    if (w1 === w2) return true;
    if (w1.length > 3 && w2.length > 3) {
      if (w1 + 's' === w2 || w2 + 's' === w1) return true;
      if (w1 + 'es' === w2 || w2 + 'es' === w1) return true;
      if (w1.endsWith('y') && w2.endsWith('ies') && w1.slice(0, -1) === w2.slice(0, -3)) return true;
      if (w2.endsWith('y') && w1.endsWith('ies') && w2.slice(0, -1) === w1.slice(0, -3)) return true;
    }
    return false;
  };

  for (const word1 of words1) {
    for (const word2 of words2) {
      if (isStrictMatch(word1, word2)) {
        matches += 2; // Exact word match
      } else if (matchesSynonym(word1, word2) || matchesSynonym(word2, word1)) {
        matches += 1.5; // Synonym match
      }
    }
  }

  // Calculate percentage based on matches
  return Math.min(100, (matches / (totalWords * 2)) * 100);
}

/**
 * Check if two categories match with improved fuzzy matching
 */
function categoryMatch(category1: string | null, category2: string | null): number {
  if (!category1 || !category2) return 0;

  const cat1Norm = normalizeCategory(category1);
  const cat2Norm = normalizeCategory(category2);

  // 1. Exact match (after normalization)
  if (cat1Norm === cat2Norm) {
    return 100;
  }

  // Helper for strict matching
  const isStrictMatch = (w1: string, w2: string) => {
    if (w1 === w2) return true;
    if (w1.length > 3 && w2.length > 3) {
      if (w1 + 's' === w2 || w2 + 's' === w1) return true;
      if (w1 + 'es' === w2 || w2 + 'es' === w1) return true;
      if (w1.endsWith('y') && w2.endsWith('ies') && w1.slice(0, -1) === w2.slice(0, -3)) return true;
      if (w2.endsWith('y') && w1.endsWith('ies') && w2.slice(0, -1) === w1.slice(0, -3)) return true;
    }
    return false;
  };

  // 2. Word-based matching
  const words1 = extractWords(category1);
  const words2 = extractWords(category2);

  if (words1.length === 0 || words2.length === 0) {
    return 0; // Strict: No words extracted means no match. Do not fallback to dangerous substrings.
  }

  // Check if all words from shorter category are found in longer
  const shorterWords = words1.length <= words2.length ? words1 : words2;
  const longerWords = words1.length > words2.length ? words1 : words2;

  let exactWordMatches = 0;
  let synonymMatches = 0;

  for (const shortWord of shorterWords) {
    for (const longWord of longerWords) {
      if (isStrictMatch(shortWord, longWord)) {
        exactWordMatches++;
        break;
      } else if (matchesSynonym(shortWord, longWord) || matchesSynonym(longWord, shortWord)) {
        synonymMatches++;
        break;
      }
    }
  }

  const totalMatches = exactWordMatches + synonymMatches;

  if (totalMatches > 0) {
    // We have at least one valid word/synonym match. 
    // If we matched all words in the shorter category, it's a very strong match.
    if (totalMatches === shorterWords.length) {
      return 100;
    }
    // Partial word matching (e.g. "Tech & Gaming" vs just "Tech")
    const matchRatio = totalMatches / longerWords.length;
    return Math.max(50, Math.round(matchRatio * 100));
  }

  // 3. Category Synonym Dictionary Group Check
  for (const [key, synonyms] of Object.entries(categorySynonyms)) {
    const cat1HasKey = words1.some(w => isStrictMatch(w, key)) || words1.some(w => synonyms.some(syn => isStrictMatch(w, syn)));
    const cat2HasKey = words2.some(w => isStrictMatch(w, key)) || words2.some(w => synonyms.some(syn => isStrictMatch(w, syn)));

    if (cat1HasKey && cat2HasKey) {
      return 80; // Both categories fall squarely into the same synonym mapping
    }
  }

  return 0; // Strict: Return 0 if no clear semantic overlap
}

/**
 * Check audience alignment (gender, age, interests)
 */
function audienceAlignment(
  targetAudience: any,
  profile: any
): number {
  if (!targetAudience) return 50; // Neutral if no target audience specified

  let score = 50;
  let factors = 0;

  // Gender matching - CRITICAL for products like makeup
  if (targetAudience.gender) {
    factors++;
    const targetGender = targetAudience.gender.toLowerCase();
    const profileGender = (profile.gender || '').toLowerCase();

    if (targetGender === profileGender) {
      score += 40; // Strong match
    } else if (targetGender === 'all' || targetGender === 'any') {
      score += 20; // Neutral
    } else {
      // Mismatch - heavily penalize
      // For makeup, beauty, skincare - should match gender
      score -= 30;
    }
  }

  // Age range matching
  if (targetAudience.ageRange) {
    factors++;
    // This is a simplified check - in production, you'd parse age ranges
    score += 10; // Neutral for now
  }

  // Interests matching
  if (targetAudience.interests && Array.isArray(targetAudience.interests)) {
    factors++;
    try {
      const profilePrefs = profile.contentPreferences
        ? JSON.parse(profile.contentPreferences)
        : [];

      if (Array.isArray(profilePrefs)) {
        const matchingInterests = targetAudience.interests.filter((interest: string) =>
          profilePrefs.some((pref: string) =>
            pref.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(pref.toLowerCase())
          )
        );

        if (matchingInterests.length > 0) {
          score += (matchingInterests.length / targetAudience.interests.length) * 20;
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Normalize score
  if (factors > 0) {
    return Math.max(0, Math.min(100, score));
  }

  return 50;
}

/**
 * Check if product category suggests gender-specific matching
 */
function isGenderSpecificProduct(category: string, name: string, description: string): boolean {
  const text = `${category} ${name} ${description}`.toLowerCase();

  // Keywords that suggest gender-specific products
  const genderSpecificKeywords = [
    'makeup', 'cosmetic', 'beauty', 'skincare', 'lipstick', 'mascara', 'foundation',
    'blush', 'eyeshadow', 'nail polish', 'perfume', 'cologne', 'men\'s', 'women\'s',
    'bra', 'lingerie', 'shaving', 'razor', 'beard', 'menstrual', 'tampon', 'pad'
  ];

  return genderSpecificKeywords.some(keyword => text.includes(keyword));
}

/**
 * Check if platforms match
 */
function platformMatch(requiredPlatforms: string[] | undefined, profile: any): number {
  if (!requiredPlatforms || requiredPlatforms.length === 0) return 100; // No requirement = match

  const profilePlatforms: string[] = [];
  if (profile.instagram) profilePlatforms.push('instagram');
  if (profile.youtube) profilePlatforms.push('youtube');
  if (profile.facebook) profilePlatforms.push('facebook');
  if (profile.tiktok) profilePlatforms.push('tiktok');

  if (profilePlatforms.length === 0) return 0;

  const matchingPlatforms = requiredPlatforms.filter(req =>
    profilePlatforms.some(prof => prof.toLowerCase() === req.toLowerCase())
  );

  return (matchingPlatforms.length / requiredPlatforms.length) * 100;
}

/**
 * Check if follower count is within range
 */
function followerRangeMatch(
  minFollowers: number | undefined,
  maxFollowers: number | undefined,
  profile: any
): number {
  const totalFollowers = getTotalFollowers(profile);

  if (totalFollowers === 0) return 50; // Neutral score if no follower data

  if (minFollowers && totalFollowers < minFollowers) return 0;
  if (maxFollowers && totalFollowers > maxFollowers) return 0;

  // If within range, calculate how well it fits
  if (minFollowers && maxFollowers) {
    const range = maxFollowers - minFollowers;
    const position = (totalFollowers - minFollowers) / range;
    // Prefer middle of range
    const distanceFromCenter = Math.abs(position - 0.5);
    return (1 - distanceFromCenter * 2) * 100;
  }

  return 100;
}

/**
 * Check engagement rate match
 */
function engagementRateMatch(
  minEngagementRate: number | undefined,
  profile: any
): number {
  if (!minEngagementRate) return 100;

  const avgEngagement = getAverageEngagementRate(profile);
  if (avgEngagement >= minEngagementRate) return 100;

  // Partial credit if close
  const ratio = avgEngagement / minEngagementRate;
  return Math.max(0, ratio * 80);
}

/**
 * Check geographic match
 */
function geographicMatch(
  targetLocations: string[] | undefined,
  profile: any
): number {
  if (!targetLocations || targetLocations.length === 0) return 100;

  try {
    const profileReach = profile.geographicReach
      ? JSON.parse(profile.geographicReach)
      : [];

    if (!Array.isArray(profileReach) || profileReach.length === 0) return 50;

    const matching = targetLocations.filter(target =>
      profileReach.some((reach: string) =>
        reach.toLowerCase().includes(target.toLowerCase()) ||
        target.toLowerCase().includes(reach.toLowerCase())
      )
    );

    return (matching.length / targetLocations.length) * 100;
  } catch {
    return 50;
  }
}

/**
 * Check budget alignment (based on rate card)
 */
function budgetAlignment(
  budgetRange: { min?: number; max?: number } | undefined,
  profile: any
): number {
  if (!budgetRange) return 100;

  try {
    const rateCard = profile.rateCard ? JSON.parse(profile.rateCard) : null;
    if (!rateCard || !rateCard.baseRate) return 50;

    const baseRate = parseFloat(rateCard.baseRate) || 0;

    if (budgetRange.min && baseRate < budgetRange.min) return 0;
    if (budgetRange.max && baseRate > budgetRange.max) return 0;

    return 100;
  } catch {
    return 50;
  }
}

/**
 * Get past collaboration success score
 */
async function getPastCollaborationScore(
  brandId: string,
  influencerId: string
): Promise<number> {
  try {
    const pastCollabs = await db
      .select()
      .from(collaborations)
      .where(
        and(
          eq(collaborations.brandId, brandId),
          eq(collaborations.influencerId, influencerId),
          eq(collaborations.status, 'completed')
        )
      );

    if (pastCollabs.length === 0) return 50; // Neutral if no past collaborations

    // Calculate average rating
    const ratings = pastCollabs
      .map(c => c.rating)
      .filter((r): r is number => r !== null && r !== undefined);

    if (ratings.length === 0) return 50;

    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return (avgRating / 5) * 100; // Convert 1-5 rating to 0-100 score
  } catch {
    return 50;
  }
}

/**
 * Main recommendation function for campaigns
 */
export async function recommendInfluencersForCampaign(
  campaignId: number,
  brandId: string,
  limit: number = 20
): Promise<RecommendationScore[]> {
  // Get campaign details
  const campaignResults = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  const campaign = campaignResults[0];

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Build campaign brief
  const brief: CampaignBrief = {
    category: campaign.category || undefined,
    targetAudience: campaign.targetAudience ? JSON.parse(campaign.targetAudience) : undefined,
    budget: campaign.budget || undefined,
    budgetRange: campaign.budgetRange ? JSON.parse(campaign.budgetRange) : undefined,
    requiredPlatforms: campaign.requiredPlatforms ? JSON.parse(campaign.requiredPlatforms) : undefined,
    minFollowers: campaign.minFollowers || undefined,
    maxFollowers: campaign.maxFollowers || undefined,
    minEngagementRate: campaign.minEngagementRate ? parseFloat(campaign.minEngagementRate) : undefined,
    geographicTarget: campaign.geographicTarget ? JSON.parse(campaign.geographicTarget) : undefined,
    contentRequirements: campaign.contentRequirements ? JSON.parse(campaign.contentRequirements) : undefined,
    objectives: campaign.objectives ? JSON.parse(campaign.objectives) : undefined,
  };

  // Check if campaign is gender-specific based on category
  const isGenderSpecific = campaign.category ?
    ['Beauty & Skincare', 'Fashion & Lifestyle'].includes(campaign.category) : false;

  return recommendInfluencersWithRules(brief, brandId, isGenderSpecific, limit);
}

/**
 * Main recommendation function for products
 */
export async function recommendInfluencersForProduct(
  productId: number,
  brandId: string,
  limit: number = 20
): Promise<RecommendationScore[]> {
  // Get product details
  const productResults = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  const product = productResults[0];

  if (!product) {
    throw new Error('Product not found');
  }

  // Parse target audience
  const targetAudience = product.targetAudience
    ? JSON.parse(product.targetAudience)
    : null;

  // Check if product is gender-specific
  const isGenderSpecific = isGenderSpecificProduct(
    product.category,
    product.name,
    product.description
  );

  // Build product brief
  const brief: CampaignBrief = {
    category: product.category || undefined,
    targetAudience: targetAudience,
    budgetRange: product.priceRange ? JSON.parse(product.priceRange) : undefined,
  };

  return recommendInfluencersWithRules(
    brief,
    brandId,
    isGenderSpecific,
    limit
  );
}

/**
 * Core recommendation algorithm with AI embeddings
 */
/**
 * Get all influencers (database + CSV) for recommendation processing
 */
async function getAllInfluencers() {
  // Get all approved influencers from database
  const dbInfluencers = await db
    .select({
      user: user,
      profile: influencerProfiles
    })
    .from(user)
    .leftJoin(influencerProfiles, eq(user.id, influencerProfiles.id))
    .where(
      and(
        eq(user.userType, 'influencer'),
        eq(user.isApproved, true)
      )
    );

  // Extract just the user objects for the rest of the existing code
  const dbUsers = dbInfluencers.map(row => row.user);

  // Get all CSV influencers
  const csvData = getCSVData();
  const csvProfiles = csvData.map(csvToProfile);

  // Helper to normalize strings strictly (alphanumeric only)
  const normalize = (str: string | null | undefined) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Create sets for deduplication
  const dbEmails = new Set(dbUsers.map(u => (u.email || '').toLowerCase().trim()).filter(Boolean));
  const dbNames = new Set(dbUsers.map(u => normalize(u.name)).filter(Boolean));

  const dbInstagrams = new Set(dbInfluencers.map(row => normalize(row.profile?.instagram)).filter(Boolean));
  const dbYouTubes = new Set(dbInfluencers.map(row => normalize(row.profile?.youtube)).filter(Boolean));
  const dbTikToks = new Set(dbInfluencers.map(row => normalize(row.profile?.tiktok)).filter(Boolean));

  // Filter CSV profiles to exclude those with database accounts
  const csvOnlyProfiles = csvProfiles.filter(profile => {
    // 1. Check Email
    const email = (profile.email || '').toLowerCase().trim();
    if (email && dbEmails.has(email)) return false;

    // 2. Check Name (Strict Normalized)
    const name = normalize(profile.name);
    if (name && dbNames.has(name)) return false;

    // 3. Check Social Handles (Strict Normalized)
    const instagram = normalize(profile.instagram);
    if (instagram && dbInstagrams.has(instagram)) return false;

    const youtube = normalize(profile.youtube);
    if (youtube && dbYouTubes.has(youtube)) return false;

    const tiktok = normalize(profile.tiktok);
    if (tiktok && dbTikToks.has(tiktok)) return false;

    return true; // Keep if no match found
  });

  return { dbInfluencers: dbUsers, csvOnlyProfiles };
}

/**
 * Main recommendation function - rule-based scoring system
 */
async function recommendInfluencersWithRules(
  brief: CampaignBrief,
  brandId: string,
  enforceGenderMatch: boolean = false,
  limit: number = 20
): Promise<RecommendationScore[]> {
  const scores: RecommendationScore[] = [];

  const { dbInfluencers, csvOnlyProfiles } = await getAllInfluencers();

  // Process database influencers
  for (const influencer of dbInfluencers) {
    // Get profile for this influencer
    const profileResults = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.id, influencer.id))
      .limit(1);

    const profile = profileResults[0];
    if (!profile) continue;

    const score = await calculateInfluencerScore(
      influencer,
      profile,
      brief,
      brandId,
      enforceGenderMatch
    );

    if (score) {
      scores.push(score);
    }
  }

  // Process CSV influencers
  for (const csvProfile of csvOnlyProfiles) {
    // Create a mock user object for CSV profiles
    const mockUser = {
      id: csvProfile.id,
      name: csvProfile.name,
      email: csvProfile.email,
      userType: 'influencer' as const,
      isApproved: true,
    };

    const score = await calculateInfluencerScore(
      mockUser,
      csvProfile,
      brief,
      brandId,
      enforceGenderMatch
    );

    if (score) {
      scores.push(score);
    }
  }

  // Sort by match score (descending) and return top N
  return scores
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Calculate score for a single influencer using rule-based scoring
 * NO EMBEDDINGS - Pure rule-based matching
 */
async function calculateInfluencerScore(
  influencer: any,
  profile: any,
  brief: CampaignBrief,
  brandId: string,
  enforceGenderMatch: boolean
): Promise<RecommendationScore | null> {

  // Apply hard filters first - skip influencers that don't meet requirements
  // Category filter - use improved categoryMatch function with minimum threshold
  if (brief.category && profile.category) {
    const matchScore = categoryMatch(brief.category, profile.category);

    // Only skip if match score is 0 (completely different categories)
    // Allow any match score > 0 to pass through to scoring phase
    // This ensures "tech" matches "Tech/Reviews", "Technology", etc.
    if (matchScore === 0) {
      return null; // Skip only if completely unrelated
    }
  } else if (brief.category && !profile.category) {
    // If brand specified category but influencer has no category, skip
    return null;
  }

  // Follower range filter - hard filter
  if (brief.minFollowers || brief.maxFollowers) {
    const totalFollowers = getTotalFollowers(profile);
    if (brief.minFollowers && totalFollowers < brief.minFollowers) {
      return null; // Skip if below minimum
    }
    if (brief.maxFollowers && totalFollowers > brief.maxFollowers) {
      return null; // Skip if above maximum
    }
  }

  // Platform filter - hard filter
  if (brief.requiredPlatforms && brief.requiredPlatforms.length > 0) {
    const profilePlatforms: string[] = [];
    if (profile.instagram) profilePlatforms.push('instagram');
    if (profile.youtube) profilePlatforms.push('youtube');
    if (profile.facebook) profilePlatforms.push('facebook');
    if (profile.tiktok) profilePlatforms.push('tiktok');

    // Check if influencer has at least one required platform
    const hasRequiredPlatform = brief.requiredPlatforms.some(req =>
      profilePlatforms.some(prof => prof.toLowerCase() === req.toLowerCase())
    );

    if (!hasRequiredPlatform) {
      return null; // Skip if no required platforms
    }
  }

  // GENDER FILTERING - Critical for products like makeup
  if (enforceGenderMatch && brief.targetAudience?.gender) {
    const targetGender = brief.targetAudience.gender.toLowerCase();
    const profileGender = (profile.gender || '').toLowerCase();

    // Skip if gender doesn't match (unless target is "all" or "any")
    if (targetGender !== 'all' && targetGender !== 'any' && targetGender !== profileGender) {
      return null; // Skip this influencer
    }
  }

  // RULE-BASED SCORING - No embeddings, clear transparent scoring
  // All scores are based on brand-provided details from campaign/product brief

  // 1. Category Match: 30% - Based on brand's category requirement
  const categoryMatchScore = brief.category
    ? categoryMatch(brief.category, profile.category)
    : 50; // Neutral (50) if brand didn't specify category - doesn't penalize

  // 2. Audience Alignment: 25% - Based on brand's target audience (gender, demographics)
  const audienceAlignmentScore = brief.targetAudience
    ? audienceAlignment(brief.targetAudience, profile)
    : 50; // Neutral (50) if brand didn't specify target audience - doesn't penalize

  // 3. Engagement Quality: 20% - Based on brand's min engagement rate OR influencer's quality
  const engagementQuality = getAverageEngagementRate(profile);
  const engagementScore = brief.minEngagementRate
    ? engagementRateMatch(brief.minEngagementRate, profile) // Use brand's requirement
    : Math.min(engagementQuality * 10, 100); // Use influencer's quality if no requirement

  // 4. Platform Match: 10% - Based on brand's required platforms
  const platformMatchScore = brief.requiredPlatforms && brief.requiredPlatforms.length > 0
    ? platformMatch(brief.requiredPlatforms, profile) // Use brand's requirement
    : 100; // Perfect match (100) if brand didn't specify platforms - no requirement to meet

  // 5. Follower Range: 5% - Based on brand's min/max follower requirements
  const followerRangeScore = (brief.minFollowers || brief.maxFollowers)
    ? followerRangeMatch(brief.minFollowers, brief.maxFollowers, profile)
    : 50; // Neutral (50) if brand didn't specify follower range - doesn't penalize

  // 6. Geographic Match: 5% - Based on brand's geographic targeting
  const geographicMatchScore = brief.geographicTarget && brief.geographicTarget.length > 0
    ? geographicMatch(brief.geographicTarget, profile)
    : 50; // Neutral (50) if brand didn't specify geographic target - doesn't penalize

  // 7. Budget Alignment: 2% - Based on brand's budget range
  const budgetAlignmentScore = brief.budgetRange
    ? budgetAlignment(brief.budgetRange, profile)
    : 50; // Neutral (50) if brand didn't specify budget - doesn't penalize

  // 8. Profile Completeness: 2% - Based on influencer's profile (not brand input)
  const profileCompletenessScore = profile.profileCompleteness || (profile.dataSource === 'csv' ? 70 : 0);

  // 9. Past Collaborations: 1% - Based on historical data (not brand input)
  const pastCollaborationsScore = profile.dataSource === 'csv'
    ? 0 // CSV influencers don't have past collaborations in the system
    : await getPastCollaborationScore(brandId, influencer.id);

  // RULE-BASED WEIGHTED COMBINATION
  // Exact weights as specified - all based on brand-provided details
  const weights = {
    categoryMatch: 0.30,        // 30% - From brand's category
    audienceAlignment: 0.25,    // 25% - From brand's target audience
    engagementQuality: 0.20,    // 20% - From brand's engagement requirement or influencer quality
    platformMatch: 0.10,        // 10% - From brand's required platforms
    followerRange: 0.05,        // 5% - From brand's follower range
    geographicMatch: 0.05,      // 5% - From brand's geographic targeting
    budgetAlignment: 0.02,      // 2% - From brand's budget range
    profileCompleteness: 0.02,  // 2% - From influencer profile (not brand input)
    pastCollaborations: 0.01,   // 1% - From historical data (not brand input)
  };

  // Calculate final match score using weighted combination
  // If brand didn't provide a detail, that component contributes 50 (neutral) * weight
  const matchScore =
    categoryMatchScore * weights.categoryMatch +
    audienceAlignmentScore * weights.audienceAlignment +
    engagementScore * weights.engagementQuality +
    platformMatchScore * weights.platformMatch +
    followerRangeScore * weights.followerRange +
    geographicMatchScore * weights.geographicMatch +
    budgetAlignmentScore * weights.budgetAlignment +
    profileCompletenessScore * weights.profileCompleteness +
    pastCollaborationsScore * weights.pastCollaborations;

  return {
    influencerId: influencer.id,
    influencerName: influencer.name,
    influencerEmail: influencer.email,
    matchScore: Math.round(matchScore * 100) / 100,
    scoreBreakdown: {
      categoryMatch: Math.round(categoryMatchScore),
      engagementQuality: Math.round(engagementScore),
      audienceAlignment: Math.round(audienceAlignmentScore),
      pastCollaborations: Math.round(pastCollaborationsScore),
      profileCompleteness: profileCompletenessScore,
      followerRange: Math.round(followerRangeScore),
      platformMatch: brief.requiredPlatforms && brief.requiredPlatforms.length > 0
        ? Math.round(platformMatchScore)
        : -1, // -1 means not applicable
      geographicMatch: Math.round(geographicMatchScore),
      budgetAlignment: Math.round(budgetAlignmentScore),
    },
    influencer: {
      ...influencer,
      profile: profile,
    },
  };
}

/**
 * Core recommendation algorithm - rule-based
 */
export async function recommendInfluencers(
  brief: CampaignBrief,
  brandId: string,
  limit: number = 20
): Promise<RecommendationScore[]> {
  return recommendInfluencersWithRules(brief, brandId, false, limit);
}

/**
 * Recommend influencers for profile claim matching
 * This helps match a user's registration info with CSV records
 */
export async function recommendProfileClaims(
  email: string,
  name: string
): Promise<any[]> {
  // This would typically search CSV data
  // For now, return empty array - this is handled by the CSV matching API
  return [];
}

/**
 * Recommend influencers for general browsing (no specific campaign/product)
 * Uses brand profile and filters to create a smart recommendation
 */
export async function recommendInfluencersForBrowsing(
  brandId: string,
  filters?: {
    category?: string;
    minFollowers?: number;
    maxFollowers?: number;
    platforms?: string[];
    searchQuery?: string; // Add search query support
  },
  limit: number = 100 // Get more results to rank all influencers
): Promise<RecommendationScore[]> {
  // CRITICAL: If there's a search query, we MUST filter FIRST before getting recommendations
  // This ensures only matching influencers are returned

  // Build brief from filters
  const brief: CampaignBrief = {
    category: filters?.category,
    minFollowers: filters?.minFollowers,
    maxFollowers: filters?.maxFollowers,
    requiredPlatforms: filters?.platforms,
  };

  // Get recommendations using rule-based scoring
  let recommendations = await recommendInfluencersWithRules(
    brief,
    brandId,
    false,
    limit * 2 // Get more to filter down
  );

  // Apply additional filtering based on filters
  if (filters?.category || filters?.minFollowers || filters?.maxFollowers || filters?.platforms) {
    recommendations = recommendations.filter(rec => {
      const profile = rec.influencer.profile;
      if (!profile) return false;

      // Category filter - use improved categoryMatch function
      if (filters.category) {
        if (!profile.category) {
          return false; // No category = doesn't match
        }

        const matchScore = categoryMatch(filters.category, profile.category);

        // Only filter out if match score is 0 (completely different)
        if (matchScore === 0) {
          return false;
        }
      }

      // Follower range filter (already applied in main function, but double-check)
      if (filters.minFollowers || filters.maxFollowers) {
        const totalFollowers = getTotalFollowers(profile);
        if (filters.minFollowers && totalFollowers < filters.minFollowers) {
          return false;
        }
        if (filters.maxFollowers && totalFollowers > filters.maxFollowers) {
          return false;
        }
      }

      // Platform filter (already applied in main function, but double-check)
      if (filters.platforms && filters.platforms.length > 0) {
        const profilePlatforms: string[] = [];
        if (profile.instagram) profilePlatforms.push('instagram');
        if (profile.youtube) profilePlatforms.push('youtube');
        if (profile.facebook) profilePlatforms.push('facebook');
        if (profile.tiktok) profilePlatforms.push('tiktok');

        const hasRequiredPlatform = filters.platforms.some(req =>
          profilePlatforms.some(prof => prof.toLowerCase() === req.toLowerCase())
        );

        if (!hasRequiredPlatform) {
          return false;
        }
      }

      return true;
    });
  }

  // CRITICAL: If search query provided, STRICTLY filter FIRST before any ranking
  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const searchQuery = filters.searchQuery.trim().toLowerCase();
    const searchWords = searchQuery.split(/\s+/).filter(w => w.length > 0);

    // ULTRA-STRICT search matching function - only match if query actually appears in text
    // For short queries (< 3 chars), ONLY match name/email
    const matchesSearch = (text: string | null | undefined): boolean => {
      if (!text) return false;
      const textLower = text.toLowerCase().trim();

      // Exact match
      if (textLower === searchQuery) return true;

      // Check if entire query appears as consecutive characters (substring match)
      if (textLower.includes(searchQuery)) return true;

      // For single word queries, require at least 2 characters
      if (searchWords.length === 1) {
        const word = searchWords[0];
        if (word.length < 2) return false;

        // Check if word appears as substring
        if (textLower.includes(word)) return true;

        // Check if word appears as whole word (word boundary)
        try {
          const wordBoundaryRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
          return wordBoundaryRegex.test(textLower);
        } catch (e) {
          return textLower.includes(word);
        }
      }

      // For multiple words, require ALL words to match (AND logic) for strict matching
      // This ensures "john smith" only matches if both "john" AND "smith" appear
      return searchWords.every((word: string) => {
        if (word.length < 2) return true; // Skip very short words (like "a", "an")

        // Check if word appears as substring
        if (textLower.includes(word)) return true;

        // Check if word appears as whole word
        try {
          const wordBoundaryRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
          return wordBoundaryRegex.test(textLower);
        } catch (e) {
          return textLower.includes(word);
        }
      });
    };

    // STRICT FILTERING: Only keep recommendations that match the search
    // For short queries (< 3 chars), ONLY check name and email
    recommendations = recommendations.filter((rec: RecommendationScore) => {
      const profile = rec.influencer.profile;

      // PRIORITY 1: Always check name and email
      const nameMatch = matchesSearch(rec.influencerName);
      const emailMatch = matchesSearch(rec.influencerEmail);

      // If name or email matches, include it
      if (nameMatch || emailMatch) {
        return true;
      }

      // PRIORITY 2: For longer queries (3+ chars), also check other fields
      if (searchQuery.length >= 3 && profile) {
        const categoryMatch = matchesSearch(profile.category);
        const descriptionMatch = matchesSearch(profile.description);
        const previousBrandsMatch = matchesSearch(profile.previousBrands);
        const notesMatch = matchesSearch(profile.notes);

        // Include if any other field matches
        if (categoryMatch || descriptionMatch || previousBrandsMatch || notesMatch) {
          return true;
        }
      }

      // No match - exclude this recommendation
      return false;
    });

    // Now calculate search relevance for the filtered recommendations and sort
    const calculateSearchRelevance = (rec: RecommendationScore): number => {
      const profile = rec.influencer.profile;
      let relevance = 0;

      const nameLower = rec.influencerName.toLowerCase();
      const emailLower = (rec.influencerEmail || '').toLowerCase();

      // Exact name match - highest priority
      if (nameLower === searchQuery) {
        relevance += 10000;
      }
      // Name starts with query
      else if (nameLower.startsWith(searchQuery)) {
        relevance += 5000;
      }
      // Name contains query
      else if (nameLower.includes(searchQuery)) {
        relevance += 2000;
      }
      // All words in name
      else if (searchWords.length > 1 && searchWords.every(w => nameLower.includes(w))) {
        relevance += 1500;
      }
      // Any word in name
      else if (searchWords.some(w => nameLower.includes(w))) {
        relevance += 500;
      }

      // Exact email match
      if (emailLower === searchQuery) {
        relevance += 8000;
      }
      // Email contains query
      else if (emailLower.includes(searchQuery)) {
        relevance += 1000;
      }

      // Category match - only if query is 3+ chars (more specific)
      if (searchQuery.length >= 3 && profile?.category?.toLowerCase().includes(searchQuery)) {
        relevance += 300;
      }

      // Description match - only if query is 3+ chars (more specific)
      if (searchQuery.length >= 3 && profile?.description?.toLowerCase().includes(searchQuery)) {
        relevance += 200;
      }

      return relevance;
    };

    // Calculate relevance and sort the filtered recommendations
    const sortedRecommendations = recommendations
      .map((rec: RecommendationScore) => ({
        ...rec,
        searchRelevance: calculateSearchRelevance(rec),
      }))
      .sort((a: RecommendationScore & { searchRelevance: number }, b: RecommendationScore & { searchRelevance: number }) => {
        // CRITICAL: Sort by search relevance FIRST (highest first)
        // This ensures exact name matches (10000+ relevance) appear at the top
        const relevanceDiff = b.searchRelevance - a.searchRelevance;
        if (relevanceDiff !== 0) {
          return relevanceDiff; // Higher relevance first - exact matches on top
        }

        // If same search relevance, then sort by match score
        const scoreDiff = b.matchScore - a.matchScore;
        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        // Finally, sort by name
        return a.influencerName.localeCompare(b.influencerName);
      })
      .slice(0, limit);

    return sortedRecommendations;
  }

  return recommendations;
}

