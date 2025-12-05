import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { campaigns } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Get all campaigns for the authenticated brand
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.userType !== 'brand') {
      return NextResponse.json({ error: 'Only brands can view campaigns' }, { status: 403 });
    }
    
    const brandCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.brandId, session.user.id));
    
    return NextResponse.json({
      success: true,
      campaigns: brandCampaigns,
    });
    
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.userType !== 'brand') {
      return NextResponse.json({ error: 'Only brands can create campaigns' }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      title,
      description,
      category,
      objectives,
      targetAudience,
      budget,
      budgetRange,
      startDate,
      endDate,
      requiredPlatforms,
      contentRequirements,
      geographicTarget,
      minFollowers,
      maxFollowers,
      minEngagementRate,
      status = 'draft',
    } = body;
    
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }
    
    const newCampaign = await db.insert(campaigns).values({
      brandId: session.user.id,
      title,
      description,
      category,
      objectives: objectives ? JSON.stringify(objectives) : null,
      targetAudience: targetAudience ? JSON.stringify(targetAudience) : null,
      budget: budget || null,
      budgetRange: budgetRange ? JSON.stringify(budgetRange) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status,
      requiredPlatforms: requiredPlatforms ? JSON.stringify(requiredPlatforms) : null,
      contentRequirements: contentRequirements ? JSON.stringify(contentRequirements) : null,
      geographicTarget: geographicTarget ? JSON.stringify(geographicTarget) : null,
      minFollowers: minFollowers || null,
      maxFollowers: maxFollowers || null,
      minEngagementRate: minEngagementRate ? minEngagementRate.toString() : null,
    }).returning();
    
    return NextResponse.json({
      success: true,
      campaign: newCampaign[0],
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

