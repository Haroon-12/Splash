import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account, influencerProfiles, notifications, profileUpdateReminders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API called');
    
    // Get session from cookies
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });
    
    console.log('Session:', session);
    
    if (!session?.user) {
      console.log('No session or user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User type:', session.user.userType);
    
    if (session.user.userType !== 'admin') {
      console.log('User is not admin');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all users
    const users = await db.query.user.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)]
    });

    // Get account details for each user
    const userData = await Promise.all(users.map(async (userRecord) => {
      // Get account details
      const userAccount = await db.query.account.findFirst({
        where: eq(account.userId, userRecord.id)
      });

      // Get profile completeness for influencers
      let profileCompleteness = undefined;
      if (userRecord.userType === 'influencer') {
        const profile = await db.query.influencerProfiles.findFirst({
          where: eq(influencerProfiles.id, userRecord.id)
        });
        profileCompleteness = profile?.profileCompleteness || 0;
      }

      return {
        id: userRecord.id,
        name: userRecord.name || 'Unknown',
        email: userRecord.email,
        userType: userRecord.userType || 'unknown',
        isApproved: userRecord.isApproved || false,
        isSuspended: !userRecord.isApproved, // Use isApproved as suspension status
        createdAt: userRecord.createdAt?.toISOString() || new Date().toISOString(),
        lastLogin: userAccount?.updatedAt?.toISOString() || null,
        csvRecordId: null,
        profileCompleteness
      };
    }));

    return NextResponse.json(userData);

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users' 
    }, { status: 500 });
  }
}
