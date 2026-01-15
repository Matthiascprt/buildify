import { DashboardClient } from "./dashboard-client";
import { getAdvancedDashboardStats } from "@/lib/supabase/api";

export default async function DashboardPage() {
  const stats = await getAdvancedDashboardStats();

  return <DashboardClient stats={stats} />;
}
