import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, user } from '@/db/schema';
import { eq, lt, desc, and } from 'drizzle-orm';

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

    const parsedConversationId = parseInt(conversationId);
    if (isNaN(parsedConversationId)) {
      return NextResponse.json(
        {
          error: 'Valid conversationId is required',
          code: 'INVALID_CONVERSATION_ID',
        },
        { status: 400 }
      );
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const before = searchParams.get('before');

    // Build where conditions
    const whereConditions = [eq(messages.conversationId, parsedConversationId)];

    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        whereConditions.push(lt(messages.createdAt, beforeDate));
      }
    }

    // Query messages with sender details
    const results = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(messages)
      .leftJoin(user, eq(messages.senderId, user.id))
      .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0])
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
      },
      { status: 500 }
    );
  }
}