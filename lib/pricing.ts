import "server-only";
import type { Price } from "./types";

const DEFAULT_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=ngn,usd";
const TTL_MS = 60_000;

const g = globalThis as unknown as { __rackPrice?: Price & { fetchedAt: number } };

/**
 * BTC/NGN and BTC/USD, cached for 60 seconds server-side.
 * If the provider fails, returns the last known price marked `stale` (PRD risk table).
 */
export async function getPrice(): Promise<Price> {
  const cached = g.__rackPrice;
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return strip(cached);

  try {
    const res = await fetch(process.env.PRICE_API_URL || DEFAULT_URL, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`price API ${res.status}`);
    const json = (await res.json()) as { bitcoin?: { ngn?: number; usd?: number } };
    const btcNgn = json.bitcoin?.ngn;
    const btcUsd = json.bitcoin?.usd;
    if (!btcNgn || !btcUsd) throw new Error("price API returned no BTC price");
    g.__rackPrice = { btcNgn, btcUsd, updatedAt: new Date().toISOString(), fetchedAt: Date.now() };
    return strip(g.__rackPrice);
  } catch (e) {
    if (cached) return { ...strip(cached), stale: true };
    throw e;
  }
}

function strip({ btcNgn, btcUsd, updatedAt }: Price & { fetchedAt: number }): Price {
  return { btcNgn, btcUsd, updatedAt };
}
