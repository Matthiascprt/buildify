"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeSync } from "@/components/theme-provider";

const themes = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
] as const;

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme } = useTheme();
  const { syncTheme } = useThemeSync();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="flex gap-2">
        {themes.map(({ value, label, icon: Icon }) => (
          <div
            key={value}
            className="flex flex-1 flex-col items-center gap-2 rounded-lg border-2 border-border p-4"
          >
            <Icon className="h-5 w-5" />
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => syncTheme(value)}
          className={cn(
            "flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
            theme === value
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent",
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
