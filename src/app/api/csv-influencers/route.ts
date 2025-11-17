import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, influencerProfiles, profileClaims, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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
    
    // Simple CSV parsing - handle the specific format of this CSV
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      return [];
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // For this specific CSV format, we know the structure
      // Name is first field, might contain commas in parentheses
      const values = [];
      let current = '';
      let parenCount = 0;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '(') {
          parenCount++;
        } else if (char === ')') {
          parenCount--;
        } else if (char === ',' && parenCount === 0) {
          values.push(current.trim());
          current = '';
          continue;
        }
        
        current += char;
      }
      values.push(current.trim()); // Add the last value
      
      const record = {};
      headers.forEach((header, index) => {
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

// API endpoint to get all CSV influencers
export async function GET() {
  try {
    const csvData = getCSVData();
    return NextResponse.json(csvData);
  } catch (error) {
    console.error('Error fetching CSV data:', error);
    return NextResponse.json({ error: 'Failed to fetch CSV data' }, { status: 500 });
  }
}

// API endpoint to check if email/name matches CSV data
export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    if (!email && !name) {
      return NextResponse.json({ error: 'Email or name is required' }, { status: 400 });
    }
    
    // First check if account already exists (only if email is provided)
    if (email) {
      try {
        const existingUser = await db.query.user.findFirst({
          where: eq(user.email, email),
        });
        
        if (existingUser) {
          return NextResponse.json({ 
            error: 'An account with this email already exists. Please login instead.',
            existingAccount: true 
          }, { status: 400 });
        }
      } catch (dbError) {
        console.error('Database error checking existing user:', dbError);
        // Continue with CSV matching even if DB check fails
      }
    }
    
    const csvData = getCSVData();
    
    // Find matching records with improved matching logic
    const matches = csvData.filter(record => {
      // Email matching (if email exists in CSV and user provided email)
      const emailMatch = email && record.Email && record.Email.trim() !== '' && 
        record.Email.toLowerCase().includes(email.toLowerCase());
      
      // Name matching with multiple strategies
      let nameMatch = false;
      if (name && record.Name) {
        const csvName = record.Name.toLowerCase().trim();
        const userName = name.toLowerCase().trim();
        
        // Exact match
        if (csvName === userName) {
          nameMatch = true;
        }
        // Partial match (CSV name contains user name)
        else if (csvName.includes(userName)) {
          nameMatch = true;
        }
        // Partial match (user name contains CSV name)
        else if (userName.includes(csvName)) {
          nameMatch = true;
        }
        // Word-by-word matching for compound names
        else {
          const csvWords = csvName.split(/\s+/);
          const userWords = userName.split(/\s+/);
          
          // Check if any significant words match (ignore single letters)
          const significantCsvWords = csvWords.filter(word => word.length > 1);
          const significantUserWords = userWords.filter(word => word.length > 1);
          
          const hasSignificantMatch = significantCsvWords.some(csvWord => 
            significantUserWords.some(userWord => 
              csvWord.includes(userWord) || userWord.includes(csvWord)
            )
          );
          
          if (hasSignificantMatch) {
            nameMatch = true;
          }
        }
      }
      
      return emailMatch || nameMatch;
    });
    
    return NextResponse.json({
      hasMatch: matches.length > 0,
      matches: matches.map(match => ({
        csvRecordId: `${match.Name}-${match.Email || 'no-email'}`,
        name: match.Name,
        email: match.Email || null,
        category: match.Category,
        instagram: match.Instagram,
        youtube: match.YouTube,
        facebook: match.Facebook,
        tiktok: match.TikTok,
        imageUrl: match.ImageURL,
        description: match.Description,
        previousBrands: match.Previous_Brands,
        gender: match.Gender,
        activeHours: match.Active_Hours,
        images: match.Images,
        // Social media metrics
        instagramFollowers: match.Instagram_Followers,
        instagramLikes: match.Instagram_Likes,
        instagramViews: match.Instagram_Views,
        youtubeFollowers: match.YouTube_Followers,
        youtubeLikes: match.YouTube_Likes,
        youtubeViews: match.YouTube_Views,
        facebookFollowers: match.Facebook_Followers,
        facebookLikes: match.Facebook_Likes,
        facebookViews: match.Facebook_Views,
        tiktokFollowers: match.TikTok_Followers,
        tiktokLikes: match.TikTok_Likes,
        tiktokViews: match.TikTok_Views,
      }))
    });
    
  } catch (error) {
    console.error('Error checking CSV match:', error);
    return NextResponse.json({ error: 'Failed to check CSV match' }, { status: 500 });
  }
}
