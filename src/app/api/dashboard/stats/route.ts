import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, influencerProfiles, notifications, messages, conversations, campaigns, collaborations, affiliateLinks, clickEvents } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { getAllClaims } from '@/lib/file-claims-store';
import { checkUserSuspension } from '@/lib/suspension-check';

export async function GET(request: NextRequest) {
  try {
    // Check if user is suspended
    const suspensionCheck = await checkUserSuspension(request);
    if (suspensionCheck) {
      return suspensionCheck;
    }

    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = currentUser.userType;

    if (userType === 'admin') {
      // Admin dashboard stats
      const claims = await getAllClaims();

      const pendingClaims = claims.filter(claim => claim.status === 'pending').length;
      const approvedClaims = claims.filter(claim => claim.status === 'approved').length;
      const rejectedClaims = claims.filter(claim => claim.status === 'rejected').length;

      // Get total users count
      const totalUsers = await db.query.user.findMany();
      const totalUsersCount = totalUsers.length;

      // Get users by type
      const influencers = totalUsers.filter(user => user.userType === 'influencer').length;
      const brands = totalUsers.filter(user => user.userType === 'brand').length;
      const admins = totalUsers.filter(user => user.userType === 'admin').length;

      // Get approved users count
      const approvedUsers = totalUsers.filter(user => user.isApproved).length;

      return NextResponse.json({
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        totalUsers: totalUsersCount,
        influencers,
        brands,
        admins,
        approvedUsers,
        totalClaims: claims.length
      });

    } else if (userType === 'influencer') {
      // Influencer dashboard stats
      const userId = currentUser.id;

      // Get influencer profile
      const profile = await db.query.influencerProfiles.findFirst({
        where: eq(influencerProfiles.id, userId)
      });

      // Get unread notifications count
      const unreadNotifications = await db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      });
      const notificationsCount = unreadNotifications.length;

      // Get conversations where user is a participant
      const userConversations = await db.query.conversations.findMany({
        where: or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      });

      // Get unread messages count across all conversations
      let messagesCount = 0;
      for (const conversation of userConversations) {
        const unreadMessages = await db.query.messages.findMany({
          where: and(
            eq(messages.conversationId, conversation.id),
            eq(messages.isRead, false)
          )
        });

        // Filter out messages sent by the current user
        const messagesToUser = unreadMessages.filter(msg => msg.senderId !== userId);
        messagesCount += messagesToUser.length;
      }

      // Calculate profile completeness based on filled fields
      let profileCompleteness = 0;
      if (profile) {
        const fields = [
          profile.category,
          profile.description,
          profile.instagram,
          profile.youtube,
          profile.facebook,
          profile.tiktok,
          profile.previousBrands,
          profile.gender,
          profile.activeHours,
        ];

        const filledFields = fields.filter(field => field && field.trim() !== '').length;

        // Add social metrics (followers count)
        const socialMetrics = [
          profile.instagramFollowers,
          profile.youtubeFollowers,
          profile.facebookFollowers,
          profile.tiktokFollowers,
        ].filter(field => field && field.trim() !== '').length;

        const totalFields = fields.length + 4; // Include social metrics
        const completedFields = filledFields + socialMetrics;

        profileCompleteness = Math.round((completedFields / totalFields) * 100);

        // Update the profile completeness in database
        if (profileCompleteness !== profile.profileCompleteness) {
          await db.update(influencerProfiles)
            .set({
              profileCompleteness,
              updatedAt: new Date()
            })
            .where(eq(influencerProfiles.id, userId));
        }
      }

      // Get campaigns where influencer is part of collaborations
      const influencerCollaborations = await db.query.collaborations.findMany({
        where: eq(collaborations.influencerId, userId)
      });

      // Count active campaigns (campaigns with active collaborations)
      const activeCampaigns = influencerCollaborations.filter(c => c.status === 'active').length;

      return NextResponse.json({
        profileCompleteness,
        notificationsCount,
        messagesCount,
        hasProfile: !!profile,
        activeCampaigns
      });

    } else if (userType === 'brand') {
      // Brand dashboard stats
      const userId = currentUser.id;

      // Get active campaigns (status = 'active')
      const allCampaigns = await db.query.campaigns.findMany({
        where: eq(campaigns.brandId, userId)
      });
      const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;

      // Get unique influencers connected through collaborations
      const allCollaborations = await db.query.collaborations.findMany({
        where: eq(collaborations.brandId, userId)
      });
      const uniqueInfluencerIds = new Set(
        allCollaborations
          .filter(c => c.status === 'active' || c.status === 'completed')
          .map(c => c.influencerId)
      );
      const influencersConnected = uniqueInfluencerIds.size;

      // Get conversations where brand is a participant
      const userConversations = await db.query.conversations.findMany({
        where: or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      });

      // Get unread messages count across all conversations
      let messagesCount = 0;
      for (const conversation of userConversations) {
        const unreadMessages = await db.query.messages.findMany({
          where: and(
            eq(messages.conversationId, conversation.id),
            eq(messages.isRead, false)
          )
        });

        // Filter out messages sent by the current user
        const messagesToUser = unreadMessages.filter(msg => msg.senderId !== userId);
        messagesCount += messagesToUser.length;
      }

      // Calculate total Affiliate Interactions
      const brandLinks = await db.query.affiliateLinks.findMany({
        where: eq(affiliateLinks.brandId, userId)
      });
      const linkIds = brandLinks.map(l => l.id);

      let totalClicks = 0;
      if (linkIds.length > 0) {
        const allClicks = await db.query.clickEvents.findMany({
          where: (fields) => or(...linkIds.map(id => eq(fields.linkId, id)))
        });
        totalClicks = allClicks.length;
      }

      return NextResponse.json({
        activeCampaigns,
        influencersConnected,
        messagesCount,
        totalClicks
      });

    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard statistics'
    }, { status: 500 });
  }
}
