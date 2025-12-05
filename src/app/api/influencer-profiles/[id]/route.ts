import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { influencerProfiles, notifications, profileUpdateReminders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// Get influencer profile
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is accessing their own profile or is admin
    if (currentUser.id !== id && currentUser.userType !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profile = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.id, id))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: profile[0] });

  } catch (error) {
    console.error('Error fetching influencer profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profile' 
    }, { status: 500 });
  }
}

// Create influencer profile
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.userType !== 'influencer') {
      return NextResponse.json({ error: 'Only influencers can create profiles' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (userId !== currentUser.id) {
      return NextResponse.json({ error: 'Can only create profile for yourself' }, { status: 403 });
    }

    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.id, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 });
    }

    // Create new profile
    const newProfile = await db
      .insert(influencerProfiles)
      .values({
        id: userId,
        profileCompleteness: 0,
        lastProfileUpdate: new Date(),
      })
      .returning();

    // Create profile update reminder
    await db.insert(profileUpdateReminders).values({
      userId: userId,
      isActive: true,
    });

    // Create notification for user to complete profile
    await db.insert(notifications).values({
      userId: userId,
      type: 'profile_setup_reminder',
      title: 'Complete Your Profile',
      message: 'Welcome! Please complete your profile to start attracting brand collaborations.',
      actionUrl: '/dashboard/profile/edit',
    });

    return NextResponse.json({ 
      success: true, 
      profile: newProfile[0] 
    });

  } catch (error) {
    console.error('Error creating influencer profile:', error);
    return NextResponse.json({ 
      error: 'Failed to create profile' 
    }, { status: 500 });
  }
}

// Update influencer profile
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is updating their own profile or is admin
    if (currentUser.id !== id && currentUser.userType !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Update profile
    const updatedProfile = await db
      .update(influencerProfiles)
      .set({
        ...body,
        updatedAt: new Date(),
        lastProfileUpdate: new Date(),
      })
      .where(eq(influencerProfiles.id, id))
      .returning();

    if (updatedProfile.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Update profile update reminder
    await db
      .update(profileUpdateReminders)
      .set({
        lastReminderSent: new Date(),
        reminderCount: 0, // Reset reminder count after update
      })
      .where(eq(profileUpdateReminders.userId, id));

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile[0] 
    });

  } catch (error) {
    console.error('Error updating influencer profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile' 
    }, { status: 500 });
  }
}
