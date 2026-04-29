import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId, userType } = await request.json();

    if (!userId || !userType) {
      return NextResponse.json({ 
        error: 'User ID and user type are required' 
      }, { status: 400 });
    }

    // Update user type in database
    const [updatedUser] = await db.update(user).set({ 
      userType: userType,
      isApproved: true // Auto-approve new users
    }).where(eq(user.id, userId)).returning() as any[];

    if (!updatedUser) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log('User type updated:', { userId, userType });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error) {
    console.error('Error updating user type:', error);
    return NextResponse.json({ 
      error: 'Failed to update user type' 
    }, { status: 500 });
  }
}