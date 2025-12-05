import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { recommendInfluencersForCampaign } from '@/lib/recommendation-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.userType !== 'brand') {
      return NextResponse.json({ error: 'Only brands can view campaign recommendations' }, { status: 403 });
    }
    
    const { campaignId: campaignIdParam } = await params;
    const campaignId = parseInt(campaignIdParam);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }
    
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    
    const recommendations = await recommendInfluencersForCampaign(
      campaignId,
      session.user.id,
      limit
    );
    
    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length,
    });
    
  } catch (error: any) {
    console.error('Error getting campaign recommendations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

