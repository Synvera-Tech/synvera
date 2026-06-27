"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  /** The user's saved/global theme. Driven by the toggle and persisted to localStorage. */
  theme: Theme;
  /** Reflects the theme currently on screen (the page override when present, otherwise the global theme). */
  isDark: boolean;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
  /**
   * Page-scoped theme override. When set, it drives the appearance of the page
   * WITHOUT touching the saved global preference — used by the Procedure page so
   * it always opens in light mode while leaving the global toggle untouched.
   * Pass `null` to release the override and return to the user's chosen theme.
   */
  pageTheme: Theme | null;
  setPageTheme: (theme: Theme | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem("theme");
  return saved === "dark" || saved === "light" ? saved : null;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [pageTheme, setPageThemeState] = useState<Theme | null>(null);

  // The theme actually shown on screen: a page override wins over the global preference.
  const effective: Theme = pageTheme ?? theme;

  // Single source of DOM mutation. The inline script in <head> already painted the
  // correct initial theme (including forcing light on /procedure), so we skip the
  // first run to avoid a flash and only react to later theme/override changes.
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      return;
    }
    applyTheme(effective);
  }, [effective]);

  useEffect(() => {
    setThemeState(getStoredTheme() ?? getSystemTheme());

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "theme") {
        setThemeState(getStoredTheme() ?? getSystemTheme());
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    localStorage.setItem("theme", nextTheme);
  }, []);

  const setPageTheme = useCallback((nextTheme: Theme | null) => {
    setPageThemeState(nextTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: effective === "dark",
      setTheme,
      toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
      pageTheme,
      setPageTheme,
    }),
    [effective, pageTheme, setPageTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
