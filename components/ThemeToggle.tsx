"use client";

import { Icon } from "./icons";
import { usePrefs } from "./providers/prefs";

/**
 * Light/dark switch from the design's headers. The icon is chosen in CSS from the resolved
 * theme (saved choice or system), so it is right on first paint with no hydration flash.
 */
export function ThemeToggle() {
  const { setTheme } = usePrefs();
  function toggle() {
    const dark =
      document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(dark ? "light" : "dark");
  }
  return (
    <button type="button" className="iconbtn theme-toggle" aria-label="Switch light or dark theme" title="Switch light / dark" onClick={toggle}>
      <Icon name="moon" className="th-moon" />
      <Icon name="sun" className="th-sun" />
    </button>
  );
}
