import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, influencerProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Interface for CSV influencer data
interface CSVInfluencer {
  Name: string;
  Category: string;
  Instagram: string;
  YouTube: string;
  Facebook: string;
  TikTok: string;
  ImageURL: string;
  Notes: string;
  Instagram_Followers: string;
  Instagram_Likes: string;
  Instagram_Views: string;
  YouTube_Followers: string;
  YouTube_Likes: string;
  YouTube_Views: string;
  Facebook_Followers: string;
  Facebook_Likes: string;
  Facebook_Views: string;
  TikTok_Followers: string;
  TikTok_Likes: string;
  TikTok_Views: string;
  Description: string;
  Previous_Brands: string;
  Gender: string;
  Email: string;
  Active_Hours: string;
  Images: string;
}

// Function to read and parse CSV data
function getCSVData(): CSVInfluencer[] {
  try {
    const csvPath = path.join(process.cwd(), 'influencers.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Simple CSV parsing
    const lines = csvContent.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('#'));

    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const record: any = {};
      headers.forEach((header: string, index: number) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }

    return records as CSVInfluencer[];
  } catch (error) {
    console.error('Error reading CSV file:', error);
    return [];
  }
}

// Get all influencers with account status (CSV + Database users)
export async function GET() {
  try {
    const csvData = getCSVData();

    // Get all users from database
    const users = await db.query.user.findMany({
      where: eq(user.userType, 'influencer'),
    });

    // Helper to normalize strings strictly (alphanumeric only)
    const normalize = (str: string | null | undefined) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // We will build `dbInfluencers` first so we can check the CSV against the fully formed DB objects
    // Add ALL database users (both those in CSV and those not in CSV)
    const dbInfluencers = await Promise.all(users.map(async (user) => {
      // Fetch profile details from influencer_profiles table
      const profile = await db.query.influencerProfiles.findFirst({
        where: eq(influencerProfiles.id, user.id),
      });

      return {
        csvRecordId: `db-${user.id}`,
        name: user.name || 'Unknown',
        email: user.email,
        category: profile?.category || 'Content Creator', // Use profile category or default
        instagram: profile?.instagram || null,
        youtube: profile?.youtube || null,
        facebook: profile?.facebook || null,
        tiktok: profile?.tiktok || null,
        imageUrl: profile?.imageUrl || null,
        description: profile?.description || `${user.name} is a content creator on our platform. They have an account and can be contacted for collaborations. Click to view their profile and connect!`,
        previousBrands: profile?.previousBrands || null,
        gender: profile?.gender || null,
        activeHours: profile?.activeHours || null,
        images: profile?.images || null,
        notes: profile?.notes || `${user.name} is an active user on our platform. Contact them for collaboration opportunities.`,

        // Preferences & Advanced fields
        preferredBrands: profile?.preferredBrands || null,
        contentPreferences: profile?.contentPreferences || null,
        geographicReach: profile?.geographicReach || null,
        portfolioSamples: profile?.portfolioSamples || null,
        rateCard: profile?.rateCard || null,
        availability: profile?.availability || null,
        verificationBadges: profile?.verificationBadges || null,

        // Social media metrics from profile
        instagramFollowers: profile?.instagramFollowers || null,
        instagramLikes: profile?.instagramLikes || null,
        instagramViews: profile?.instagramViews || null,
        youtubeFollowers: profile?.youtubeFollowers || null,
        youtubeLikes: profile?.youtubeLikes || null,
        youtubeViews: profile?.youtubeViews || null,
        facebookFollowers: profile?.facebookFollowers || null,
        facebookLikes: profile?.facebookLikes || null,
        facebookViews: profile?.facebookViews || null,
        tiktokFollowers: profile?.tiktokFollowers || null,
        tiktokLikes: profile?.tiktokLikes || null,
        tiktokViews: profile?.tiktokViews || null,

        // Account status
        hasAccount: true,
        userId: user.id,
        isApproved: user.isApproved || false,
        dataSource: 'database', // Mark as database data
      };
    }));

    // Deduplicate logic logic: A CSV record is a duplicate of a DB record if:
    // 1. Emails match exactly
    // OR 2. Social handles match exactly
    // OR 3. Normalized Full Names match EXACTLY
    const isDuplicate = (csvRecord: any) => {
      const csvName = normalize(csvRecord.Name);
      const csvEmail = normalize(csvRecord.Email);
      const csvIg = normalize(csvRecord.Instagram);
      const csvYt = normalize(csvRecord.YouTube);
      const csvTk = normalize(csvRecord.TikTok);

      return dbInfluencers.some(dbRecord => {
        const dbName = normalize(dbRecord.name);
        const dbEmail = normalize(dbRecord.email);
        const dbIg = normalize(dbRecord.instagram);
        const dbYt = normalize(dbRecord.youtube);
        const dbTk = normalize(dbRecord.tiktok);

        // Exact match on full name means it's the exact same person
        if (csvName && dbName && csvName === dbName) return true;
        // Exact match on email 
        if (csvEmail && dbEmail && csvEmail === dbEmail) return true;
        // Exact match on handles
        if (csvIg && dbIg && csvIg === dbIg) return true;
        if (csvYt && dbYt && csvYt === dbYt) return true;
        if (csvTk && dbTk && csvTk === dbTk) return true;

        return false;
      });
    };

    // Combine CSV data with account status, but only show CSV entries for users WITHOUT accounts
    const csvInfluencers = csvData
      .filter(csvRecord => !isDuplicate(csvRecord))
      .map(csvRecord => {
        return {
          // CSV data
          csvRecordId: `${csvRecord.Name}-${csvRecord.Email || 'no-email'}`,
          name: csvRecord.Name,
          email: csvRecord.Email || null,
          category: csvRecord.Category,
          instagram: csvRecord.Instagram,
          youtube: csvRecord.YouTube,
          facebook: csvRecord.Facebook,
          tiktok: csvRecord.TikTok,
          imageUrl: csvRecord.ImageURL,
          description: csvRecord.Description,
          previousBrands: csvRecord.Previous_Brands,
          gender: csvRecord.Gender,
          activeHours: csvRecord.Active_Hours,
          images: csvRecord.Images,
          notes: csvRecord.Notes,

          // Social media metrics
          instagramFollowers: csvRecord.Instagram_Followers,
          instagramLikes: csvRecord.Instagram_Likes,
          instagramViews: csvRecord.Instagram_Views,
          youtubeFollowers: csvRecord.YouTube_Followers,
          youtubeLikes: csvRecord.YouTube_Likes,
          youtubeViews: csvRecord.YouTube_Views,
          facebookFollowers: csvRecord.Facebook_Followers,
          facebookLikes: csvRecord.Facebook_Likes,
          facebookViews: csvRecord.Facebook_Views,
          tiktokFollowers: csvRecord.TikTok_Followers,
          tiktokLikes: csvRecord.TikTok_Likes,
          tiktokViews: csvRecord.TikTok_Views,

          // Account status
          hasAccount: false, // CSV-only users don't have accounts
          userId: null,
          isApproved: false,
          dataSource: 'csv', // Mark as CSV data
        };
      });

    // Deduplicate the combined list internally just in case DB or CSV itself has internal duplicates
    const allInfluencers = [...csvInfluencers, ...dbInfluencers];

    // Remove internal duplicates from the final array
    const finalUniqueInfluencers = [];
    const seenNames = new Set<string>();

    for (const influencer of allInfluencers) {
      // Must normalize name so identical spelling but differnt spacing is caught
      const normalizedName = (influencer.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!normalizedName) {
        finalUniqueInfluencers.push(influencer); // Keep it safe if no name
        continue;
      }

      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        finalUniqueInfluencers.push(influencer);
      }
    }

    return NextResponse.json(finalUniqueInfluencers);

  } catch (error) {
    console.error('Error fetching influencers with accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch influencers' }, { status: 500 });
  }
}
