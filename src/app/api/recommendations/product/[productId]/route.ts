import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { recommendInfluencersForProduct } from '@/lib/recommendation-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.userType !== 'brand') {
      return NextResponse.json({ error: 'Only brands can view product recommendations' }, { status: 403 });
    }
    
    const { productId: productIdParam } = await params;
    const productId = parseInt(productIdParam);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    
    const recommendations = await recommendInfluencersForProduct(
      productId,
      session.user.id,
      limit
    );
    
    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length,
    });
    
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

