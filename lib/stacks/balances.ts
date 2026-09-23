import { assetKey, HIRO_API_URL, SBTC, SBTC_ASSET, USDCX, USDCX_ASSET } from "./config";

export type Balances = {
  /** micro-STX */
  stx: bigint;
  /** sats (sBTC has 8 decimals, 1 sBTC = 1 BTC) */
  sbtc: bigint;
  /** micro-USDCx (6 decimals); null when USDCx isn't configured */
  usdcx: bigint | null;
};

type HiroBalances = {
  stx: { balance: string };
  fungible_tokens: Record<string, { balance: string }>;
};

/** Reads balances from the Hiro API: `GET /extended/v1/address/{stxAddress}/balances`. */
export async function fetchBalances(stxAddress: string): Promise<Balances> {
  const res = await fetch(`${HIRO_API_URL}/extended/v1/address/${stxAddress}/balances`);
  if (!res.ok) throw new Error(`Couldn’t load balances (${res.status})`);
  const json = (await res.json()) as HiroBalances;
  const ft = (key: string | null) => (key ? BigInt(json.fungible_tokens[key]?.balance ?? "0") : 0n);
  const usdcxKey = assetKey(USDCX, USDCX_ASSET);
  return {
    stx: BigInt(json.stx?.balance ?? "0"),
    sbtc: ft(assetKey(SBTC, SBTC_ASSET)),
    usdcx: usdcxKey ? ft(usdcxKey) : null,
  };
}
