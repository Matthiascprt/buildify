import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/server";
import {
  getPriceId,
  PLAN_QUOTAS,
  type PlanType,
  type BillingCycle,
} from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, isYearly, email, userId } = body as {
      plan: PlanType;
      isYearly: boolean;
      email: string;
      userId: string;
    };

    if (!plan || !email || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const billingCycle: BillingCycle = isYearly ? "yearly" : "monthly";
    const priceId = getPriceId(plan, billingCycle);

    const headersList = await headers();
    const origin = headersList.get("origin") || "https://buildify.solutions";

    const supabase = await createClient();
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("profile_id", userId)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/onboarding?canceled=true`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id: userId,
          plan,
          billing_cycle: billingCycle,
          quota: PLAN_QUOTAS[plan].toString(),
        },
      },
      metadata: {
        user_id: userId,
        plan,
        billing_cycle: billingCycle,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
