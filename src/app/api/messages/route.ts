import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, user, conversations, notifications, subscriptions } from '@/db/schema';
import { eq, desc, or, and } from 'drizzle-orm';

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
    const { senderId, conversationId, content, attachmentType, attachmentUrl, attachmentName, attachmentSize } = body;

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

    // Validation: content or attachment required
    if ((!content || typeof content !== 'string' || content.trim() === '') && !attachmentUrl) {
      return NextResponse.json(
        {
          error: 'Message content or attachment is required',
          code: 'MISSING_CONTENT',
        },
        { status: 400 }
      );
    }

    const trimmedContent = (content || '').trim();

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

    // Brand Subscription Check
    const sender = senderExists[0];
    if (sender.userType === "brand") {
      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.brandId, senderId),
      });
      const planType = sub?.status === "active" ? sub.planType : "basic";
      if (planType === "basic") {
        return NextResponse.json(
          { error: 'Chat is not available for Free plan brands. Please upgrade to send messages.', code: 'PLAN_UPGRADE_REQUIRED' },
          { status: 403 }
        );
      }
    }


    // Insert new message
    const newMessage = await db
      .insert(messages)
      .values({
        senderId: senderId.trim(),
        conversationId: conversationId,
        content: trimmedContent,
        attachmentType: attachmentType || null,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        attachmentSize: attachmentSize || null,
        isRead: false,
        createdAt: new Date(),
      })
      .returning();

    // Update conversation's lastMessageAt
    const updatedConversations = await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    if (updatedConversations.length > 0) {
      const conv = updatedConversations[0];
      // Determine who should receive the notification
      const recipientId = conv.participant1Id === senderId ? conv.participant2Id : conv.participant1Id;

      if (recipientId) {
        const senderName = senderExists[0].name || 'A user';

        // Truncate message for notification preview
        const previewText = trimmedContent.length > 60 ? trimmedContent.substring(0, 60) + '...' : trimmedContent;
        const msgPreview = previewText || (attachmentUrl ? 'Sent an attachment' : 'Sent a message');

        // Create standard notification
        await db.insert(notifications).values({
          userId: recipientId,
          type: 'new_message',
          title: `New Message from ${senderName}`,
          message: msgPreview,
          isSmartAlert: false,
          actionUrl: `/dashboard/chat?conversation=${conversationId}`,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}