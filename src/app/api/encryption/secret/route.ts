import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * API endpoint to provide encryption secret to authenticated clients
 * This allows client-side encryption/decryption
 * 
 * Note: The secret is used to derive conversation-specific keys.
 * Both participants in a conversation can derive the same key,
 * allowing end-to-end encryption without key exchange.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the encryption secret from environment
    const secret = process.env.CHAT_ENCRYPTION_SECRET;
    
    if (!secret) {
      return NextResponse.json(
        { error: 'Encryption secret not configured' },
        { status: 500 }
      );
    }
    
    // Return the secret to authenticated clients
    // The client will use it to derive conversation-specific keys
    // using PBKDF2 with conversation ID and participant IDs as salt
    
    return NextResponse.json({ secret }, { status: 200 });
  } catch (error) {
    console.error('Error getting encryption secret:', error);
    return NextResponse.json(
      { error: 'Failed to get encryption secret' },
      { status: 500 }
    );
  }
}

