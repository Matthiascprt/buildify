import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

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
    <div className="h-screen bg-sidebar overflow-hidden">
      <Sidebar user={user} />
      <div className="flex flex-col h-screen lg:pl-60">
        <div className="flex-1 flex flex-col m-0 lg:m-3 lg:ml-0 bg-background lg:rounded-2xl lg:border lg:border-sidebar-border overflow-hidden">
          <Header user={user} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
