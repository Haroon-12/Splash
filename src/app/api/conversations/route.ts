import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, user, influencerProfiles } from '@/db/schema';
import { eq, or, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Create aliases for the two joins
    const participant1 = user;
    const participant2 = user;

    const results = await db
      .select({
        id: conversations.id,
        participant1Id: conversations.participant1Id,
        participant2Id: conversations.participant2Id,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        unreadCount: sql`(
          select count(*) from messages m
          where m.conversation_id = ${conversations.id}
            and m.is_read = 0
            and m.sender_id <> ${userId}
        )`,
        participant1: sql`json_object(
          'id', ${participant1.id},
          'name', ${participant1.name},
          'email', ${participant1.email},
          'image', ${participant1.image},
          'userType', ${participant1.userType}
        )`,
        participant2: sql`json_object(
          'id', p2.id,
          'name', p2.name,
          'email', p2.email,
          'image', p2.image,
          'userType', p2.user_type
        )`,
      })
      .from(conversations)
      .leftJoin(participant1, eq(conversations.participant1Id, participant1.id))
      .leftJoin(
        sql`${user} as p2`,
        sql`${conversations.participant2Id} = p2.id`
      )
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse the JSON strings from SQLite and convert unreadCount to number
    const parsedResults = results.map(row => ({
      ...row,
      participant1: typeof row.participant1 === 'string' ? JSON.parse(row.participant1) : row.participant1,
      participant2: typeof row.participant2 === 'string' ? JSON.parse(row.participant2) : row.participant2,
      unreadCount: typeof row.unreadCount === 'string' ? parseInt(row.unreadCount) || 0 : (row.unreadCount || 0),
    }));

    // Fetch profile images for influencers
    const enrichedResults = await Promise.all(parsedResults.map(async (row) => {
      // Check participant1 profile image
      if (row.participant1?.userType === 'influencer') {
        const profile1 = await db.query.influencerProfiles.findFirst({
          where: eq(influencerProfiles.id, row.participant1.id)
        });
        if (profile1?.imageUrl && !row.participant1.image) {
          row.participant1.image = profile1.imageUrl;
        }
      }

      // Check participant2 profile image
      if (row.participant2?.userType === 'influencer') {
        const profile2 = await db.query.influencerProfiles.findFirst({
          where: eq(influencerProfiles.id, row.participant2.id)
        });
        if (profile2?.imageUrl && !row.participant2.image) {
          row.participant2.image = profile2.imageUrl;
        }
      }

      return row;
    }));

    return NextResponse.json(enrichedResults, { status: 200 });
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
    const { participant1Id, participant2Id } = body;

    if (!participant1Id || typeof participant1Id !== 'string' || participant1Id.trim() === '') {
      return NextResponse.json(
        { error: 'participant1Id is required and must be a non-empty string', code: 'INVALID_PARTICIPANT1_ID' },
        { status: 400 }
      );
    }

    if (!participant2Id || typeof participant2Id !== 'string' || participant2Id.trim() === '') {
      return NextResponse.json(
        { error: 'participant2Id is required and must be a non-empty string', code: 'INVALID_PARTICIPANT2_ID' },
        { status: 400 }
      );
    }

    if (participant1Id === participant2Id) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself', code: 'SAME_PARTICIPANT' },
        { status: 400 }
      );
    }

    // Check if both participants exist in the user table (prevent foreign key constraint error)
    // CSV-only influencers have IDs like "csv-email" and don't exist in user table
    if (participant1Id.startsWith('csv-') || participant2Id.startsWith('csv-')) {
      return NextResponse.json(
        { 
          error: 'Cannot create conversation with influencer who does not have an account', 
          code: 'USER_NOT_FOUND',
          message: 'This influencer hasn\'t joined the platform yet. Please view their profile for contact information.'
        },
        { status: 400 }
      );
    }

    // Verify both users exist in the database
    const [user1, user2] = await Promise.all([
      db.select().from(user).where(eq(user.id, participant1Id)).limit(1),
      db.select().from(user).where(eq(user.id, participant2Id)).limit(1),
    ]);

    if (user1.length === 0) {
      return NextResponse.json(
        { 
          error: 'Participant 1 not found', 
          code: 'USER_NOT_FOUND',
          participantId: participant1Id
        },
        { status: 404 }
      );
    }

    if (user2.length === 0) {
      return NextResponse.json(
        { 
          error: 'Participant 2 not found', 
          code: 'USER_NOT_FOUND',
          participantId: participant2Id,
          message: 'This influencer hasn\'t joined the platform yet. Please view their profile for contact information.'
        },
        { status: 404 }
      );
    }

    const existingConversation = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.participant1Id, participant1Id),
            eq(conversations.participant2Id, participant2Id)
          ),
          and(
            eq(conversations.participant1Id, participant2Id),
            eq(conversations.participant2Id, participant1Id)
          )
        )
      )
      .limit(1);

    if (existingConversation.length > 0) {
      return NextResponse.json(
        {
          error: 'Conversation already exists',
          code: 'CONVERSATION_EXISTS',
          conversationId: existingConversation[0].id,
        },
        { status: 409 }
      );
    }

    const newConversation = await db
      .insert(conversations)
      .values({
        participant1Id,
        participant2Id,
        lastMessageAt: null,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        conversation: newConversation[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}