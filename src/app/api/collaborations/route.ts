import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { collaborations, notifications, campaigns, user, influencerProfiles } from '@/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET all collaborations for the current user
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let conditions;
        if (currentUser.userType === 'brand') {
            conditions = eq(collaborations.brandId, currentUser.id);
        } else if (currentUser.userType === 'influencer') {
            conditions = eq(collaborations.influencerId, currentUser.id);
        } else {
            // Admin can see all
            conditions = undefined;
        }

        if (status && conditions) {
            conditions = and(conditions, eq(collaborations.status, status));
        } else if (status) {
            conditions = eq(collaborations.status, status);
        }

        const results = await db
            .select({
                id: collaborations.id,
                status: collaborations.status,
                dealAmount: collaborations.dealAmount,
                proposedAmount: collaborations.proposedAmount,
                negotiationStatus: collaborations.negotiationStatus,
                paymentStatus: collaborations.paymentStatus,
                startedAt: collaborations.startedAt,
                completedAt: collaborations.completedAt,
                campaignId: collaborations.campaignId,
                brandId: collaborations.brandId,
                influencerId: collaborations.influencerId,
                campaign: {
                    title: campaigns.title,
                    budget: campaigns.budget
                },
                brand: {
                    name: user.name,
                },
                influencer: {
                    name: user.name
                }
            })
            .from(collaborations)
            .leftJoin(campaigns, eq(collaborations.campaignId, campaigns.id))
            .leftJoin(user, or(eq(collaborations.brandId, user.id), eq(collaborations.influencerId, user.id))) // We will format this map client side
            .where(conditions)
            .orderBy(desc(collaborations.createdAt));

        // Cleanup joining duplicate rows due to multiple user joins
        // A better approach in Drizzle is multiple specific aliased joins but map sorting works for standard sizes
        const uniqueCollabs = new Map();
        for (const r of results) {
            if (!uniqueCollabs.has(r.id)) {
                // Re-fetch exact users to avoid alias map bleeding
                const b = await db.select({ name: user.name }).from(user).where(eq(user.id, r.brandId)).limit(1);
                const i = await db.select({ name: user.name }).from(user).where(eq(user.id, r.influencerId)).limit(1);

                uniqueCollabs.set(r.id, {
                    id: r.id,
                    status: r.status,
                    dealAmount: r.dealAmount,
                    proposedAmount: r.proposedAmount,
                    negotiationStatus: r.negotiationStatus,
                    paymentStatus: r.paymentStatus,
                    brandId: r.brandId,
                    influencerId: r.influencerId,
                    campaignId: r.campaignId,
                    campaignTitle: r.campaign ? r.campaign.title : 'Deleted Campaign',
                    brandName: b[0]?.name || 'Unknown Brand',
                    influencerName: i[0]?.name || 'Unknown Influencer',
                    startedAt: r.startedAt,
                    completedAt: r.completedAt
                });
            }
        }

        return NextResponse.json({ collaborations: Array.from(uniqueCollabs.values()) }, { status: 200 });

    } catch (error) {
        console.error('Error fetching collaborations:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
    }
}

