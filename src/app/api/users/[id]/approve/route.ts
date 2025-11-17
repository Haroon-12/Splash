import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.userType !== 'admin') {
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { isApproved } = body;

    if (typeof isApproved !== 'boolean') {
      return NextResponse.json({ 
        error: 'Invalid isApproved value',
        code: 'INVALID_INPUT' 
      }, { status: 400 });
    }

    // Update user approval status
    await db.update(user)
      .set({ 
        isApproved,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId));

    return NextResponse.json({ 
      success: true,
      message: `User ${isApproved ? 'approved' : 'disapproved'} successfully`
    }, { status: 200 });

  } catch (error) {
    console.error('PUT users/[id]/approve error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

