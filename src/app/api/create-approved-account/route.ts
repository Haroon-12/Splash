import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account, influencerProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
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

// Function to get CSV data
function getCSVData(): CSVInfluencer[] {
  try {
    const csvPath = path.join(process.cwd(), 'influencers.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const records = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      return record as CSVInfluencer;
    });
    
    return records;
  } catch (error) {
    console.error('Error reading CSV file:', error);
    return [];
  }
}

// Function to find CSV data for a user
function findCSVDataForUser(email: string, name: string): CSVInfluencer | null {
  const csvData = getCSVData();
  
  // Try to find by email first
  if (email) {
    const emailMatch = csvData.find(record => 
      record.Email && record.Email.toLowerCase().includes(email.toLowerCase())
    );
    if (emailMatch) return emailMatch;
  }
  
  // Try to find by name
  if (name) {
    const nameMatch = csvData.find(record => {
      if (!record.Name) return false;
      const csvName = record.Name.toLowerCase().trim();
      const searchName = name.toLowerCase().trim();
      
      // Exact match
      if (csvName === searchName) return true;
      
      // Partial match
      if (csvName.includes(searchName) || searchName.includes(csvName)) return true;
      
      // Word-by-word matching
      const csvWords = csvName.split(/\s+/);
      const searchWords = searchName.split(/\s+/);
      
      const significantCsvWords = csvWords.filter(word => word.length > 1);
      const significantSearchWords = searchWords.filter(word => word.length > 1);
      
      return significantCsvWords.some(csvWord => 
        significantSearchWords.some(searchWord => 
          csvWord.includes(searchWord) || searchWord.includes(csvWord)
        )
      );
    });
    if (nameMatch) return nameMatch;
  }
  
  return null;
}

// Create account for approved claim using stored registration data
export async function POST(request: NextRequest) {
  try {
    console.log('API called');
    const { registrationData } = await request.json();
    console.log('Registration data received:', registrationData);

    if (!registrationData || !registrationData.email || !registrationData.password || !registrationData.name) {
      return NextResponse.json({ 
        error: 'Registration data (email, password, name) is required' 
      }, { status: 400 });
    }

    console.log('Creating account for approved claim:', registrationData);

    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, registrationData.email),
    });

    if (existingUser) {
      return NextResponse.json({
        error: 'User already exists with this email'
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);

    // Create user account
    const newUser = await db.insert(user).values({
      email: registrationData.email,
      name: registrationData.name,
      userType: registrationData.userType,
      isApproved: true, // Auto-approve since admin approved the claim
    }).returning();

    if (newUser.length === 0) {
      throw new Error('Failed to create user');
    }

    const userId = newUser[0].id;

    // Create account record
    await db.insert(account).values({
      userId: userId,
      password: hashedPassword,
    });

    // Find CSV data for this user
    const csvData = findCSVDataForUser(registrationData.email, registrationData.name);
    
    if (csvData && registrationData.userType === 'influencer') {
      // Create influencer profile with CSV data
      await db.insert(influencerProfiles).values({
        id: userId,
        category: csvData.Category || null,
        instagram: csvData.Instagram || null,
        youtube: csvData.YouTube || null,
        facebook: csvData.Facebook || null,
        tiktok: csvData.TikTok || null,
        imageUrl: csvData.ImageURL || null,
        description: csvData.Description || null,
        notes: csvData.Notes || null,
        previousBrands: csvData.Previous_Brands || null,
        gender: csvData.Gender || null,
        activeHours: csvData.Active_Hours || null,
        images: csvData.Images || null,
        instagramFollowers: csvData.Instagram_Followers || null,
        instagramLikes: csvData.Instagram_Likes || null,
        instagramViews: csvData.Instagram_Views || null,
        youtubeFollowers: csvData.YouTube_Followers || null,
        youtubeLikes: csvData.YouTube_Likes || null,
        youtubeViews: csvData.YouTube_Views || null,
        facebookFollowers: csvData.Facebook_Followers || null,
        facebookLikes: csvData.Facebook_Likes || null,
        facebookViews: csvData.Facebook_Views || null,
        tiktokFollowers: csvData.TikTok_Followers || null,
        tiktokLikes: csvData.TikTok_Likes || null,
        tiktokViews: csvData.TikTok_Views || null,
        profileCompleteness: 100, // High completeness since we have CSV data
        lastProfileUpdate: new Date(),
      });
      
      console.log('Created influencer profile with CSV data for:', registrationData.name);
    } else if (registrationData.userType === 'influencer') {
      // Create basic influencer profile without CSV data
      await db.insert(influencerProfiles).values({
        id: userId,
        profileCompleteness: 0,
        lastProfileUpdate: new Date(),
      });
      
      console.log('Created basic influencer profile for:', registrationData.name);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: userId,
        email: registrationData.email,
        name: registrationData.name,
        userType: registrationData.userType,
        hasCSVData: !!csvData
      }
    });

  } catch (error) {
    console.error('Error creating account for approved claim:', error);
    return NextResponse.json({
      error: 'Failed to create account for approved claim',
      details: error.message
    }, { status: 500 });
  }
}
