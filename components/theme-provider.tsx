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

function ThemeSyncProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: "light" | "dark";
}) {
  const { setTheme, theme } = useTheme();
  const hasAppliedInitialTheme = React.useRef(false);

  // Forcer le thème de la DB au premier rendu (priorité sur localStorage)
  React.useEffect(() => {
    if (initialTheme && !hasAppliedInitialTheme.current) {
      hasAppliedInitialTheme.current = true;
      if (theme !== initialTheme) {
        setTheme(initialTheme);
      }
    }
  }, [initialTheme, theme, setTheme]);

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
      <ThemeSyncProvider initialTheme={initialTheme}>
        {children}
      </ThemeSyncProvider>
    </NextThemesProvider>
  );
}
