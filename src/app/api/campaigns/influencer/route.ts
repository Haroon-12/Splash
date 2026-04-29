import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { campaigns, collaborations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Get all campaigns where the influencer is part of collaborations
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.userType !== 'influencer') {
      return NextResponse.json({ error: 'Only influencers can view their campaigns' }, { status: 403 });
    }
    
    const influencerId = session.user.id;
    
    // Get all collaborations for this influencer
    const influencerCollaborations = await db.query.collaborations.findMany({
      where: eq(collaborations.influencerId, influencerId)
    });
    
    // Get unique campaign IDs from collaborations
    const campaignIds = influencerCollaborations
      .filter(c => c.campaignId !== null)
      .map(c => c.campaignId!)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
    
    // Fetch campaigns
    const influencerCampaigns = [];
    for (const campaignId of campaignIds) {
      const campaign = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaignId)
      });
      if (campaign) {
        influencerCampaigns.push(campaign);
      }
    }
    
    return NextResponse.json({
      success: true,
      campaigns: influencerCampaigns,
    });
    
  } catch (error) {
    console.error('Error fetching influencer campaigns:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