// POST to create a new pending collaboration (Brand Invites Influencer)
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser || currentUser.userType !== 'brand') {
            return NextResponse.json({ error: 'Unauthorized. Only brands can send invites.' }, { status: 401 });
        }

        const body = await request.json();
        const { influencerId, campaignId, dealAmount } = body;

        if (!influencerId || !campaignId) {
            return NextResponse.json({ error: 'Influencer ID and Campaign ID are required.' }, { status: 400 });
        }

        // Ensure they haven't already invited this influencer to this specific campaign
        const existingCollab = await db.query.collaborations.findFirst({
            where: and(
                eq(collaborations.brandId, currentUser.id),
                eq(collaborations.influencerId, influencerId),
                eq(collaborations.campaignId, campaignId)
            )
        });

        if (existingCollab) {
            return NextResponse.json({ error: 'You have already invited this influencer to this campaign.' }, { status: 400 });
        }

        // Insert pending collaboration
        const newCollab = await db.insert(collaborations).values({
            brandId: currentUser.id,
            influencerId: influencerId,
            campaignId: campaignId,
            dealAmount: dealAmount ? parseInt(dealAmount) : null,
            negotiationStatus: 'pending_influencer',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        // Trigger standard notification for the influencer
        await db.insert(notifications).values({
            userId: influencerId,
            type: 'new_collaboration_offer',
            title: `Collaboration Request: ${currentUser.name || 'A Brand'}`,
            message: `${currentUser.name || 'A new brand'} just invited you to join their marketing campaign!`,
            isSmartAlert: false,
            actionUrl: '/dashboard/collaborations',
            createdAt: new Date()
        });

        return NextResponse.json({ success: true, collaboration: newCollab[0] }, { status: 201 });

    } catch (error) {
        console.error('Error creating collaboration:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
    }
}

// PATCH to update status (Accept, Decline, Complete)
export async function PATCH(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { collaborationId, status, proposedAmount } = body; 
        // status can be 'active' (accept), 'cancelled' (decline), 'completed', 'propose', 'agree_proposal'

        if (!collaborationId || !status) {
            return NextResponse.json({ error: 'Collaboration ID and Status are required.' }, { status: 400 });
        }

        // Find the specific collaboration
        const collab = await db.query.collaborations.findFirst({
            where: eq(collaborations.id, collaborationId)
        });

        if (!collab) {
            return NextResponse.json({ error: 'Collaboration not found' }, { status: 404 });
        }

        // Permission checks
        if (currentUser.userType === 'influencer' && collab.influencerId !== currentUser.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (currentUser.userType === 'brand' && collab.brandId !== currentUser.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update payload
        const updatePayload: any = {
            updatedAt: new Date()
        };

        let notifTitle = "Collaboration Update";
        let notifMessage = `Your collaboration status was updated to ${status}.`;

        if (status === 'propose' && currentUser.userType === 'influencer') {
            updatePayload.proposedAmount = parseInt(proposedAmount);
            updatePayload.negotiationStatus = 'pending_brand';
            notifTitle = "Counter Offer Received";
            notifMessage = `The influencer has proposed a new deal amount for your campaign.`;
        } else if (status === 'agree_proposal' && currentUser.userType === 'brand') {
            updatePayload.dealAmount = collab.proposedAmount;
            updatePayload.proposedAmount = null;
            updatePayload.negotiationStatus = 'accepted';
            updatePayload.status = 'active';
            updatePayload.startedAt = new Date();
            notifTitle = "Offer Accepted! 🎉";
            notifMessage = `The brand agreed to your counter offer!`;
        } else if (status === 'active' && collab.status === 'pending') {
            updatePayload.status = 'active';
            updatePayload.negotiationStatus = 'accepted';
            updatePayload.startedAt = new Date();
            notifTitle = "Offer Accepted! 🎉";
            notifMessage = `Great news! An influencer accepted your campaign invite. You can now chat with them to start the campaign.`;
        } else if (status === 'completed') {
            updatePayload.status = 'completed';
            updatePayload.completedAt = new Date();
            
            // Add brand to influencer's previous collaborations
            const b = await db.select({ name: user.name }).from(user).where(eq(user.id, collab.brandId)).limit(1);
            const p = await db.select({ previousBrands: influencerProfiles.previousBrands }).from(influencerProfiles).where(eq(influencerProfiles.id, collab.influencerId)).limit(1);
            
            if (b.length > 0 && p.length > 0) {
                const brandName = b[0].name || 'A Brand';
                const currentBrands = p[0].previousBrands || '';
                
                if (!currentBrands.includes(brandName)) {
                    const updatedBrands = currentBrands ? `${currentBrands}, ${brandName}` : brandName;
                    await db.update(influencerProfiles)
                        .set({ previousBrands: updatedBrands })
                        .where(eq(influencerProfiles.id, collab.influencerId));
                }
            }
        } else if (status === 'cancelled') {
            updatePayload.status = 'cancelled';
            notifTitle = "Collaboration Cancelled";
            notifMessage = `A collaboration deal was declined or cancelled.`;
        }

        await db.update(collaborations)
            .set(updatePayload)
            .where(eq(collaborations.id, collaborationId));

        // Send a notification to the OTHER party that the status changed
        const recipientId = currentUser.userType === 'brand' ? collab.influencerId : collab.brandId;
        
        await db.insert(notifications).values({
            userId: recipientId,
            type: 'collaboration_update',
            title: notifTitle,
            message: notifMessage,
            isSmartAlert: true,
            actionUrl: '/dashboard/campaigns',
            createdAt: new Date()
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Error updating collaboration:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
    }
}
