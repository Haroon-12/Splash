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
 * Check if two categories match
 */
function categoryMatch(category1: string | null, category2: string | null): number {
  if (!category1 || !category2) return 0;
  if (category1.toLowerCase() === category2.toLowerCase()) return 100;
  
  // Partial match (e.g., "Fashion" matches "Fashion & Lifestyle")
  const cat1Lower = category1.toLowerCase();
  const cat2Lower = category2.toLowerCase();
  
  if (cat1Lower.includes(cat2Lower) || cat2Lower.includes(cat1Lower)) {
    return 70;
  }
  
  return 0;
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
    .select()
    .from(user)
    .where(
      and(
        eq(user.userType, 'influencer'),
        eq(user.isApproved, true)
      )
    );
  
  // Get all CSV influencers
  const csvData = getCSVData();
  const csvProfiles = csvData.map(csvToProfile);
  
  // Create a set of emails that have database accounts to avoid duplicates
  const dbEmails = new Set(dbInfluencers.map(u => (u.email || '').toLowerCase()).filter(Boolean));
  
  // Filter CSV profiles to exclude those with database accounts
  const csvOnlyProfiles = csvProfiles.filter(profile => {
    const email = (profile.email || '').toLowerCase();
    return !email || !dbEmails.has(email);
  });
  
  return { dbInfluencers, csvOnlyProfiles };
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
    // Category filter - more flexible matching
    if (brief.category && profile.category) {
      const briefCategory = brief.category.toLowerCase();
      const profileCategory = profile.category.toLowerCase();
      
      // Check for exact or partial match
      const exactMatch = briefCategory === profileCategory;
      const partialMatch = profileCategory.includes(briefCategory) || briefCategory.includes(profileCategory);
      
      // If no exact or partial match, check word-based matching
      if (!exactMatch && !partialMatch) {
        const briefWords = briefCategory.split(/\s+/);
        const profileWords = profileCategory.split(/\s+/);
        const hasCommonWord = briefWords.some((bw: string) => 
          profileWords.some((pw: string) => pw.includes(bw) || bw.includes(pw))
        );
        
        // Skip if completely different categories (no common words)
        if (!hasCommonWord) {
          return null;
        }
      }
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
      
      // Category filter - more flexible matching
      if (filters.category) {
        const filterCategory = filters.category.toLowerCase();
        const profileCategory = (profile.category || '').toLowerCase();
        
        if (!profileCategory) {
          return false; // No category = doesn't match
        }
        
        // Check for exact or partial match
        const exactMatch = filterCategory === profileCategory;
        const partialMatch = profileCategory.includes(filterCategory) || filterCategory.includes(profileCategory);
        
        // If no exact or partial match, check word-based matching
        if (!exactMatch && !partialMatch) {
          const filterWords = filterCategory.split(/\s+/);
          const profileWords = profileCategory.split(/\s+/);
          const hasCommonWord = filterWords.some((fw: string) => 
            profileWords.some((pw: string) => pw.includes(fw) || fw.includes(pw))
          );
          
          // Filter out if completely different categories
          if (!hasCommonWord) {
            return false;
          }
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

