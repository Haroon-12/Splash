/**
 * Embedding Service
 * 
 * Generates vector embeddings for semantic similarity matching
 * Uses local transformer model for embeddings (no API required)
 */

import { pipeline, Pipeline } from '@xenova/transformers';

// Cache the pipeline to avoid reloading
let embeddingPipeline: any = null;

/**
 * Initialize the embedding pipeline
 */
async function getEmbeddingPipeline(): Promise<any> {
  if (!embeddingPipeline) {
    // Use a lightweight sentence transformer model
    // This model runs locally and doesn't require API keys
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2', // Lightweight, fast model
      {
        quantized: true, // Use quantized model for faster loading
      }
    );
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getEmbeddingPipeline();
    const result = await pipe(text, { pooling: 'mean', normalize: true });
    
    // Convert tensor to array
    const embedding = Array.from(result.data) as number[];
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return zero vector as fallback
    return new Array(384).fill(0);
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Build text representation for product embedding
 */
export function buildProductText(product: {
  name: string;
  description: string;
  category: string;
  features?: string | null;
  useCases?: string | null;
  targetAudience?: string | null;
}): string {
  const parts: string[] = [];
  
  parts.push(`Product: ${product.name}`);
  parts.push(`Description: ${product.description}`);
  parts.push(`Category: ${product.category}`);
  
  if (product.features) {
    try {
      const features = JSON.parse(product.features);
      if (Array.isArray(features) && features.length > 0) {
        parts.push(`Features: ${features.join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  if (product.useCases) {
    try {
      const useCases = JSON.parse(product.useCases);
      if (Array.isArray(useCases) && useCases.length > 0) {
        parts.push(`Use cases: ${useCases.join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  if (product.targetAudience) {
    try {
      const audience = JSON.parse(product.targetAudience);
      if (audience.gender) {
        parts.push(`Target gender: ${audience.gender}`);
      }
      if (audience.ageRange) {
        parts.push(`Target age: ${audience.ageRange}`);
      }
      if (audience.interests && Array.isArray(audience.interests)) {
        parts.push(`Target interests: ${audience.interests.join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return parts.join('. ');
}

/**
 * Build text representation for influencer embedding
 * Includes name for better semantic matching
 */
export function buildInfluencerText(profile: {
  name?: string | null;
  category?: string | null;
  description?: string | null;
  gender?: string | null;
  contentPreferences?: string | null;
  previousBrands?: string | null;
  preferredBrands?: string | null;
}): string {
  const parts: string[] = [];
  
  // Include name for better matching
  if (profile.name) {
    parts.push(`Influencer name: ${profile.name}`);
  }
  
  if (profile.category) {
    parts.push(`Category: ${profile.category}`);
  }
  
  if (profile.description) {
    parts.push(`Description: ${profile.description}`);
  }
  
  if (profile.gender) {
    parts.push(`Gender: ${profile.gender}`);
  }
  
  if (profile.contentPreferences) {
    try {
      const prefs = JSON.parse(profile.contentPreferences);
      if (Array.isArray(prefs) && prefs.length > 0) {
        parts.push(`Content types: ${prefs.join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  if (profile.previousBrands) {
    parts.push(`Previous collaborations: ${profile.previousBrands}`);
  }
  
  if (profile.preferredBrands) {
    try {
      const brands = JSON.parse(profile.preferredBrands);
      if (Array.isArray(brands) && brands.length > 0) {
        parts.push(`Preferred brands: ${brands.join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return parts.join('. ');
}

/**
 * Build text representation for campaign embedding
 */
export function buildCampaignText(campaign: {
  title: string;
  description: string;
  category: string;
  objectives?: string | null;
  targetAudience?: string | null;
  contentRequirements?: string | null;
}): string {
  const parts: string[] = [];
  
  parts.push(`Campaign: ${campaign.title}`);
  parts.push(`Description: ${campaign.description}`);
  parts.push(`Category: ${campaign.category}`);
  
  if (campaign.objectives) {
    try {
      const objectives = JSON.parse(campaign.objectives);
      if (Array.isArray(objectives) && objectives.length > 0) {
        parts.push(`Objectives: ${objectives.join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  if (campaign.targetAudience) {
    try {
      const audience = JSON.parse(campaign.targetAudience);
      if (audience.gender) {
        parts.push(`Target gender: ${audience.gender}`);
      }
      if (audience.ageRange) {
        parts.push(`Target age: ${audience.ageRange}`);
      }
      if (audience.interests && Array.isArray(audience.interests)) {
        parts.push(`Target interests: ${audience.interests.join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  if (campaign.contentRequirements) {
    try {
      const requirements = JSON.parse(campaign.contentRequirements);
      if (Array.isArray(requirements) && requirements.length > 0) {
        parts.push(`Content requirements: ${requirements.join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return parts.join('. ');
}

