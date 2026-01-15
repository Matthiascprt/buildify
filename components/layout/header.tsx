"use client";

interface HeaderProps {
  user?: {
    email?: string;
  } | null;
}

export function Header({}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 hidden lg:flex h-16 items-center gap-4 bg-background px-6 lg:px-8">
      <div className="flex-1" />
    </header>
  );
}
