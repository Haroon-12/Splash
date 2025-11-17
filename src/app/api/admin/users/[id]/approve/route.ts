import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Approve/Disapprove user
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
    const { approved } = body;

    // Check if user exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId)
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update approval status
    await db.update(user).set({ isApproved: approved }).where(eq(user.id, userId));

    const action = approved ? 'approved' : 'disapproved';
    console.log(`User ${action}: ${existingUser.name} (${existingUser.email})`);

    return NextResponse.json({ 
      success: true, 
      message: `User ${action} successfully` 
    });

  } catch (error) {
    console.error('Error updating user approval:', error);
    return NextResponse.json({ 
      error: 'Failed to update user approval' 
    }, { status: 500 });
  }
}
