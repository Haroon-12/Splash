import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

type CsvInfluencer = {
  Name: string;
  Category?: string;
  Instagram?: string;
  YouTube?: string;
  Facebook?: string;
  TikTok?: string;
  ImageURL?: string;
  Notes?: string;
  Description?: string;
  Previous_Brands?: string;
  Gender?: string;
  Email?: string;
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const emailFilter = url.searchParams.get('email');
    const nameFilter = url.searchParams.get('name');

    const csvPath = path.join(process.cwd(), 'influencers.csv');
    const csvRaw = await fs.readFile(csvPath, 'utf8');
    const records = parse(csvRaw, { columns: true, skip_empty_lines: true }) as CsvInfluencer[];

    let filtered = records;
    if (emailFilter) {
      filtered = records.filter(r => (r.Email || '').toLowerCase() === emailFilter.toLowerCase());
    } else if (nameFilter) {
      const nf = nameFilter.toLowerCase();
      filtered = records.filter(r => (r.Name || '').toLowerCase() === nf);
    }

    // fetch platform users by emails in batch
    const emails = filtered.map(r => (r.Email || '').toLowerCase()).filter(Boolean);

    const platformUsers: Record<string, { id: string; image: string | null } & Record<string, any>> = {};
    if (emails.length > 0) {
      // Drizzle doesn't support IN for sqlite without raw; do individual queries to keep simple and safe
      for (const em of emails) {
        const found = await db.select().from(user).where(eq(user.email, em)).limit(1);
        if (found[0]) {
          platformUsers[em] = found[0] as any;
        }
      }
    }

    const result = filtered.map((r) => {
      const email = (r.Email || '').toLowerCase();
      const platformUser = platformUsers[email];
      return {
        name: r.Name,
        category: r.Category || null,
        socials: {
          instagram: r.Instagram || null,
          youtube: r.YouTube || null,
          facebook: r.Facebook || null,
          tiktok: r.TikTok || null,
        },
        imageUrl: r.ImageURL || null,
        description: r.Description || null,
        previousBrands: r.Previous_Brands || null,
        gender: r.Gender || null,
        email: r.Email || null,
        isPlatformUser: Boolean(platformUser),
        platformUserId: platformUser?.id || null,
        platformImage: platformUser?.image || null,
      };
    });

    // Also include DB-only influencers not present in CSV
    const dbInfluencers = await db.select().from(user);
    const dbOnly = dbInfluencers
      .filter((u: any) => u.userType === 'influencer' && (u.isApproved === 1 || u.isApproved === true))
      .filter((u: any) => {
        const email = (u.email || '').toLowerCase();
        return !result.some((r) => (r.email || '').toLowerCase() === email);
      })
      .map((u: any) => ({
        name: u.name,
        category: null,
        socials: { instagram: null, youtube: null, facebook: null, tiktok: null },
        imageUrl: null,
        description: null,
        previousBrands: null,
        gender: null,
        email: u.email,
        isPlatformUser: true,
        platformUserId: u.id,
        platformImage: u.image || null,
      }));

    const merged = [...result, ...dbOnly];
    return NextResponse.json(merged, { status: 200 });
  } catch (error) {
    console.error('CSV directory error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}


