"use client";

import { usePrefs, type DisplayCurrency } from "./providers/prefs";

const options: { id: DisplayCurrency; label: string }[] = [
  { id: "ngn", label: "NGN" },
  { id: "usd", label: "USD" },
  { id: "sats", label: "sats" },
];

export function CurrencySeg({ compact }: { compact?: boolean }) {
  const { currency, setCurrency } = usePrefs();
  return (
    <div className="seg" role="group" aria-label="Display currency">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={currency === o.id ? "on" : ""}
          aria-pressed={currency === o.id}
          onClick={() => setCurrency(o.id)}
          style={compact ? { minWidth: 52, padding: "0 10px", fontSize: 13 } : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
