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
    
    return NextResponse.json({ 
      claim: {
        id: claim.id,
        userId: claim.userId,
        csvRecordId: claim.csvRecordId,
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
      error: 'Failed to fetch claim status' 
    }, { status: 500 });
  }
}
