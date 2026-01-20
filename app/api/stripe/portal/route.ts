import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("profile_id", user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 },
      );
    }

    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";

    const body = await req.json().catch(() => ({}));
    const { priceId } = body as { priceId?: string };

    // If a priceId is provided, redirect to subscription update flow
    if (priceId && subscription.stripe_subscription_id) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${origin}/billing`,
        flow_data: {
          type: "subscription_update_confirm",
          subscription_update_confirm: {
            subscription: subscription.stripe_subscription_id,
            items: [
              {
                id: (
                  await stripe.subscriptions.retrieve(
                    subscription.stripe_subscription_id,
                  )
                ).items.data[0].id,
                price: priceId,
              },
            ],
          },
        },
      });

      return NextResponse.json({ url: portalSession.url });
    }

    // Default: open the portal without a specific flow
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
