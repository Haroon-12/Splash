import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all users with their account details
    const users = await db.query.user.findMany({
      with: {
        account: true
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)]
    });

    // Transform the data to match our interface
    const createdAccounts = users.map(user => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      userType: user.userType || 'unknown',
      isApproved: user.isApproved || false,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      csvRecordId: user.csvRecordId || null
    }));

    return NextResponse.json(createdAccounts);

  } catch (error) {
    console.error('Error fetching created accounts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch created accounts' 
    }, { status: 500 });
  }
}
