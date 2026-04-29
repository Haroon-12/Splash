import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account, influencerProfiles, notifications, profileUpdateReminders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Check if user exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId)
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete related records first (foreign key constraints)
    await db.delete(profileUpdateReminders).where(eq(profileUpdateReminders.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(influencerProfiles).where(eq(influencerProfiles.id, userId));
    await db.delete(account).where(eq(account.userId, userId));
    await db.delete(user).where(eq(user.id, userId));

    console.log(`Account deleted successfully for user: ${existingUser.name} (${existingUser.email})`);

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ 
      error: 'Failed to delete account' 
    }, { status: 500 });
  }
}
