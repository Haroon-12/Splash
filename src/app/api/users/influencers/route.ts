import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    // Build base query with required filters
    let whereConditions = and(
      eq(user.userType, 'influencer'),
      eq(user.isApproved, true)
    );

    // Add search condition if provided
    if (search) {
      whereConditions = and(
        eq(user.userType, 'influencer'),
        eq(user.isApproved, true),
        like(user.name, `%${search}%`)
      );
    }

    // Execute query with filters, ordering, and pagination
    const influencers = await db.select()
      .from(user)
      .where(whereConditions)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(influencers, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}