export const STRIPE_PRICE_IDS = {
  standard: {
    monthly: "price_1Ss65GB3puLNMu4qICqR1ohx",
    yearly: "price_1Ss65eB3puLNMu4qWx0fBB4z",
  },
  pro: {
    monthly: "price_1Ss68AB3puLNMu4qGWoL912p",
    yearly: "price_1Ss68mB3puLNMu4qiGAPPDj9",
  },
} as const;

export const PLAN_QUOTAS = {
  standard: 50,
  pro: 100,
} as const;

export type PlanType = keyof typeof STRIPE_PRICE_IDS;
export type BillingCycle = "monthly" | "yearly";

export function getPriceId(plan: PlanType, billingCycle: BillingCycle): string {
  return STRIPE_PRICE_IDS[plan][billingCycle];
}

export function getPlanFromPriceId(
  priceId: string,
): { plan: PlanType; billingCycle: BillingCycle } | null {
  for (const [plan, cycles] of Object.entries(STRIPE_PRICE_IDS)) {
    for (const [cycle, id] of Object.entries(cycles)) {
      if (id === priceId) {
        return {
          plan: plan as PlanType,
          billingCycle: cycle as BillingCycle,
        };
      }
    }
  }
  return null;
}
