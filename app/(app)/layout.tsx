import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, BottomNav } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/theme-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Charger le thème depuis la DB
  const { data: profile } = await supabase
    .from("profiles")
    .select("theme")
    .eq("id", user.id)
    .single();

  const userTheme = (profile?.theme as "light" | "dark") || "light";

  return (
    <ThemeProvider initialTheme={userTheme}>
      <div className="h-screen bg-sidebar overflow-hidden">
        <Sidebar user={user} />
        <BottomNav user={user} />
        <div className="flex flex-col h-full lg:pl-60 pb-16 lg:pb-0 overflow-hidden lg:overflow-auto">
          <div className="flex-1 flex flex-col m-0 lg:m-3 lg:ml-0 bg-background lg:rounded-2xl lg:border lg:border-sidebar-border overflow-hidden">
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
