import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

// Disable Next.js default body parser to verify the raw Stripe signature
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Only handle subscription checkouts
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;
        const billingInterval = session.metadata?.billingInterval;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userId || !subscriptionId) break;

        // Fetch subscription from Stripe to get period dates
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

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
            status: subscription.status,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
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
            status: subscription.status,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await db.update(subscriptions).set({
          status: subscription.status,
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date(),
        }).where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
