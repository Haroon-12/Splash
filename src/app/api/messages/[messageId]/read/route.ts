import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;

    // Validate messageId
    if (!messageId || messageId.trim() === '') {
      return NextResponse.json(
        {
          error: 'Valid messageId is required',
          code: 'INVALID_MESSAGE_ID',
        },
        { status: 400 }
      );
    }

    // Parse messageId to integer
    const parsedMessageId = parseInt(messageId);
    if (isNaN(parsedMessageId)) {
      return NextResponse.json(
        {
          error: 'Valid messageId is required',
          code: 'INVALID_MESSAGE_ID',
        },
        { status: 400 }
      );
    }

    // Update the message's isRead and readAt timestamp
    const updatedMessages = await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(messages.id, parsedMessageId))
      .returning();

    // Check if message was found
    if (updatedMessages.length === 0) {
      return NextResponse.json(
        {
          error: 'Message not found',
          code: 'MESSAGE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Return success with updated message
    return NextResponse.json(
      {
        success: true,
        message: updatedMessages[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
      },
      { status: 500 }
    );
  }
}