import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { campaigns, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Get all active campaigns (for influencers to browse)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all active campaigns
    const activeCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.status, 'active')
    });
    
    // Get brand information for each campaign
    const campaignsWithBrands = await Promise.all(
      activeCampaigns.map(async (campaign) => {
        const brand = await db.query.user.findFirst({
          where: eq(user.id, campaign.brandId)
        });
        
        return {
          ...campaign,
          brand: brand ? {
            name: brand.name,
            email: brand.email
          } : undefined
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      campaigns: campaignsWithBrands,
    });
    
  } catch (error) {
    console.error('Error fetching active campaigns:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch active campaigns' },
      { status: 500 }
    );
  }
}

