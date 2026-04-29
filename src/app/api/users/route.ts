import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.userType !== 'admin') {
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const userType = searchParams.get('userType');
    const isApprovedParam = searchParams.get('isApproved');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const search = searchParams.get('search');
    
    // Validate and set pagination parameters
    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;
    
    // Validate limit is a valid number
    if (limitParam && isNaN(limit)) {
      return NextResponse.json({ 
        error: 'Invalid limit parameter',
        code: 'INVALID_LIMIT' 
      }, { status: 400 });
    }
    
    // Validate offset is a valid number
    if (offsetParam && isNaN(offset)) {
      return NextResponse.json({ 
        error: 'Invalid offset parameter',
        code: 'INVALID_OFFSET' 
      }, { status: 400 });
    }
    
    // Build dynamic query with filters
    const conditions = [];
    
    // Filter by user type
    if (userType && ['admin', 'brand', 'influencer'].includes(userType)) {
      conditions.push(eq(user.userType, userType));
    }
    
    // Filter by approval status
    if (isApprovedParam !== null) {
      const isApproved = isApprovedParam === 'true';
      conditions.push(eq(user.isApproved, isApproved));
    }
    
    // Search across name and email fields
    if (search) {
      const searchCondition = or(
        like(user.name, `%${search}%`),
        like(user.email, `%${search}%`)
      );
      conditions.push(searchCondition);
    }
    
    // Build and execute query
    let query = db.select().from(user).$dynamic();
    
    // Apply filters if any conditions exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply ordering and pagination
    const results = await query
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Return in the format expected by admin dashboard
    return NextResponse.json({ 
      users: results,
      total: results.length 
    }, { status: 200 });
  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}