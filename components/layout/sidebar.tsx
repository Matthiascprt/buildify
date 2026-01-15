"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Sun,
  Moon,
  Settings,
  LogOut,
  Pencil,
  CreditCard,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Principal",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Édition",
        href: "/edition",
        icon: Pencil,
      },
      {
        title: "Documents",
        href: "/documents",
        icon: FileText,
      },
      {
        title: "Clients",
        href: "/clients",
        icon: Users,
      },
    ],
  },
];

interface SidebarProps {
  user?: {
    email?: string;
  } | null;
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <item.icon className="h-[18px] w-[18px]" />
      {item.title}
    </Link>
  );
}

function AccountMenu({
  user,
  initials,
}: {
  user?: { email?: string } | null;
  initials: string;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = React.useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const themes = [
    { value: "light", label: "Clair", icon: Sun },
    { value: "dark", label: "Sombre", icon: Moon },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-sidebar-accent/50 text-left">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.email || "Utilisateur"}
            </p>
            <p className="text-xs text-sidebar-foreground/60">Mon compte</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Thème
        </DropdownMenuLabel>
        <div className="flex gap-2 px-3 pb-3">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-2 rounded-md px-2.5 py-2.5 text-xs transition-colors min-w-0 w-0",
                mounted && theme === value
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="h-4 w-4" />
            Paramètres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/billing" className="cursor-pointer">
            <CreditCard className="h-4 w-4" />
            Abonnement
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/legal" className="cursor-pointer">
            <Scale className="h-4 w-4" />
            Légal
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          variant="destructive"
          className="cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logoUrl =
    mounted && resolvedTheme === "dark"
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buildify-assets/Logo/icon (2).svg`
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buildify-assets/Logo/icon (1).svg`;

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-sidebar">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src={logoUrl}
            alt="Buildify"
            width={32}
            height={32}
            className="flex-shrink-0"
            unoptimized
          />
          <span className="text-2xl font-bold tracking-tight text-sidebar-foreground">
            Buildify
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 px-4 pt-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <NavLink key={item.href} item={item} isActive={isActive} />
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <AccountMenu user={user} initials={initials} />
      </div>
    </aside>
  );
}

export function SidebarContent({ user }: SidebarProps) {
  const pathname = usePathname();
  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 space-y-6 px-4 pt-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <NavLink key={item.href} item={item} isActive={isActive} />
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-sidebar-accent/50"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.email || "Utilisateur"}
            </p>
            <p className="text-xs text-sidebar-foreground/60">Mon compte</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Bottom navigation items for mobile
const bottomNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Édition", href: "/edition", icon: Pencil },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Clients", href: "/clients", icon: Users },
];

function BottomNavLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-2 px-1 min-w-0 flex-1 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground",
      )}
    >
      <item.icon className="h-5 w-5" />
      <span className="text-[10px] font-medium truncate">{item.title}</span>
    </Link>
  );
}

export function BottomNav({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = React.useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const themes = [
    { value: "light", label: "Clair", icon: Sun },
    { value: "dark", label: "Sombre", icon: Moon },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
        {bottomNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <BottomNavLink key={item.href} item={item} isActive={isActive} />
          );
        })}

        {/* Menu compte */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-1 py-2 px-1 min-w-0 flex-1 text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-medium">Compte</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-52 mb-2">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Thème
            </DropdownMenuLabel>
            <div className="flex gap-2 px-3 pb-3">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-2 rounded-md px-2.5 py-2.5 text-xs transition-colors min-w-0 w-0",
                    mounted && theme === value
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="h-4 w-4" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/billing" className="cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Abonnement
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/legal" className="cursor-pointer">
                <Scale className="h-4 w-4" />
                Légal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              variant="destructive"
              className="cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
