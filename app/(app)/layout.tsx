import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
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

  return (
    <ThemeProvider>
      <div className="h-screen bg-sidebar overflow-hidden">
        <Sidebar user={user} />
        <BottomNav user={user} />
        <div className="flex flex-col h-full lg:pl-60 pb-16 lg:pb-0 overflow-hidden lg:overflow-auto lg:py-3 lg:pr-3">
          <div className="flex-1 lg:flex-none flex flex-col bg-background lg:rounded-2xl lg:border lg:border-sidebar-border overflow-hidden">
            <Header user={user} />
            <main className="flex-1 overflow-auto lg:flex-initial lg:overflow-visible">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
