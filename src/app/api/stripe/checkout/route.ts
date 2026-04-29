import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions, user } from "@/db/schema";
import { eq } from "drizzle-orm";

// Prices in cents
const PLAN_PRICES = {
  tier1: { monthly: 2500, yearly: 25000, name: "Professional Plan" },
  premium: { monthly: 8000, yearly: 80000, name: "Premium Plan" },
  team: { monthlyBase: 8000, yearlyBase: 80000, monthlyMember: 4200, yearlyMember: 42000, name: "Team Plan" },
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only brands can subscribe
    const currentUser = session.user as any;
    if (currentUser.userType !== "brand") {
      return NextResponse.json({ error: "Only brands can subscribe to plans." }, { status: 403 });
    }

    const body = await req.json();
    const { plan, interval, members } = body; // e.g. plan="tier1", interval="monthly", members=5

    if (!plan || !interval) {
      return NextResponse.json({ error: "Missing plan or interval" }, { status: 400 });
    }

    if (!PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Check if user already has a stripe customer ID
    let customerId;
    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.brandId, currentUser.id),
    });

    if (existingSub?.stripeCustomerId) {
      customerId = existingSub.stripeCustomerId;
    } else {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: currentUser.email,
        name: currentUser.name,
        metadata: {
          userId: currentUser.id,
        },
      });
      customerId = customer.id;
    }

    // Calculate dynamic price
    let unitAmount = 0;
    let productName = "";

    if (plan === "team") {
      const base = interval === "monthly" ? PLAN_PRICES.team.monthlyBase : PLAN_PRICES.team.yearlyBase;
      const perMember = interval === "monthly" ? PLAN_PRICES.team.monthlyMember : PLAN_PRICES.team.yearlyMember;
      const memberCount = parseInt(members || "5");
      unitAmount = base + (perMember * memberCount);
      productName = `Team Plan (${memberCount} users)`;
    } else {
      const planData = PLAN_PRICES[plan as 'tier1' | 'premium'];
      unitAmount = interval === "monthly" ? planData.monthly : planData.yearly;
      productName = planData.name;
    }

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: interval === "monthly" ? "month" : "year",
            }
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?canceled=true`,
      metadata: {
        userId: currentUser.id,
        planType: plan,
        billingInterval: interval,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
