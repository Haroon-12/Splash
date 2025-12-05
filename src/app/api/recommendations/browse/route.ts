import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { recommendInfluencersForBrowsing } from '@/lib/recommendation-engine';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.userType !== 'brand') {
      return NextResponse.json({ error: 'Only brands can view recommendations' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      category: searchParams.get('category') || undefined,
      minFollowers: searchParams.get('minFollowers') ? parseInt(searchParams.get('minFollowers')!) : undefined,
      maxFollowers: searchParams.get('maxFollowers') ? parseInt(searchParams.get('maxFollowers')!) : undefined,
      platforms: searchParams.get('platforms') ? searchParams.get('platforms')!.split(',') : undefined,
      searchQuery: searchParams.get('searchQuery') || undefined,
    };
    
    const limit = parseInt(searchParams.get('limit') || '100'); // Get more to rank all influencers
    
    const recommendations = await recommendInfluencersForBrowsing(
      session.user.id,
      filters,
      limit
    );
    
    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length,
    });
    
  } catch (error: any) {
    console.error('Error getting browse recommendations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

