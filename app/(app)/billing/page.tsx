"use client";

import {
  CreditCard,
  Check,
  Zap,
  TrendingUp,
  Calendar,
  Download,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Fictional data - to be replaced later
const currentPlan = {
  name: "Pro",
  price: 29,
  interval: "mois",
  renewalDate: "15 février 2025",
};

const usage = {
  documents: { used: 47, limit: 100 },
  clients: { used: 23, limit: 50 },
  storage: { used: 1.2, limit: 5, unit: "Go" },
  aiRequests: { used: 156, limit: 500 },
};

const plans = [
  {
    name: "Starter",
    price: 0,
    interval: "mois",
    description: "Pour démarrer",
    features: [
      "10 documents/mois",
      "5 clients",
      "500 Mo stockage",
      "50 requêtes IA",
    ],
    current: false,
  },
  {
    name: "Pro",
    price: 29,
    interval: "mois",
    description: "Pour les professionnels",
    features: [
      "100 documents/mois",
      "50 clients",
      "5 Go stockage",
      "500 requêtes IA",
      "Support prioritaire",
    ],
    current: true,
    popular: true,
  },
  {
    name: "Business",
    price: 79,
    interval: "mois",
    description: "Pour les équipes",
    features: [
      "Documents illimités",
      "Clients illimités",
      "50 Go stockage",
      "Requêtes IA illimitées",
      "Support dédié",
      "API access",
    ],
    current: false,
  },
];

const invoices = [
  { id: "INV-2025-001", date: "15 janvier 2025", amount: 29, status: "Payée" },
  { id: "INV-2024-012", date: "15 décembre 2024", amount: 29, status: "Payée" },
  { id: "INV-2024-011", date: "15 novembre 2024", amount: 29, status: "Payée" },
  { id: "INV-2024-010", date: "15 octobre 2024", amount: 29, status: "Payée" },
];

export default function BillingPage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-background to-muted/20">
      <div className="w-full py-8 px-6 lg:px-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Abonnement</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre abonnement, suivez votre utilisation et consultez vos
            factures
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    Plan {currentPlan.name}
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-md">
                    Actif
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Prochain renouvellement le {currentPlan.renewalDate}
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{currentPlan.price}€</span>
              <span className="text-muted-foreground">
                /{currentPlan.interval}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            Utilisation ce mois
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <UsageCard
              title="Documents"
              used={usage.documents.used}
              limit={usage.documents.limit}
              unit=""
            />
            <UsageCard
              title="Clients"
              used={usage.clients.used}
              limit={usage.clients.limit}
              unit=""
            />
            <UsageCard
              title="Stockage"
              used={usage.storage.used}
              limit={usage.storage.limit}
              unit={usage.storage.unit}
            />
            <UsageCard
              title="Requêtes IA"
              used={usage.aiRequests.used}
              limit={usage.aiRequests.limit}
              unit=""
            />
          </div>
        </div>

        {/* Plans */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            Changer de plan
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg border bg-card p-6 transition-all ${
                  plan.current
                    ? "border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20"
                    : "hover:border-orange-200 dark:hover:border-orange-900"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="px-2.5 py-0.5 text-xs font-medium bg-orange-600 text-white rounded-md">
                      Populaire
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h4 className="text-lg font-semibold">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold">{plan.price}€</span>
                  <span className="text-muted-foreground">
                    /{plan.interval}
                  </span>
                </div>
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
                  variant={plan.current ? "outline" : "default"}
                  disabled={plan.current}
                  className={`w-full ${!plan.current ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}`}
                >
                  {plan.current ? "Plan actuel" : "Choisir ce plan"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method & Invoices */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Method */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Moyen de paiement
            </h3>
            <div className="rounded-lg border bg-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">
                      Expire 12/2026
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Modifier
                </Button>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Historique des factures
            </h3>
            <div className="rounded-lg border bg-card divide-y">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{invoice.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <span className="text-sm font-medium">
                      {invoice.amount}€
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-md hidden sm:inline">
                      {invoice.status}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="link"
              className="mt-2 px-0 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
            >
              Voir toutes les factures
              <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
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
}: {
  title: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const percentage = (used / limit) * 100;
  const isHigh = percentage > 80;

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
    </div>
  );
}
