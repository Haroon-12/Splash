import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, influencerProfiles, campaigns, conversations, messages, user } from '@/db/schema';
import { eq, and, desc, ne, sql, not, gt } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let generatedCount = 0;
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        // 1. Check Profile Completeness (for Influencers)
        if (currentUser.userType === 'influencer') {
            const profileResult = await db
                .select()
                .from(influencerProfiles)
                .where(eq(influencerProfiles.id, currentUser.id))
                .limit(1);

            if (profileResult.length > 0) {
                const profile = profileResult[0];

                // Basic check for important missing fields
                const isMissingRateCard = !profile.rateCard || profile.rateCard === '[]' || profile.rateCard === '{}';
                const isMissingPortfolio = !profile.portfolioSamples || profile.portfolioSamples === '[]';

                if (isMissingRateCard || isMissingPortfolio) {
                    // Check if we already sent this alert recently to avoid spam (within last 7 days)
                    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    const sevenDaysAgoSeconds = Math.floor(sevenDaysAgo.getTime() / 1000);

                    const existingAlerts = await db
                        .select()
                        .from(notifications)
                        .where(
                            and(
                                eq(notifications.userId, currentUser.id),
                                eq(notifications.type, 'profile_optimization'),
                                sql`${notifications.createdAt} > ${sevenDaysAgoSeconds}`
                            )
                        )
                        .limit(1);

                    if (existingAlerts.length === 0) {
                        await db.insert(notifications).values({
                            userId: currentUser.id,
                            type: 'profile_optimization',
                            title: 'Profile Optimization Opportunity ✨',
                            message: `Your profile gets 3x more visibility with a complete portfolio and rate card. Take 2 minutes to upload them now!`,
                            isSmartAlert: true,
                            actionUrl: '/dashboard/profile/edit',
                            metadata: JSON.stringify({ missingRateCard: isMissingRateCard, missingPortfolio: isMissingPortfolio })
                        });
                        generatedCount++;
                    }
                }

                // 2. High Match Campaign Opportunities
                // Find active campaigns matching their category where they have enough followers (using instagram as baseline for MVP)
                const followers = profile.instagramFollowers ? parseInt(profile.instagramFollowers.replace(/[^0-9]/g, '')) * (profile.instagramFollowers.toUpperCase().includes('K') ? 1000 : profile.instagramFollowers.toUpperCase().includes('M') ? 1000000 : 1) : 0;

                if (profile.category) {
                    const matchingCampaigns = await db
                        .select({
                            id: campaigns.id,
                            title: campaigns.title,
                            brandName: user.name
                        })
                        .from(campaigns)
                        .leftJoin(user, eq(campaigns.brandId, user.id))
                        .where(
                            and(
                                eq(campaigns.status, 'active'),
                                eq(campaigns.category, profile.category),
                                // if campaign has minFollowers, influencer must meet it
                                sql`(${campaigns.minFollowers} IS NULL OR ${followers} >= ${campaigns.minFollowers})`
                            )
                        )
                        .orderBy(desc(campaigns.createdAt))
                        .limit(3);

                    for (const camp of matchingCampaigns) {
                        // Check if alert already exists for this specific campaign
                        const alertExists = await db
                            .select()
                            .from(notifications)
                            .where(
                                and(
                                    eq(notifications.userId, currentUser.id),
                                    eq(notifications.type, 'campaign_match'),
                                    sql`json_extract(${notifications.metadata}, '$.campaignId') = ${camp.id}`
                                )
                            )
                            .limit(1);

                        if (alertExists.length === 0) {
                            await db.insert(notifications).values({
                                userId: currentUser.id,
                                type: 'campaign_match',
                                title: 'High Compatibility Campaign Match 🚀',
                                message: `${camp.brandName || 'A brand'} just launched "${camp.title}", and your profile perfectly aligns with their required category and follower count!`,
                                isSmartAlert: true,
                                actionUrl: `/dashboard/campaigns/${camp.id}`,
                                metadata: JSON.stringify({ campaignId: camp.id })
                            });
                            generatedCount++;
                        }
                    }
                }
            }
        }

        // 3. Conversation Follow-ups (For both Brands and Influencers)
        // Find conversations where the other party sent the last message > 48 hours ago
        const activeConversations = await db
            .select({
                id: conversations.id,
                participant1Id: conversations.participant1Id,
                participant2Id: conversations.participant2Id,
                lastMessageAt: conversations.lastMessageAt
            })
            .from(conversations)
            .where(
                and(
                    sql`(${conversations.participant1Id} = ${currentUser.id} OR ${conversations.participant2Id} = ${currentUser.id})`,
                    sql`${conversations.lastMessageAt} < ${fortyEightHoursAgo.toISOString()}`
                )
            );

        for (const conv of activeConversations) {
            if (!conv.lastMessageAt) continue;

            // Ensure we haven't already sent a follow-up alert recently for this conversation
            const existingAlert = await db
                .select()
                .from(notifications)
                .where(
                    and(
                        eq(notifications.userId, currentUser.id),
                        eq(notifications.type, 'conversation_follow_up'),
                        sql`json_extract(${notifications.metadata}, '$.conversationId') = ${conv.id}`,
                        sql`${notifications.createdAt} > ${Math.floor(fortyEightHoursAgo.getTime() / 1000)}`
                    )
                )
                .limit(1);

            if (existingAlert.length > 0) continue;

            // Get the very last message in this conversation
            const lastMsg = await db
                .select()
                .from(messages)
                .where(eq(messages.conversationId, conv.id))
                .orderBy(desc(messages.createdAt))
                .limit(1);

            if (lastMsg.length > 0) {
                // If the last message was NOT sent by the current user, it means THEY are the ones who haven't replied.
                // AND the message is still unread by them
                if (lastMsg[0].senderId !== currentUser.id && !lastMsg[0].isRead) {
                    await db.insert(notifications).values({
                        userId: currentUser.id,
                        type: 'conversation_follow_up',
                        title: 'Action Required: Waiting for your reply ⏳',
                        message: `It has been over 48 hours since you received a message in an active conversation. Prompt replies increase your collaboration success rate!`,
                        isSmartAlert: true,
                        actionUrl: `/dashboard/chat?conversation=${conv.id}`,
                        metadata: JSON.stringify({ conversationId: conv.id })
                    });
                    generatedCount++;
                }
            }
        }

        return NextResponse.json({ success: true, generated: generatedCount });
    } catch (error) {
        console.error('Error generating smart alerts:', error);
        return NextResponse.json({ error: 'Failed to generate smart alerts' }, { status: 500 });
    }
}
