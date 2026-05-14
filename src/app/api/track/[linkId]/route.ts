import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { affiliateLinks, clickEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ linkId: string }> }
) {
    try {
        const { linkId } = await params;

        // 1. Validate if the link exists and is active
        const [linkData] = await db
            .select()
            .from(affiliateLinks)
            .where(eq(affiliateLinks.id, linkId))
            .limit(1);

        if (!linkData || !linkData.isActive) {
            // If the link is disabled or fake, redirect to the Splash homepage
            return NextResponse.redirect(new URL("/", req.url));
        }

        // 2. Extract analytical metadata from browser headers
        const headersList = req.headers;

        // The Referer tells us which website they clicked the link on (e.g. instagram.com, youtube.com)
        const rawReferrer = headersList.get("referer") || "Direct Traffic";

        // IP Address extraction (Next.js edges typically forward this in x-forwarded-for)
        const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || "Unknown IP";
        
        // Country extraction (from AWS CloudFront, Vercel, or Cloudflare headers)
        const country = headersList.get("cloudfront-viewer-country") || headersList.get("x-vercel-ip-country") || headersList.get("cf-ipcountry") || "Unknown";

        // User Agent parsing (Desktop vs Mobile)
        const userAgent = headersList.get("user-agent") || "Unknown Device";
        let deviceType = "desktop";
        if (/mobile|android|iphone|ipad/i.test(userAgent)) {
            deviceType = "mobile";
        } else if (/tablet|ipad/i.test(userAgent)) {
            deviceType = "tablet";
        }

        // 3. Log the Interaction asynchronously 
        // We do NOT wait for this to finish before redirecting to ensure the customer feels no delay
        db.insert(clickEvents).values({
            linkId: linkData.id,
            ipAddress: ipAddress,
            userAgent: userAgent,
            deviceType: deviceType,
            referrer: rawReferrer,
            country: country,
        }).catch((err) => {
            console.error("Failed to log affiliate click:", err);
        });

        // 4. Instantly redirect the customer to the brand's destination page!
        return NextResponse.redirect(new URL(linkData.destinationUrl));

    } catch (error) {
        console.error("Affiliate Tracking Error:", error);
        return NextResponse.redirect(new URL("/", req.url));
    }
}
