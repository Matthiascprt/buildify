"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  Zap,
  TrendingUp,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Subscription } from "@/lib/supabase/types";
import { STRIPE_PRICE_IDS } from "@/lib/stripe/config";

const plans = [
  {
    id: "standard",
    name: "Standard",
    monthlyPrice: "29,90",
    yearlyPrice: "299,90",
    yearlyMonthlyPrice: "24,90",
    description: "Parfait pour les artisans indépendants",
    features: [
      "50 documents/mois",
      "Création et édition devis/factures",
      "Dictée vocale IA",
      "PDF export et génération automatique",
      "Gestion clients & contacts",
    ],
    quota: 50,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: "49,90",
    yearlyPrice: "499,90",
    yearlyMonthlyPrice: "41,90",
    description: "Pour les artisans avec plus de volume",
    features: [
      "100 documents/mois",
      "Création et édition devis/factures",
      "Dictée vocale IA",
      "PDF export et génération automatique",
      "Gestion clients & contacts",
    ],
    quota: 100,
    popular: true,
  },
];

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPlanDisplayName(plan: string | null): string {
  if (plan === "standard") return "Standard";
  if (plan === "pro") return "Pro";
  return "Inconnu";
}

function getBillingCycle(priceId: string | null): "monthly" | "yearly" {
  if (!priceId) return "monthly";
  if (priceId.includes("yearly") || priceId.includes("annual")) return "yearly";
  const yearlyPriceIds = [
    STRIPE_PRICE_IDS.standard.yearly,
    STRIPE_PRICE_IDS.pro.yearly,
  ];
  return yearlyPriceIds.includes(priceId) ? "yearly" : "monthly";
}

