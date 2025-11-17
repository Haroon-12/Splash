import { NextRequest, NextResponse } from 'next/server';
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
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      return [];
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
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

// Get CSV data for a specific influencer by email, name, or social media accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const instagram = searchParams.get('instagram');
    const youtube = searchParams.get('youtube');
    const facebook = searchParams.get('facebook');
    const tiktok = searchParams.get('tiktok');
    
    if (!email && !name && !instagram && !youtube && !facebook && !tiktok) {
      return NextResponse.json({ error: 'At least one search parameter is required' }, { status: 400 });
    }
    
    const csvData = getCSVData();
    
    // Find matching record using multiple criteria
    const match = csvData.find(record => {
      // Email matching (exact or partial)
      const emailMatch = email && record.Email && record.Email.trim() !== '' && 
        (record.Email.toLowerCase().includes(email.toLowerCase()) ||
         email.toLowerCase().includes(record.Email.toLowerCase()));
      
      // Name matching (exact, partial, or word-by-word)
      let nameMatch = false;
      if (name && record.Name) {
        const csvName = record.Name.toLowerCase().trim();
        const searchName = name.toLowerCase().trim();
        
        // Exact match
        if (csvName === searchName) {
          nameMatch = true;
        }
        // Partial match (CSV name contains search name)
        else if (csvName.includes(searchName)) {
          nameMatch = true;
        }
        // Partial match (search name contains CSV name)
        else if (searchName.includes(csvName)) {
          nameMatch = true;
        }
        // Word-by-word matching for compound names
        else {
          const csvWords = csvName.split(/\s+/);
          const searchWords = searchName.split(/\s+/);
          
          // Check if any significant words match (ignore single letters)
          const significantCsvWords = csvWords.filter(word => word.length > 1);
          const significantSearchWords = searchWords.filter(word => word.length > 1);
          
          const hasSignificantMatch = significantCsvWords.some(csvWord => 
            significantSearchWords.some(searchWord => 
              csvWord.includes(searchWord) || searchWord.includes(csvWord)
            )
          );
          
          if (hasSignificantMatch) {
            nameMatch = true;
          }
        }
      }
      
      // Social media matching (exact or partial URL matching)
      const instagramMatch = instagram && record.Instagram && record.Instagram.trim() !== '' &&
        (record.Instagram.toLowerCase().includes(instagram.toLowerCase()) ||
         instagram.toLowerCase().includes(record.Instagram.toLowerCase()));
      
      const youtubeMatch = youtube && record.YouTube && record.YouTube.trim() !== '' &&
        (record.YouTube.toLowerCase().includes(youtube.toLowerCase()) ||
         youtube.toLowerCase().includes(record.YouTube.toLowerCase()));
      
      const facebookMatch = facebook && record.Facebook && record.Facebook.trim() !== '' &&
        (record.Facebook.toLowerCase().includes(facebook.toLowerCase()) ||
         facebook.toLowerCase().includes(record.Facebook.toLowerCase()));
      
      const tiktokMatch = tiktok && record.TikTok && record.TikTok.trim() !== '' &&
        (record.TikTok.toLowerCase().includes(tiktok.toLowerCase()) ||
         tiktok.toLowerCase().includes(record.TikTok.toLowerCase()));
      
      // Return true if ANY field matches
      return emailMatch || nameMatch || instagramMatch || youtubeMatch || facebookMatch || tiktokMatch;
    });
    
    if (!match) {
      return NextResponse.json({ error: 'No CSV data found matching the provided criteria' }, { status: 404 });
    }
    
    // Return formatted CSV data
    return NextResponse.json({
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
      notes: match.Notes,
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
    });
    
  } catch (error) {
    console.error('Error fetching CSV data:', error);
    return NextResponse.json({ error: 'Failed to fetch CSV data' }, { status: 500 });
  }
}
