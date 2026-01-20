export const STRIPE_PRICE_IDS = {
  standard: {
    monthly: "price_1SqXMaBaT1g3foMXaaiK6v5J",
    yearly: "price_1SqXZABaT1g3foMXZ4lhgrm5",
  },
  pro: {
    monthly: "price_1SqXPJBaT1g3foMXbwDerd0y",
    yearly: "price_1SqXbDBaT1g3foMX5n6lI4dK",
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
