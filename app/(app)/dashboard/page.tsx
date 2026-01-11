import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Euro } from "lucide-react";
import {
  getDashboardStats,
  getTodayActivity,
  type RecentActivity,
} from "@/lib/supabase/api";

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

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const isQuote = activity.type === "quote";
  const label = isQuote ? "Devis" : "Facture";
  const number = activity.number || "N/A";

  return (
    <Link
      href={`/edition?id=${activity.id}&type=${activity.type}`}
      className="flex items-center justify-between py-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors rounded-lg px-2 -mx-2"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-sm">
            {label} {number}
          </p>
          <p className="text-xs text-muted-foreground">
            {activity.clientName || "Client non défini"} •{" "}
            {formatTime(activity.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-sm">
          {formatCurrency(activity.totalTTC)}
        </p>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const [stats, todayActivity] = await Promise.all([
    getDashboardStats(),
    getTodayActivity(),
  ]);

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre tableau de bord Buildify
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalDocuments}</div>
            <p className="text-sm text-muted-foreground">
              Devis et factures créés
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalClients}</div>
            <p className="text-sm text-muted-foreground">Clients enregistrés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Chiffre d&apos;affaires
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-sm text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité du jour</CardTitle>
        </CardHeader>
        <CardContent>
          {todayActivity.length === 0 ? (
            <p className="text-muted-foreground">
              Aucune activité aujourd&apos;hui. Commencez par créer un document.
            </p>
          ) : (
            <div className="divide-y">
              {todayActivity.map((activity) => (
                <ActivityItem
                  key={`${activity.type}-${activity.id}`}
                  activity={activity}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
