"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type DisplayCurrency = "ngn" | "usd" | "sats";
export type ThemePref = "light" | "dark" | "system";

type Prefs = {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  bannerHidden: boolean;
  hideBanner: () => void;
};

const PrefsContext = createContext<Prefs | null>(null);

// Browser storage can throw (private mode, blocked site data); prefs are conveniences only.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export const THEME_KEY = "rack.theme";

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>("ngn");
  const [theme, setThemeState] = useState<ThemePref>("system");
  const [bannerHidden, setBannerHidden] = useState(false);

  useEffect(() => {
    // Hydrate from storage after mount so server and client markup match.
    /* eslint-disable react-hooks/set-state-in-effect */
    const c = read("rack.currency");
    if (c === "ngn" || c === "usd" || c === "sats") setCurrencyState(c);
    const t = read(THEME_KEY);
    if (t === "light" || t === "dark" || t === "system") setThemeState(t);
    try {
      if (sessionStorage.getItem("rack.bannerHidden") === "1") setBannerHidden(true);
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const setCurrency = useCallback((c: DisplayCurrency) => {
    setCurrencyState(c);
    write("rack.currency", c);
  }, []);

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    write(THEME_KEY, t);
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }, []);

  const hideBanner = useCallback(() => {
    setBannerHidden(true);
    try {
      sessionStorage.setItem("rack.bannerHidden", "1");
    } catch {}
  }, []);

  return (
    <PrefsContext.Provider value={{ currency, setCurrency, theme, setTheme, bannerHidden, hideBanner }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
