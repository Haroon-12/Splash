import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account, influencerProfiles, notifications, profileUpdateReminders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Suspend/Unsuspend user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session from cookies
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { suspended, approved } = body;

    // Prevent admin from modifying themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId)
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user status
    const updateData: any = {};
    if (suspended !== undefined) {
      updateData.isApproved = !suspended; // Use isApproved as suspension status
    }
    if (approved !== undefined) {
      updateData.isApproved = approved;
    }

    await db.update(user).set(updateData).where(eq(user.id, userId));

    const action = suspended !== undefined 
      ? (suspended ? 'suspended' : 'unsuspended')
      : (approved ? 'approved' : 'disapproved');

    console.log(`User ${action}: ${existingUser.name} (${existingUser.email})`);

    return NextResponse.json({ 
      success: true, 
      message: `User ${action} successfully` 
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Failed to update user' 
    }, { status: 500 });
  }
}

// Delete user permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session from cookies
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId)
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete related records first (foreign key constraints)
    await db.delete(profileUpdateReminders).where(eq(profileUpdateReminders.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(influencerProfiles).where(eq(influencerProfiles.id, userId));
    await db.delete(account).where(eq(account.userId, userId));
    await db.delete(user).where(eq(user.id, userId));

    console.log(`User deleted permanently: ${existingUser.name} (${existingUser.email})`);

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: 'Failed to delete user' 
    }, { status: 500 });
  }
}
