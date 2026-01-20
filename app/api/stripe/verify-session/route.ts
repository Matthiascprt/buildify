import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPlanFromPriceId, PLAN_QUOTAS } from "@/lib/stripe/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 },
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (
      session.payment_status !== "paid" &&
      session.payment_status !== "no_payment_required"
    ) {
      return NextResponse.json(
        { error: "Paiement non confirmé" },
        { status: 400 },
      );
    }

    const userId = session.metadata?.user_id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID manquant dans la session Stripe" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("profile_id")
      .eq("profile_id", userId)
      .single();

    if (existingSub) {
      return NextResponse.json({
        success: true,
        message: "Subscription already exists",
      });
    }

    const subscription =
      session.subscription as import("stripe").Stripe.Subscription;
    const subscriptionItem = subscription?.items?.data?.[0];
    const priceId = subscriptionItem?.price?.id;
    const planInfo = priceId ? getPlanFromPriceId(priceId) : null;

    const subscriptionData = {
      profile_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription?.id || null,
      stripe_price_id: priceId || null,
      status: subscription?.status || "active",
      trial_end: subscription?.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_start: subscriptionItem?.current_period_start
        ? new Date(subscriptionItem.current_period_start * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: subscriptionItem?.current_period_end
        ? new Date(subscriptionItem.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription?.cancel_at_period_end || false,
      plan:
        planInfo?.plan ||
        (session.metadata?.plan as "standard" | "pro") ||
        null,
      quota_docs_per_period: planInfo
        ? PLAN_QUOTAS[planInfo.plan]
        : session.metadata?.plan
          ? PLAN_QUOTAS[session.metadata.plan as "standard" | "pro"]
          : 50,
      usage_docs_current_period: 0,
    };

    const { error } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData, { onConflict: "profile_id" });

    if (error) {
      console.error("Error creating subscription:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la création de l'abonnement",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      subscription: subscriptionData,
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
