import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Subscription } from "./types";

export async function getSubscription(): Promise<Subscription | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }

  return data;
}

function getMonthlyPeriodDates(subscriptionStart: string | null): {
  periodStart: Date;
  periodEnd: Date;
} {
  const now = new Date();

  if (!subscriptionStart) {
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { periodStart, periodEnd };
  }

  const startDate = new Date(subscriptionStart);
  const subscriptionDay = startDate.getDate();

  let periodStart: Date;
  let periodEnd: Date;

  if (now.getDate() >= subscriptionDay) {
    periodStart = new Date(now.getFullYear(), now.getMonth(), subscriptionDay);
    periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      subscriptionDay - 1,
    );
  } else {
    periodStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      subscriptionDay,
    );
    periodEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      subscriptionDay - 1,
    );
  }

  periodEnd.setHours(23, 59, 59, 999);

  return { periodStart, periodEnd };
}

export async function checkQuotaAvailable(): Promise<{
  available: boolean;
  remaining: number;
  limit: number;
  used: number;
  status: string | null;
  plan: "standard" | "pro" | null;
  nextResetDate: string | null;
}> {
  const subscription = await getSubscription();

  if (!subscription) {
    return {
      available: false,
      remaining: 0,
      limit: 0,
      used: 0,
      status: null,
      plan: null,
      nextResetDate: null,
    };
  }

  const blockedStatuses = [
    "canceled",
    "past_due",
    "unpaid",
    "incomplete_expired",
  ];

  const { periodStart, periodEnd } = getMonthlyPeriodDates(
    subscription.current_period_start,
  );
  const nextResetDate = new Date(periodEnd);
  nextResetDate.setDate(nextResetDate.getDate() + 1);
  nextResetDate.setHours(0, 0, 0, 0);

  const updatedAt = subscription.updated_at
    ? new Date(subscription.updated_at)
    : null;
  const needsReset = updatedAt && updatedAt < periodStart;

  let currentUsage = subscription.usage_docs_current_period || 0;

  if (needsReset) {
    const supabaseService = createServiceClient();
    await supabaseService
      .from("subscriptions")
      .update({
        usage_docs_current_period: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", subscription.profile_id);

    currentUsage = 0;
  }

  if (subscription.status && blockedStatuses.includes(subscription.status)) {
    return {
      available: false,
      remaining: 0,
      limit: subscription.quota_docs_per_period || 0,
      used: currentUsage,
      status: subscription.status,
      plan: subscription.plan,
      nextResetDate: nextResetDate.toISOString(),
    };
  }

  const limit = subscription.quota_docs_per_period || 0;
  const remaining = Math.max(0, limit - currentUsage);

  return {
    available: remaining > 0,
    remaining,
    limit,
    used: currentUsage,
    status: subscription.status,
    plan: subscription.plan,
    nextResetDate: nextResetDate.toISOString(),
  };
}

export async function incrementDocumentUsage(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const supabaseService = createServiceClient();

  const { data: subscription, error: fetchError } = await supabaseService
    .from("subscriptions")
    .select(
      "usage_docs_current_period, quota_docs_per_period, current_period_start, updated_at, profile_id",
    )
    .eq("profile_id", user.id)
    .single();

  if (fetchError || !subscription) {
    return { success: false, error: "Abonnement non trouvé" };
  }

  const { periodStart } = getMonthlyPeriodDates(
    subscription.current_period_start,
  );
  const updatedAt = subscription.updated_at
    ? new Date(subscription.updated_at)
    : null;
  const needsReset = updatedAt && updatedAt < periodStart;

  const currentUsage = needsReset
    ? 0
    : subscription.usage_docs_current_period || 0;

  const { error: updateError } = await supabaseService
    .from("subscriptions")
    .update({
      usage_docs_current_period: currentUsage + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", user.id);

  if (updateError) {
    console.error("Error incrementing document usage:", updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
