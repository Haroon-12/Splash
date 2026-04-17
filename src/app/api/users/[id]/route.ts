import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check if the user is authenticated to view profiles
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await db.select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Exclude sensitive information like passwords, tokens, etc.
    const foundUser = result[0];
    
    // Convert date objects to strings to ensure consistent JSON formatting
    const safeUser = {
      ...foundUser,
      createdAt: foundUser.createdAt ? new Date(foundUser.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: foundUser.updatedAt ? new Date(foundUser.updatedAt).toISOString() : new Date().toISOString(),
      approvedAt: foundUser.approvedAt ? new Date(foundUser.approvedAt).toISOString() : null,
    };

    // Remove any fields that shouldn't be exposed
    if ('password' in safeUser) delete (safeUser as any).password;
    
    return NextResponse.json(safeUser, { status: 200 });
  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
