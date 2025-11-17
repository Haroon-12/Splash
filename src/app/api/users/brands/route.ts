import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get all approved brands
    const brands = await db.select()
      .from(user)
      .where(
        and(
          eq(user.userType, 'brand'),
          eq(user.isApproved, true)
        )
      )
      .orderBy(user.createdAt);

    return NextResponse.json(brands, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}