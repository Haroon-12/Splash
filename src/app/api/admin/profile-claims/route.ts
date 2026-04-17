import { NextRequest, NextResponse } from 'next/server';
import { getAllClaims, updateClaim } from '@/lib/file-claims-store';
import { auth } from '@/lib/auth';

// Get all profile claims (admin only)
export async function GET(request: NextRequest) {
  try {
    const claims = await getAllClaims();
    
    // Transform claims to include proper user information
    const transformedClaims = claims.map(claim => {
      // Extract name from csvRecordId if possible
      let userName = 'Unknown User';
      let userEmail = 'unknown@example.com';
      
      // First try to get user info from registration data
      if (claim.registrationData) {
        try {
          const registrationData = JSON.parse(claim.registrationData);
          userName = registrationData.name || userName;
          userEmail = registrationData.email || userEmail;
        } catch (error) {
          console.error('Error parsing registration data:', error);
        }
      }
      
      // Fallback to csvRecordId if no registration data
      if (userName === 'Unknown User' && claim.csvRecordId && claim.csvRecordId !== 'no-email') {
        // Try to extract name from csvRecordId (format: "Name-email" or "Name-no-email")
        const parts = claim.csvRecordId.split('-');
        if (parts.length > 0) {
          userName = parts[0].replace(/\s+/g, ' ').trim();
        }
        
        // Try to extract email if it exists
        if (claim.csvRecordId.includes('@')) {
          const emailMatch = claim.csvRecordId.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            userEmail = emailMatch[0];
          }
        }
      }
      
      return {
        ...claim,
        userName,
        userEmail,
        userImage: null,
        registrationData: claim.registrationData || null,
      };
    });
    
    return NextResponse.json(transformedClaims);

  } catch (error) {
    console.error('Error fetching profile claims:', error);
    return NextResponse.json({
      error: 'Failed to fetch profile claims'
    }, { status: 500 });
  }
}

// Approve or reject a profile claim (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const adminName = session?.user?.name || 'Admin';

    const body = await request.json();
    const { claimId, action, rejectionReason } = body;

    console.log('Admin PATCH request:', { claimId, action, rejectionReason });

    if (!claimId || !action) {
      return NextResponse.json({
        error: 'Claim ID and action are required'
      }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({
        error: 'Action must be either approve or reject'
      }, { status: 400 });
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json({
        error: 'Rejection reason is required when rejecting a claim'
      }, { status: 400 });
    }

    // Get the claim first
    const claims = await getAllClaims();
    const claim = claims.find(c => c.id === claimId);
    if (!claim) {
      return NextResponse.json({
        error: 'Claim not found'
      }, { status: 404 });
    }

    let createdUserId = claim.userId;

    // If approving, create the account
    if (action === 'approve' && claim.registrationData) {
      try {
        const registrationData = JSON.parse(claim.registrationData);
        console.log('Creating account for approved claim:', registrationData);

        // Call the account creation API
        const accountResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/create-approved-account`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationData }),
        });

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          if (accountData.success && accountData.user?.id) {
            createdUserId = accountData.user.id;
            console.log('Account created successfully:', accountData.user.id);
          } else {
            console.warn('Account creation failed:', accountData.error);
          }
        } else {
          const errorData = await accountResponse.json();
          console.warn('Account creation API failed:', errorData.error);
        }
        
      } catch (accountError) {
        console.error('Error creating account:', accountError);
        // Don't fail the approval if there's an error with account creation
        console.log('Continuing with approval despite account creation error');
      }
    } else if (action === 'approve' && !claim.registrationData) {
      console.log('No registration data found for claim, approving without account creation');
      // For old claims without registration data, just approve without creating account
    }

    // Update the claim using file-based store
    const updatedClaim = await updateClaim(claimId, {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy: adminName,
      reviewedAt: new Date().toISOString(),
      rejectionReason: action === 'reject' ? rejectionReason : null,
    });

    if (!updatedClaim) {
      return NextResponse.json({
        error: 'Claim not found'
      }, { status: 404 });
    }

    console.log('Updated claim:', updatedClaim);

    return NextResponse.json({
      success: true,
      message: `Claim ${action}d successfully`,
      claim: updatedClaim
    });

  } catch (error) {
    console.error('Error processing profile claim:', error);
    return NextResponse.json({
      error: 'Failed to process profile claim'
    }, { status: 500 });
  }
}
