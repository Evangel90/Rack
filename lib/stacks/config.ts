// All chain values live here and come from env vars (PRD: no hard-coded contract ids in components).

function splitContract(id: string | undefined) {
  if (!id || !id.includes(".")) return null;
  const [address, name] = id.split(".");
  return { id, address, name };
}

export const STACKS_NETWORK = (process.env.NEXT_PUBLIC_STACKS_NETWORK ?? "testnet") as "testnet" | "mainnet";
export const HIRO_API_URL = process.env.NEXT_PUBLIC_HIRO_API_URL ?? "https://api.testnet.hiro.so";

/** sBTC SIP-010 token contract, e.g. `ST….sbtc-token`. */
export const SBTC = splitContract(process.env.NEXT_PUBLIC_SBTC_CONTRACT);
/** Fungible-token asset name inside the sBTC contract (the `define-fungible-token` name). */
export const SBTC_ASSET = process.env.NEXT_PUBLIC_SBTC_ASSET ?? "sbtc-token";
export const SBTC_DECIMALS = 8;

/** USDCx is optional: its balance is hidden when this is unset. */
export const USDCX = splitContract(process.env.NEXT_PUBLIC_USDCX_CONTRACT);
export const USDCX_ASSET = process.env.NEXT_PUBLIC_USDCX_ASSET ?? "usdcx-token";
export const USDCX_DECIMALS = 6;

export const SETTLEMENT_ADDRESS = process.env.NEXT_PUBLIC_RACK_SETTLEMENT_ADDRESS ?? "";

/** `<contract>::<asset>` key used by the Hiro balances endpoint and post-conditions. */
export function assetKey(contract: { id: string } | null, asset: string) {
  return contract ? `${contract.id}::${asset}` : null;
}

/** sBTC deposits (Save). The `sbtc` package's built-in testnet defaults are stale, so these override them. */
export const SBTC_DEPLOYER = process.env.NEXT_PUBLIC_SBTC_DEPLOYER ?? SBTC?.address ?? "";
export const SBTC_EMILY_URL = process.env.NEXT_PUBLIC_SBTC_EMILY_URL ?? "https://beta.sbtc-emily.com";
/** Bitcoin network the sBTC signers watch. Stacks testnet runs against Bitcoin regtest. */
export const SBTC_BTC_NETWORK = (process.env.NEXT_PUBLIC_SBTC_BTC_NETWORK ?? "regtest") as "regtest" | "testnet" | "mainnet";
/** Optional mempool-style API for that Bitcoin network (needed to notify Emily with the raw tx). */
export const SBTC_BTC_API_URL = process.env.SBTC_BTC_API_URL ?? "";
/** Optional block explorer for that Bitcoin network, e.g. `https://mempool.space/testnet4` (no trailing slash). */
export const BTC_EXPLORER_URL = process.env.NEXT_PUBLIC_SBTC_BTC_EXPLORER_URL ?? "";