export default function BillingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [nextResetDate, setNextResetDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (!res.ok) {
        if (res.status === 404) {
          setSubscription(null);
          return;
        }
        throw new Error("Erreur lors du chargement");
      }
      const data = await res.json();
      setSubscription(data.subscription);
      setNextResetDate(data.nextResetDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, []);

  const syncAndFetchSubscription = useCallback(async () => {
    try {
      await fetch("/api/stripe/sync", { method: "POST" });
    } catch (err) {
      console.error("Sync error:", err);
    }
    await fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    syncAndFetchSubscription();
  }, [syncAndFetchSubscription]);

  async function handleManageSubscription() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors de l'ouverture du portail");
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivateSubscription() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la réactivation");
      await fetchSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleChangePlan(planId: "standard" | "pro") {
    setActionLoading(true);
    try {
      const billingCycle = isYearly ? "yearly" : "monthly";
      const priceId = STRIPE_PRICE_IDS[planId][billingCycle];
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ouverture du portail");
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucun abonnement</h2>
          <p className="text-muted-foreground">
            Vous n&apos;avez pas encore d&apos;abonnement actif.
          </p>
        </div>
      </div>
    );
  }

  const isTrialing = subscription.status === "trialing";
  const isCancelled = subscription.cancel_at_period_end;
  const billingCycle = getBillingCycle(subscription.stripe_price_id);
  const currentPlan = plans.find((p) => p.id === subscription.plan);
  const price = currentPlan
    ? billingCycle === "yearly"
      ? currentPlan.yearlyMonthlyPrice
      : currentPlan.monthlyPrice
    : "0";

  const usage = {
    used: subscription.usage_docs_current_period || 0,
    limit: subscription.quota_docs_per_period || 0,
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-background to-muted/20">
      <div className="w-full py-8 px-6 lg:px-10">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 underline text-sm"
            >
              Fermer
            </button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Abonnement</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre abonnement, suivez votre utilisation et consultez vos
            factures
          </p>
        </div>

        {isTrialing && subscription.trial_end && (
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">Période d&apos;essai gratuit</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Votre essai gratuit se termine le{" "}
              {formatDate(subscription.trial_end)}. Vous ne serez pas facturé
              avant cette date.
            </p>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            Utilisation ce mois
          </h3>
          <UsageCard
            title="Documents"
            used={usage.used}
            limit={usage.limit}
            unit=""
            nextResetDate={nextResetDate}
          />
        </div>

        <div className="mb-8 rounded-lg border bg-card p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-md border flex items-center justify-center ${
                    isCancelled
                      ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
                      : "border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20"
                  }`}
                >
                  <Zap
                    className={`h-4 w-4 ${isCancelled ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      Plan {getPlanDisplayName(subscription.plan)}
                    </h2>
                    {isCancelled ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md">
                        Annulé
                      </span>
                    ) : isTrialing ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-md">
                        Essai gratuit
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-md">
                        Actif
                      </span>
                    )}
                  </div>
                  {isCancelled ? (
                    <p className="text-muted-foreground text-sm">
                      Accès jusqu&apos;au{" "}
                      {formatDate(subscription.current_period_end)}
                    </p>
                  ) : isTrialing ? (
                    <p className="text-muted-foreground text-sm">
                      Essai jusqu&apos;au {formatDate(subscription.trial_end)}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Prochain renouvellement le{" "}
                      {formatDate(subscription.current_period_end)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{price}€</span>
                <span className="text-muted-foreground">HT /mois</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={actionLoading}
                className="flex-1 sm:flex-none"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Gérer l&apos;abonnement
              </Button>
              {isCancelled && (
                <Button
                  variant="default"
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {actionLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Réactiver l&apos;abonnement
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            Changer de plan
          </h3>

          <div className="flex items-center gap-3 mb-6 p-3 bg-muted/50 rounded-lg w-fit">
            <span
              className={`text-sm font-medium transition-colors ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}
            >
              Mensuel
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isYearly ? "bg-orange-600" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                  isYearly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${isYearly ? "text-foreground" : "text-muted-foreground"}`}
            >
              Annuel
            </span>
            {isYearly && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-orange-600 text-white rounded-md">
                2 mois offerts
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
            {plans.map((plan) => {
              const isSamePlan = plan.id === subscription.plan;
              const isSameBillingCycle =
                isYearly === (billingCycle === "yearly");
              const isCurrent = isSamePlan && isSameBillingCycle;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-lg border bg-card p-6 transition-all ${
                    isCurrent
                      ? "border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20"
                      : "hover:border-orange-200 dark:hover:border-orange-900"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-orange-600 text-white rounded-md">
                        Plan actuel
                      </span>
                    </div>
                  )}
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-orange-600 text-white rounded-md">
                        Le plus populaire
                      </span>
                    </div>
                  )}
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold">
                      {isYearly ? plan.yearlyMonthlyPrice : plan.monthlyPrice}€
                    </span>
                    <span className="text-muted-foreground">HT /mois</span>
                  </div>
                  {isYearly && (
                    <p className="text-xs text-muted-foreground mb-6">
                      soit {plan.yearlyPrice}€ HT /an
                    </p>
                  )}
                  {!isYearly && <div className="mb-6" />}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || actionLoading}
                    onClick={() =>
                      handleChangePlan(plan.id as "standard" | "pro")
                    }
                    className={`w-full ${!isCurrent ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}`}
                  >
                    {isCurrent ? "Plan actuel" : "Choisir ce plan"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCard({
  title,
  used,
  limit,
  unit,
  nextResetDate,
}: {
  title: string;
  used: number;
  limit: number;
  unit: string;
  nextResetDate: string | null;
}) {
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const isHigh = percentage > 80;

  const formattedResetDate = nextResetDate
    ? new Date(nextResetDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-md ${
            isHigh
              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold">{used}</span>
        <span className="text-muted-foreground text-sm">
          / {limit} {unit}
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-1.5 ${isHigh ? "[&>div]:bg-orange-600" : "[&>div]:bg-orange-500"}`}
      />
      {formattedResetDate && (
        <p className="text-xs text-muted-foreground mt-2">
          Compteur remis à zéro le {formattedResetDate}
        </p>
      )}
    </div>
  );
}
