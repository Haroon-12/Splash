import { NextRequest, NextResponse } from 'next/server';
import { getClaimById } from '@/lib/file-claims-store';

export async function GET(request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
  try {
    const { claimId } = await params;
    
    console.log('Checking claim status for ID:', claimId);
    
    const claim = await getClaimById(claimId);
    
    if (!claim) {
      return NextResponse.json({ 
        error: 'Claim not found' 
      }, { status: 404 });
    }
    
    let userName = claim.csvRecordId;
    let userEmail = '';
    
    if (claim.registrationData) {
      try {
        const registrationData = JSON.parse(claim.registrationData);
        userName = registrationData.name || userName;
        userEmail = registrationData.email || userEmail;
      } catch (error) {
        console.error('Error parsing registration data:', error);
      }
    } else {
      const parts = claim.csvRecordId.split('-');
      if (parts.length > 0) {
        userName = parts[0].replace(/\s+/g, ' ').trim();
      }
      if (claim.csvRecordId.includes('@')) {
        const emailMatch = claim.csvRecordId.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          userEmail = emailMatch[0];
        }
      }
    }

    return NextResponse.json({ 
      claim: {
        id: claim.id,
        userId: claim.userId,
        csvRecordId: claim.csvRecordId,
        userName,
        userEmail,
        claimReason: claim.claimReason,
        status: claim.status,
        reviewedBy: claim.reviewedBy,
        reviewedAt: claim.reviewedAt,
        rejectionReason: claim.rejectionReason,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        proofImages: claim.proofImages,
        idDocument: claim.idDocument,
      }
    });
    
  } catch (error) {
    console.error('Error fetching claim status:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch claim status' 
    }, { status: 500 });
  }
}
