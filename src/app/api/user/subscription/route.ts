import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { adGenerations } from "@/db/schema";
import { eq, and, gte, count } from "drizzle-orm";
import { getUserSubscription } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await getUserSubscription(session.user.id);

    const periodStart = sub?.currentPeriodStart || new Date(new Date().setDate(1));
    const usageResult = await db.select({ count: count() })
        .from(adGenerations)
        .where(
            and(
                eq(adGenerations.brandId, session.user.id),
                gte(adGenerations.createdAt, periodStart)
            )
        );
    const adsGenerated = usageResult[0].count;

    if (!sub || sub.status !== "active") {
      return NextResponse.json({
        planType: "basic",
        billingInterval: "monthly",
        status: "inactive",
        adsGenerated,
      });
    }

    return NextResponse.json({
      planType: sub.planType,
      billingInterval: sub.billingInterval,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      adsGenerated,
    });
  } catch (error: any) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
