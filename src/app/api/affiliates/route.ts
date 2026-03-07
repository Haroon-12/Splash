import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { affiliateLinks, clickEvents, user, campaigns } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import crypto from 'crypto';

// Helper function to generate a 6-character shortcode
function generateShortcode() {
    return crypto.randomBytes(4).toString('base64url').substring(0, 6);
}

// POST: Create a new Affiliate Tracking Link (Support Multi-Influencer Assignment)
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { destinationUrl, title, influencerIds, campaignId } = body;

        // Validation
        if (!destinationUrl || !destinationUrl.startsWith("http")) {
            return NextResponse.json({ error: "Valid Destination URL is required" }, { status: 400 });
        }

        const baseTitle = title || "New Affiliate Link";
        const parsedCampaignId = campaignId === "none" || !campaignId ? null : parseInt(campaignId);

        // Scenario A: Generate multiple personalized links
        if (influencerIds && Array.isArray(influencerIds) && influencerIds.length > 0) {

            const insertPromises = influencerIds.map(async (infId) => {
                const shortId = generateShortcode();

                // Get influencer name for slug
                const infRecord = await db.select({ name: user.name }).from(user).where(eq(user.id, infId)).limit(1);
                const safeName = infRecord[0]?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'inf';
                const safeTitle = baseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                // e.g. zellbury-sarah-x8jk
                const personalizedSlug = `${safeTitle}-${safeName}-${shortId}`;

                return db.insert(affiliateLinks).values({
                    id: personalizedSlug,
                    brandId: session.user.id,
                    destinationUrl,
                    title: baseTitle,
                    influencerId: infId,
                    campaignId: parsedCampaignId,
                });
            });

            await Promise.all(insertPromises);
            return NextResponse.json({ success: true, message: `Generated ${influencerIds.length} personalized links` });
        }

        // Scenario B: Generate one generic link
        const genericId = generateShortcode();
        await db.insert(affiliateLinks).values({
            id: genericId,
            brandId: session.user.id,
            destinationUrl,
            title: baseTitle,
            influencerId: null,
            campaignId: parsedCampaignId,
        });

        return NextResponse.json({ success: true, linkId: genericId, message: "Generic link generated successfully" });

    } catch (error) {
        console.error("Affiliate Link Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate tracking link" }, { status: 500 });
    }
}

// GET: Retrieve all links created by the current user (with click counts)
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Query 1: Fetch all links owned by this brand
        const rawLinks = await db
            .select({
                id: affiliateLinks.id,
                title: affiliateLinks.title,
                destinationUrl: affiliateLinks.destinationUrl,
                createdAt: affiliateLinks.createdAt,
                isActive: affiliateLinks.isActive,
                clicksCount: sql<number>`count(${clickEvents.id})`,
                influencerId: affiliateLinks.influencerId,
                influencerName: user.name,
                campaignTitle: campaigns.title,
            })
            .from(affiliateLinks)
            .leftJoin(clickEvents, eq(affiliateLinks.id, clickEvents.linkId))
            .leftJoin(user, eq(affiliateLinks.influencerId, user.id))
            .leftJoin(campaigns, eq(affiliateLinks.campaignId, campaigns.id))
            .where(eq(affiliateLinks.brandId, session.user.id))
            .groupBy(affiliateLinks.id)
            .orderBy(desc(affiliateLinks.createdAt));

        // Group Links by their `title` to create Master Links
        const groupedMap = new Map<string, any>();

        rawLinks.forEach(link => {
            const rawTitle = link.title || "Untitled Link";

            if (!groupedMap.has(rawTitle)) {
                groupedMap.set(rawTitle, {
                    title: rawTitle,
                    destinationUrl: link.destinationUrl,
                    createdAt: link.createdAt,
                    campaignTitle: link.campaignTitle,
                    totalClicks: 0,
                    children: [] // Sub-links assigned to specific influencers
                });
            }

            const masterGroup = groupedMap.get(rawTitle);
            masterGroup.totalClicks += Number(link.clicksCount) || 0;
            masterGroup.children.push({
                id: link.id,
                influencerName: link.influencerName || "Generic Target",
                clicksCount: Number(link.clicksCount) || 0
            });
        });

        const masterLinks = Array.from(groupedMap.values()).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Query 2: Fetch raw click events to build the timeseries chart data
        // We only fetch clicks that belong to links owned by this specific brand.
        const allClicks = await db
            .select({
                id: clickEvents.id,
                createdAt: clickEvents.createdAt,
                referrer: clickEvents.referrer,
                deviceType: clickEvents.deviceType
            })
            .from(clickEvents)
            .innerJoin(affiliateLinks, eq(clickEvents.linkId, affiliateLinks.id))
            .where(eq(affiliateLinks.brandId, session.user.id))
            .orderBy(desc(clickEvents.createdAt));

        // Transform raw clicks into a grouped array of dates for Recharts 
        // e.g. [{ date: "Mar 01", clicks: 5, instagram: 3, direct: 2 }]
        const chartMap = new Map<string, any>();

        allClicks.forEach(click => {
            if (!click.createdAt) return;
            const dateStr = click.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD

            if (!chartMap.has(dateStr)) {
                chartMap.set(dateStr, {
                    date: dateStr,
                    totalClicks: 0,
                    instagram: 0,
                    youtube: 0,
                    direct: 0,
                    other: 0
                });
            }

            const dayCounts = chartMap.get(dateStr);
            dayCounts.totalClicks += 1;

            // Bucket referrers
            const ref = (click.referrer || "").toLowerCase();
            if (ref.includes("instagram")) dayCounts.instagram += 1;
            else if (ref.includes("youtube")) dayCounts.youtube += 1;
            else if (ref.includes("direct")) dayCounts.direct += 1;
            else dayCounts.other += 1;
        });

        // Convert Map to an array sorted chronologically
        const chartData = Array.from(chartMap.values()).sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return NextResponse.json({ links: masterLinks, chartData });

    } catch (error) {
        console.error("Affiliate Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard links" }, { status: 500 });
    }
}
