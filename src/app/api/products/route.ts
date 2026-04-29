import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Get all products for the authenticated brand
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.userType !== 'brand') {
      return NextResponse.json({ error: 'Only brands can view products' }, { status: 403 });
    }
    
    const brandProducts = await db
      .select()
      .from(products)
      .where(eq(products.brandId, session.user.id));
    
    return NextResponse.json({
      success: true,
      products: brandProducts,
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.userType !== 'brand') {
      return NextResponse.json({ error: 'Only brands can create products' }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      name,
      description,
      category,
      targetAudience,
      priceRange,
      features,
      useCases,
      brandValues,
      imageUrl,
      website,
    } = body;
    
    if (!name || !description || !category) {
      return NextResponse.json(
        { error: 'Name, description, and category are required' },
        { status: 400 }
      );
    }
    
    const newProduct = await db.insert(products).values({
      brandId: session.user.id,
      name,
      description,
      category,
      targetAudience: targetAudience ? JSON.stringify(targetAudience) : null,
      priceRange: priceRange ? JSON.stringify(priceRange) : null,
      features: features ? JSON.stringify(features) : null,
      useCases: useCases ? JSON.stringify(useCases) : null,
      brandValues: brandValues ? JSON.stringify(brandValues) : null,
      imageUrl: imageUrl || null,
      website: website || null,
    }).returning();
    
    return NextResponse.json({
      success: true,
      product: newProduct[0],
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}

