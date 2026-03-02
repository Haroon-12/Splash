/**
 * CSV Data Loader
 * 
 * Utility functions to load and parse CSV influencer data
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CSVInfluencer {
  Name: string;
  Category: string;
  Instagram: string;
  YouTube: string;
  Facebook: string;
  TikTok: string;
  ImageURL: string;
  Description: string;
  Previous_Brands: string;
  Gender: string;
  Email: string;
  Active_Hours: string;
  Images: string;
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
}

/**
 * Load and parse CSV data
 */
export function getCSVData(): CSVInfluencer[] {
  try {
    const csvPath = path.join(process.cwd(), 'influencers.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('#'));

    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const records: CSVInfluencer[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      // Handle CSV parsing with quoted fields
      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add the last value

      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = (values[index] || '').trim();
      });
      records.push(record as CSVInfluencer);
    }

    return records;
  } catch (error) {
    console.error('Error reading CSV file:', error);
    return [];
  }
}

/**
 * Convert CSV influencer to a profile-like object for recommendation engine
 */
export function csvToProfile(csvRecord: CSVInfluencer): any {
  return {
    id: `csv-${csvRecord.Email || csvRecord.Name}`,
    name: csvRecord.Name,
    email: csvRecord.Email || null,
    category: csvRecord.Category || null,
    description: csvRecord.Description || null,
    gender: csvRecord.Gender || null,
    previousBrands: csvRecord.Previous_Brands || null,
    notes: csvRecord.Notes || null,
    activeHours: csvRecord.Active_Hours || null,
    imageUrl: csvRecord.ImageURL || null,
    instagram: csvRecord.Instagram || null,
    youtube: csvRecord.YouTube || null,
    facebook: csvRecord.Facebook || null,
    tiktok: csvRecord.TikTok || null,
    instagramFollowers: csvRecord.Instagram_Followers || null,
    youtubeFollowers: csvRecord.YouTube_Followers || null,
    facebookFollowers: csvRecord.Facebook_Followers || null,
    tiktokFollowers: csvRecord.TikTok_Followers || null,
    instagramLikes: csvRecord.Instagram_Likes || null,
    youtubeLikes: csvRecord.YouTube_Likes || null,
    facebookLikes: csvRecord.Facebook_Likes || null,
    tiktokLikes: csvRecord.TikTok_Likes || null,
    instagramViews: csvRecord.Instagram_Views || null,
    youtubeViews: csvRecord.YouTube_Views || null,
    facebookViews: csvRecord.Facebook_Views || null,
    tiktokViews: csvRecord.TikTok_Views || null,
    isPlatformUser: false,
    dataSource: 'csv',
  };
}

