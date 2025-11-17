import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function checkUserSuspension(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (currentUser && currentUser.isSuspended) {
      return NextResponse.json(
        { 
          error: 'Account suspended',
          message: 'Your account has been suspended. Please contact support for assistance.'
        }, 
        { status: 403 }
      );
    }
    
    return null; // User is not suspended
  } catch (error) {
    console.error('Error checking user suspension:', error);
    return null; // Allow access if check fails
  }
}