import { NextRequest, NextResponse } from 'next/server';
import { createClaim } from '@/lib/file-claims-store';

// Create a new profile claim
export async function POST(request: NextRequest) {
  try {
    console.log('Profile claims API called');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { registrationData, csvRecordId, claimReason, proofImages, idDocument } = body;

    if (!csvRecordId || !claimReason) {
      return NextResponse.json({ 
        error: 'CSV record ID and claim reason are required' 
      }, { status: 400 });
    }

    if (!registrationData || !registrationData.name || !registrationData.email) {
      return NextResponse.json({ 
        error: 'Registration data (name, email) is required' 
      }, { status: 400 });
    }

    // Create new claim using file-based store with real user data
    const newClaim = await createClaim({
      userId: 'pending-' + Date.now(), // Temporary ID until account is created
      csvRecordId,
      claimReason,
      proofImages: proofImages || [],
      idDocument: idDocument || '',
      status: 'pending',
      reviewedBy: undefined,
      reviewedAt: undefined,
      rejectionReason: undefined,
      registrationData: JSON.stringify(registrationData), // Store registration data
    });

    console.log('New claim created:', newClaim);

    return NextResponse.json({ 
      success: true, 
      claim: {
        id: newClaim.id,
        userId: newClaim.userId,
        csvRecordId: newClaim.csvRecordId,
        claimReason: newClaim.claimReason,
        status: newClaim.status,
        createdAt: newClaim.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating profile claim:', error);
    return NextResponse.json({ 
      error: 'Failed to create profile claim',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Get user's profile claims
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Profile claims API is working' });
}
