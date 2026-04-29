import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account } from '@/db/schema';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, emailVerified, image } = body;

    // Generate ID automatically
    const id = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required and must be a non-empty string', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { error: 'Password is required and must be a non-empty string', code: 'INVALID_PASSWORD' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long', code: 'PASSWORD_TOO_SHORT' },
        { status: 400 }
      );
    }

    // Validation: Basic email format check
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return NextResponse.json(
        { error: 'Email must be in a valid format', code: 'INVALID_EMAIL_FORMAT' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const trimmedName = name.trim();
    const normalizedEmail = trimmedEmail;
    const adminEmailVerified = emailVerified !== undefined ? emailVerified : true;
    const adminImage = image !== undefined ? image : null;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin user
    const newAdmin = await db.insert(user).values({
      id: id,
      name: trimmedName,
      email: normalizedEmail,
      emailVerified: adminEmailVerified,
      image: adminImage,
      userType: 'admin',
      isApproved: true,
      approvedBy: null,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning() as any[];

    // Create account record for password authentication
    await db.insert(account).values({
      id: `account-${id}`,
      accountId: normalizedEmail,
      providerId: 'credential',
      userId: id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Admin account created successfully',
        admin: newAdmin[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);

    const errorMessage = error instanceof Error ? error.message : '';

    // Check for unique constraint violation (email already exists)
    if (errorMessage && (errorMessage.includes('UNIQUE constraint failed') || errorMessage.toLowerCase().includes('unique'))) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'EMAIL_EXISTS' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}