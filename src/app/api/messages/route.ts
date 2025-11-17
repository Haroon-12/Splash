import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, user } from '@/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const conversationWith = searchParams.get('conversationWith');

    // Validate userId parameter
    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        {
          error: 'userId is required',
          code: 'MISSING_USER_ID',
        },
        { status: 400 }
      );
    }

    // Build query conditions
    let whereConditions;
    
    if (conversationWith) {
      // Filter messages between userId and conversationWith user
      whereConditions = or(
        and(
          eq(messages.senderId, userId),
          eq(messages.conversationId, parseInt(conversationWith))
        ),
        and(
          eq(messages.conversationId, parseInt(conversationWith)),
          eq(messages.senderId, userId)
        )
      );
    } else {
      // Get all messages for userId (sent or from conversations)
      whereConditions = eq(messages.senderId, userId);
    }

    // Execute query
    const results = await db
      .select()
      .from(messages)
      .where(whereConditions)
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, conversationId, content } = body;

    // Validation: senderId
    if (!senderId || typeof senderId !== 'string' || senderId.trim() === '') {
      return NextResponse.json(
        {
          error: 'Sender ID is required',
          code: 'MISSING_SENDER_ID',
        },
        { status: 400 }
      );
    }

    // Validation: conversationId
    if (!conversationId || typeof conversationId !== 'number') {
      return NextResponse.json(
        {
          error: 'Conversation ID is required',
          code: 'MISSING_CONVERSATION_ID',
        },
        { status: 400 }
      );
    }

    // Validation: content
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        {
          error: 'Message content is required',
          code: 'MISSING_CONTENT',
        },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    // Validation: content length
    if (trimmedContent.length > 5000) {
      return NextResponse.json(
        {
          error: 'Message content cannot exceed 5000 characters',
          code: 'CONTENT_TOO_LONG',
        },
        { status: 400 }
      );
    }

    // Check if sender exists
    const senderExists = await db
      .select()
      .from(user)
      .where(eq(user.id, senderId))
      .limit(1);

    if (senderExists.length === 0) {
      return NextResponse.json(
        {
          error: 'Sender not found',
          code: 'SENDER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Insert new message
    const newMessage = await db
      .insert(messages)
      .values({
        senderId: senderId.trim(),
        conversationId: conversationId,
        content: trimmedContent,
        isRead: false,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}