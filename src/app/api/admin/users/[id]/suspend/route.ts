import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
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
    const { suspended } = body;

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

    // Update user suspension status
    await db.update(user).set({ 
      isApproved: !suspended, // Use isApproved as suspension status
      updatedAt: new Date() 
    }).where(eq(user.id, userId));

    const action = suspended ? 'suspended' : 'unsuspended';
    console.log(`User ${action}: ${existingUser.name} (${existingUser.email})`);

    return NextResponse.json({ 
      success: true, 
      message: `User ${action} successfully` 
    });

  } catch (error) {
    console.error('Error updating user suspension:', error);
    return NextResponse.json({ 
      error: 'Failed to update user suspension' 
    }, { status: 500 });
  }
}
