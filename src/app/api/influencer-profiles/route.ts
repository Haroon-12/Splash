import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { influencerProfiles, notifications, profileUpdateReminders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

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
