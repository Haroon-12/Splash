import { NextRequest, NextResponse } from 'next/server';

// Send profile update notification to user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // For now, simulate successful notification creation
    const mockNotification = {
      id: Date.now(),
      userId: userId,
      type: 'profile_update_reminder',
      title: 'Update Your Profile',
      message: 'Complete your profile to increase your visibility and attract more brand partnerships.',
      actionUrl: '/dashboard/profile/edit',
      createdAt: new Date().toISOString()
    };

    console.log('Mock notification created:', mockNotification);

    return NextResponse.json({ 
      success: true, 
      notification: mockNotification 
    });

  } catch (error) {
    console.error('Error creating profile update notification:', error);
    return NextResponse.json({ 
      error: 'Failed to create profile update notification' 
    }, { status: 500 });
  }
}

// Get user's notifications
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Profile update notification API is working' });
}
