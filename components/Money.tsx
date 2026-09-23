"use client";

import { usePrefs } from "./providers/prefs";
import { formatBtc, formatNgn, formatSats, formatUsd, satsToNgn, satsToUsd } from "@/lib/format";
import type { Price } from "@/lib/types";

/**
 * Primary and secondary text for a bitcoin amount in the user's display currency.
 * The bitcoin value is always shown next to the fiat value (PRD copy rule).
 */
export function useMoney() {
  const { currency } = usePrefs();
  return (sats: number, price?: Price) => {
    const btc = formatBtc(sats);
    if (!price) return { primary: formatSats(sats), secondary: btc };
    const ngn = formatNgn(satsToNgn(sats, price.btcNgn));
    const usd = formatUsd(satsToUsd(sats, price.btcUsd));
    if (currency === "usd") return { primary: usd, secondary: `${btc} · ${ngn}` };
    if (currency === "sats") return { primary: formatSats(sats), secondary: `${btc} · ${ngn}` };
    return { primary: ngn, secondary: `${btc} · ${usd}` };
  };
}
