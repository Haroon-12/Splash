import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Retrieve checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (checkoutSession.payment_status !== "paid" || checkoutSession.mode !== "subscription") {
      return NextResponse.json({ error: "Session not paid or not a subscription" }, { status: 400 });
    }

    const userId = checkoutSession.metadata?.userId;
    const planType = checkoutSession.metadata?.planType;
    const billingInterval = checkoutSession.metadata?.billingInterval;
    const subscriptionId = checkoutSession.subscription as string;
    const customerId = checkoutSession.customer as string;

    if (!userId || !subscriptionId) {
      return NextResponse.json({ error: "Missing metadata in session" }, { status: 400 });
    }

    // Only update if it's the current user
    if (userId !== session.user.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch subscription details
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

    // Check if subscription record already exists
    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.brandId, userId),
    });

    if (existingSub) {
      // Update existing
      await db.update(subscriptions).set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        planType: planType || "basic",
        billingInterval: billingInterval,
        status: stripeSub.status,
        currentPeriodStart: new Date((stripeSub as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
        cancelAtPeriodEnd: (stripeSub as any).cancel_at_period_end,
        updatedAt: new Date(),
      }).where(eq(subscriptions.id, existingSub.id));
    } else {
      // Insert new
      await db.insert(subscriptions).values({
        id: crypto.randomUUID(),
        brandId: userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        planType: planType || "basic",
        billingInterval: billingInterval,
        status: stripeSub.status,
        currentPeriodStart: new Date((stripeSub as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
        cancelAtPeriodEnd: (stripeSub as any).cancel_at_period_end,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, planType });
  } catch (error: any) {
    console.error("Session verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
