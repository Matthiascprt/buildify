"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user?: {
    email?: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 bg-background px-6 lg:px-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 bg-sidebar">
          <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buildify-assets/Logo/logo.svg`}
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
          <SidebarContent user={user} />
        </SheetContent>
      </Sheet>

      <Link
        href="/dashboard"
        className="flex items-center gap-2 font-bold lg:hidden"
      >
        <Image
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buildify-assets/Logo/logo.svg`}
          alt="Buildify"
          width={32}
          height={32}
          className="flex-shrink-0"
          unoptimized
        />
        <span className="text-2xl">Buildify</span>
      </Link>

      <div className="flex-1" />

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full lg:hidden"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Paramètres</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
