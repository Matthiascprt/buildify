"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FileText,
  Users,
  Euro,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  Clock,
  UserPlus,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import Image from "next/image";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { AdvancedDashboardStats } from "@/lib/supabase/types";

interface DashboardClientProps {
  stats: AdvancedDashboardStats;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardClient({ stats }: DashboardClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre tableau de bord Buildify
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Chiffre d&apos;affaires
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  stats.monthlyGrowth >= 0 ? "text-green-500" : "text-red-500"
                }
              >
                {stats.monthlyGrowth >= 0 ? "+" : ""}
                {stats.monthlyGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Devis et factures totaux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Clients enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Devis en cours
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingQuotes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.pendingQuotesAmount)} en attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 xl:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Evolution du chiffre d&apos;affaires</CardTitle>
            <CardDescription>
              Revenus des 6 derniers mois (factures)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.revenueData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Revenus
                                </span>
                                <span className="font-bold text-foreground">
                                  {formatCurrency(payload[0].value as number)}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Factures
                                </span>
                                <span className="font-bold text-foreground">
                                  {payload[0].payload.invoices}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Document Distribution Chart */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Répartition des documents</CardTitle>
            <CardDescription>Devis vs Factures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.documentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.documentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">
                                {payload[0].payload.name}
                              </span>
                              <span className="text-muted-foreground">
                                {payload[0].value} documents
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-foreground text-sm">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Today's Activity & New Clients */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Today's Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activité du jour</CardTitle>
              <CardDescription>
                Documents créés aujourd&apos;hui
              </CardDescription>
            </div>
            <Link href="/documents">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.todayDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucun document créé aujourd&apos;hui
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push("/edition")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un document
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {stats.todayDocuments.slice(0, 6).map((doc) => {
                  const isQuote = doc.type === "quote";
                  const accentColor =
                    doc.accentColor || (isQuote ? "#f97316" : "#f59e0b");
                  return (
                    <Link
                      key={`${doc.type}-${doc.id}`}
                      href={`/edition?id=${doc.id}&type=${doc.type}`}
                      className="flex flex-col rounded-xl border bg-card hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
                    >
                      {/* Document preview */}
                      <div className="p-2 sm:p-3 bg-muted/30">
                        <div className="bg-background rounded-lg p-2 sm:p-3 shadow-sm border">
                          {/* Header with logo and document info */}
                          <div className="flex justify-between items-start gap-2 mb-2">
                            {doc.companyLogo ? (
                              <Image
                                src={doc.companyLogo}
                                alt="Logo"
                                width={40}
                                height={20}
                                className="w-8 sm:w-10 h-4 sm:h-5 object-contain object-left shrink-0"
                                unoptimized
                              />
                            ) : (
                              <div className="w-8 sm:w-10 h-4 sm:h-5 bg-muted rounded flex items-center justify-center shrink-0">
                                <Building2 className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-muted-foreground/50" />
                              </div>
                            )}
                            <div className="text-right min-w-0 flex-1">
                              <p
                                className="font-bold text-[8px] sm:text-[9px] leading-tight truncate"
                                style={{ color: accentColor }}
                              >
                                {isQuote ? "Devis" : "Facture"} n° {doc.number}
                              </p>
                              <p className="text-[6px] sm:text-[7px] text-muted-foreground mt-0.5">
                                {formatTime(doc.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Company and Client row */}
                          <div className="flex justify-between gap-2 text-[6px] sm:text-[7px] text-muted-foreground mb-2 pb-1.5 sm:pb-2 border-b border-dashed">
                            <p className="font-medium text-foreground truncate flex-1">
                              {doc.companyName || "Mon entreprise"}
                            </p>
                            <p className="font-medium text-foreground truncate flex-1 text-right">
                              {doc.clientName || "Client non défini"}
                            </p>
                          </div>

                          {/* Project title */}
                          <p className="font-semibold truncate mb-2 text-[8px] sm:text-[9px]">
                            {doc.projectTitle || "Sans titre"}
                          </p>

                          {/* Mini table */}
                          <div className="border rounded overflow-hidden mb-2">
                            {/* Table header */}
                            <div
                              className="px-1 sm:px-1.5 py-0.5 sm:py-1"
                              style={{ backgroundColor: accentColor + "15" }}
                            >
                              <div
                                className="flex gap-1 text-[6px] sm:text-[7px] font-semibold"
                                style={{ color: accentColor }}
                              >
                                <span className="w-3 sm:w-4 text-center shrink-0">
                                  #
                                </span>
                                <span className="flex-1 truncate">
                                  Désignation
                                </span>
                                <span className="w-8 sm:w-10 text-right shrink-0">
                                  Total
                                </span>
                              </div>
                            </div>
                            {/* Table rows */}
                            <div className="divide-y divide-border/50">
                              <div className="flex gap-1 px-1 sm:px-1.5 py-0.5 sm:py-1 items-center">
                                <span className="w-3 sm:w-4 text-center text-[6px] sm:text-[7px] text-muted-foreground shrink-0">
                                  1
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="h-1 sm:h-1.5 w-full rounded bg-muted/80" />
                                  <div className="h-0.5 sm:h-1 w-2/3 rounded bg-muted/40 mt-0.5" />
                                </div>
                                <div className="h-1 sm:h-1.5 w-8 sm:w-10 rounded bg-muted/60 shrink-0" />
                              </div>
                              <div className="flex gap-1 px-1 sm:px-1.5 py-0.5 sm:py-1 items-center">
                                <span className="w-3 sm:w-4 text-center text-[6px] sm:text-[7px] text-muted-foreground shrink-0">
                                  2
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="h-1 sm:h-1.5 w-4/5 rounded bg-muted/60" />
                                  <div className="h-0.5 sm:h-1 w-1/2 rounded bg-muted/30 mt-0.5" />
                                </div>
                                <div className="h-1 sm:h-1.5 w-8 sm:w-10 rounded bg-muted/40 shrink-0" />
                              </div>
                            </div>
                          </div>

                          {/* Totals section */}
                          <div className="flex justify-end">
                            <div className="text-[6px] sm:text-[7px] space-y-0.5 w-16 sm:w-20">
                              <div className="flex justify-between items-center text-muted-foreground gap-1">
                                <span className="shrink-0">Total HT</span>
                                <div className="h-1 sm:h-1.5 w-6 sm:w-8 rounded bg-muted/50" />
                              </div>
                              <div className="flex justify-between items-center text-muted-foreground gap-1">
                                <span className="shrink-0">TVA</span>
                                <div className="h-1 sm:h-1.5 w-5 sm:w-6 rounded bg-muted/40" />
                              </div>
                              <div className="flex justify-between items-center font-bold pt-0.5 border-t gap-1">
                                <span className="shrink-0">TTC</span>
                                <span
                                  className="truncate text-right"
                                  style={{ color: accentColor }}
                                >
                                  {formatCurrency(doc.totalTTC)
                                    .replace("€", "")
                                    .trim()}{" "}
                                  €
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Document info footer */}
                      <div className="p-3 space-y-2">
                        {/* Type badge with number */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium shrink-0"
                            style={{
                              backgroundColor: accentColor + "20",
                              color: accentColor,
                            }}
                          >
                            {isQuote ? "Devis" : "Facture"}
                          </span>
                          <span
                            className="text-[11px] sm:text-xs font-semibold truncate"
                            style={{ color: accentColor }}
                          >
                            n° {doc.number}
                          </span>
                        </div>

                        {/* Client name and time */}
                        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs text-muted-foreground">
                          <p className="truncate flex-1">
                            {doc.clientName || "Client non défini"}
                          </p>
                          <span className="shrink-0">
                            {formatTime(doc.createdAt)}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="flex items-baseline justify-between pt-2 border-t gap-2">
                          <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                            Total TTC
                          </span>
                          <span className="font-bold text-base sm:text-lg truncate">
                            {formatCurrency(doc.totalTTC)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's New Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Nouveaux clients</CardTitle>
              <CardDescription>
                Clients ajoutés aujourd&apos;hui
              </CardDescription>
            </div>
            <Link href="/clients">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.todayClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserPlus className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucun nouveau client aujourd&apos;hui
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push("/clients?add=true")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.todayClients.slice(0, 5).map((client) => {
                  const initials =
                    `${client.firstName?.charAt(0) || ""}${client.lastName?.charAt(0) || ""}`.toUpperCase() ||
                    "?";
                  const fullName =
                    `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
                    "Client sans nom";

                  return (
                    <Link
                      key={client.id}
                      href={`/clients?id=${client.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="text-sm bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {fullName}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {client.type === "professionnel"
                              ? "Pro"
                              : "Particulier"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {client.email && (
                            <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-none">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">
                          {formatTime(client.createdAt)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
