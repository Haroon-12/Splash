import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns, collaborations, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user || session.user.userType !== 'brand') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const brandId = session.user.id;

        // 1. Fetch all Campaigns owned by this brand
        const activeCampaigns = await db
            .select({ id: campaigns.id, title: campaigns.title })
            .from(campaigns)
            .where(eq(campaigns.brandId, brandId));

        // 2. Fetch all Influencers on the platform
        const activeRoster = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email
            })
            .from(user)
            .where(eq(user.userType, "influencer"));

        // 3. Fetch Collaborations to link influencers to campaigns
        const activeCollaborations = await db
            .select({
                influencerId: collaborations.influencerId,
                campaignId: collaborations.campaignId,
                status: collaborations.status
            })
            .from(collaborations)
            .innerJoin(campaigns, eq(campaigns.id, collaborations.campaignId))
            .where(eq(campaigns.brandId, brandId));

        return NextResponse.json({
            campaigns: activeCampaigns,
            influencers: activeRoster,
            collaborations: activeCollaborations
        });

    } catch (error) {
        console.error("Affiliate Context Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard context" }, { status: 500 });
    }
}
