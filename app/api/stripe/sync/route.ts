import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPlanFromPriceId, PLAN_QUOTAS } from "@/lib/stripe/config";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, current_period_start")
      .eq("profile_id", user.id)
      .single();

    if (!existingSub?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 },
      );
    }

    const subscription = await stripe.subscriptions.retrieve(
      existingSub.stripe_subscription_id,
    );

    const subscriptionItem = subscription.items.data[0];
    const priceId = subscriptionItem?.price.id;
    const planInfo = priceId ? getPlanFromPriceId(priceId) : null;

    const periodStart = subscriptionItem?.current_period_start;
    const periodEnd = subscriptionItem?.current_period_end;

    const supabaseService = createServiceClient();

    // IMPORTANT: Ne JAMAIS reset le compteur ici lors d'un sync
    // Le compteur ne doit être reset que via webhook invoice.paid
    // Cela évite qu'un changement de plan mid-cycle reset le compteur
    const updateData: Record<string, unknown> = {
      stripe_price_id: priceId,
      status: subscription.status,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : null,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      plan: planInfo?.plan || null,
      quota_docs_per_period: planInfo ? PLAN_QUOTAS[planInfo.plan] : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseService
      .from("subscriptions")
      .update(updateData)
      .eq("profile_id", user.id);

    if (error) {
      console.error("Error syncing subscription:", error);
      return NextResponse.json(
        { error: "Erreur lors de la synchronisation" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        plan: planInfo?.plan,
        billingCycle: planInfo?.billingCycle,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error("Error syncing subscription:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
