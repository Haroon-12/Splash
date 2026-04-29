import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    // Validate conversationId
    if (!conversationId || conversationId.trim() === '') {
      return NextResponse.json(
        {
          error: 'Valid conversationId is required',
          code: 'INVALID_CONVERSATION_ID',
        },
        { status: 400 }
      );
    }

    // Parse conversationId to integer
    const parsedId = parseInt(conversationId);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        {
          error: 'Valid conversationId is required',
          code: 'INVALID_CONVERSATION_ID',
        },
        { status: 400 }
      );
    }

    // Fetch conversation with participant details using joins
    const result = await db
      .select({
        id: conversations.id,
        participant1Id: conversations.participant1Id,
        participant2Id: conversations.participant2Id,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        participant1: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          userType: user.userType,
        },
      })
      .from(conversations)
      .leftJoin(user, eq(conversations.participant1Id, user.id))
      .where(eq(conversations.id, parsedId))
      .limit(1);

    // Check if conversation exists
    if (result.length === 0) {
      return NextResponse.json(
        {
          error: 'Conversation not found',
          code: 'CONVERSATION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Fetch participant2 details separately
    const participant2Result = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        userType: user.userType,
      })
      .from(user)
      .where(eq(user.id, result[0].participant2Id))
      .limit(1);

    // Construct the response with both participants
    const conversation = {
      id: result[0].id,
      participant1Id: result[0].participant1Id,
      participant2Id: result[0].participant2Id,
      lastMessageAt: result[0].lastMessageAt,
      createdAt: result[0].createdAt,
      participant1: result[0].participant1,
      participant2: participant2Result.length > 0 ? participant2Result[0] : null,
    };

    return NextResponse.json(conversation, { status: 200 });
  } catch (error) {
    console.error('GET conversation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
      },
      { status: 500 }
    );
  }
}