import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { recommendInfluencersForCampaign } from '@/lib/recommendation-engine';
import { db } from '@/db';
import { collaborations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Fetch existing collaborations for this campaign to check if influencer is already invited or active
    const existingCollabs = await db
      .select({
        influencerId: collaborations.influencerId,
        status: collaborations.status,
      })
      .from(collaborations)
      .where(
        and(
          eq(collaborations.campaignId, campaignId),
          eq(collaborations.brandId, session.user.id)
        )
      );

    // Map the status to an easy lookup dictionary
    const collabStatusMap = existingCollabs.reduce((acc, curr) => {
      // If there are multiple, prioritize active > pending > completed > cancelled
      const priorities: Record<string, number> = { active: 4, pending: 3, completed: 2, cancelled: 1 };
      const currentPriority = priorities[curr.status] || 0;
      const existingPriority = acc[curr.influencerId] ? priorities[acc[curr.influencerId]] : -1;

      if (currentPriority > existingPriority) {
        acc[curr.influencerId] = curr.status;
      }
      return acc;
    }, {} as Record<string, string>);

    // Append status to recommendations
    const enrichedRecommendations = recommendations.map(rec => ({
      ...rec,
      collaborationStatus: collabStatusMap[rec.influencerId] || null
    }));

    return NextResponse.json({
      success: true,
      recommendations: enrichedRecommendations,
      count: enrichedRecommendations.length,
    });

  } catch (error) {
    console.error('Error getting campaign recommendations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

