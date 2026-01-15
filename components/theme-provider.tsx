"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { updateUserTheme } from "@/lib/supabase/api";

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: "light" | "dark";
}

const ThemeSyncContext = React.createContext<{
  syncTheme: (theme: "light" | "dark") => Promise<void>;
}>({
  syncTheme: async () => {},
});

export function useThemeSync() {
  return React.useContext(ThemeSyncContext);
}

function ThemeSyncProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();

  const syncTheme = React.useCallback(
    async (theme: "light" | "dark") => {
      setTheme(theme);
      await updateUserTheme(theme);
    },
    [setTheme],
  );

  return (
    <ThemeSyncContext.Provider value={{ syncTheme }}>
      {children}
    </ThemeSyncContext.Provider>
  );
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={initialTheme || "light"}
      forcedTheme={undefined}
      enableSystem={false}
      disableTransitionOnChange
      storageKey="buildify-theme"
    >
      <ThemeSyncProvider>{children}</ThemeSyncProvider>
    </NextThemesProvider>
  );
}
