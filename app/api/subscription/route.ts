import { NextResponse } from "next/server";
import {
  getSubscription,
  checkQuotaAvailable,
} from "@/lib/supabase/subscription";

export async function GET() {
  try {
    const [subscription, quota] = await Promise.all([
      getSubscription(),
      checkQuotaAvailable(),
    ]);

    if (!subscription) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      subscription,
      nextResetDate: quota.nextResetDate,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
