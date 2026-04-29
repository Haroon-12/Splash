import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { campaigns } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Get a specific campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { campaignId: campaignIdParam } = await params;
    const campaignId = parseInt(campaignIdParam);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }
    
    const campaignResults = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    const campaign = campaignResults[0];
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // Brand owners can view their own campaigns
    // Influencers can view active campaigns
    // Admins can view all campaigns
    if (session.user.userType === 'brand' && campaign.brandId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // If influencer, only allow viewing active campaigns
    if (session.user.userType === 'influencer' && campaign.status !== 'active') {
      return NextResponse.json({ error: 'Campaign is not active' }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      campaign,
    });
    
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// Update a campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.userType !== 'brand') {
      return NextResponse.json({ error: 'Only brands can update campaigns' }, { status: 403 });
    }
    
    const { campaignId: campaignIdParam } = await params;
    const campaignId = parseInt(campaignIdParam);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Check if campaign exists and belongs to the brand
    const existingCampaign = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.brandId, session.user.id)
        )
      )
      .limit(1);
    
    if (existingCampaign.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.objectives !== undefined) updateData.objectives = JSON.stringify(body.objectives);
    if (body.targetAudience !== undefined) updateData.targetAudience = JSON.stringify(body.targetAudience);
    if (body.budget !== undefined) updateData.budget = body.budget;
    if (body.budgetRange !== undefined) updateData.budgetRange = JSON.stringify(body.budgetRange);
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.requiredPlatforms !== undefined) updateData.requiredPlatforms = JSON.stringify(body.requiredPlatforms);
    if (body.contentRequirements !== undefined) updateData.contentRequirements = JSON.stringify(body.contentRequirements);
    if (body.geographicTarget !== undefined) updateData.geographicTarget = JSON.stringify(body.geographicTarget);
    if (body.minFollowers !== undefined) updateData.minFollowers = body.minFollowers;
    if (body.maxFollowers !== undefined) updateData.maxFollowers = body.maxFollowers;
    if (body.minEngagementRate !== undefined) updateData.minEngagementRate = body.minEngagementRate?.toString();
    
    const updatedCampaign = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, campaignId))
      .returning();
    
    return NextResponse.json({
      success: true,
      campaign: updatedCampaign[0],
    });
    
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// Delete a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.userType !== 'brand') {
      return NextResponse.json({ error: 'Only brands can delete campaigns' }, { status: 403 });
    }
    
    const { campaignId: campaignIdParam } = await params;
    const campaignId = parseInt(campaignIdParam);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }
    
    // Check if campaign exists and belongs to the brand
    const existingCampaign = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.brandId, session.user.id)
        )
      )
      .limit(1);
    
    if (existingCampaign.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    await db.delete(campaigns).where(eq(campaigns.id, campaignId));
    
    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}

