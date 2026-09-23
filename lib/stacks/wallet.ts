"use client";

import { connect, disconnect } from "@stacks/connect";
import { STACKS_NETWORK } from "./config";

type ConnectOptions = NonNullable<Parameters<typeof connect>[0]>;

export type WalletSession = {
  stxAddress: string;
  btcAddress: string | null;
  /** Public key of the BTC payment address (hex), used for the sBTC deposit reclaim script. */
  btcPublicKey: string | null;
  walletName: string | null;
  connectedAt: string;
};

// Connect v8 types entries as `{ address, publicKey, symbol? }`; wallets add untyped `purpose` (Xverse) or `type` (Leather).
type AddressEntry = { address: string; publicKey?: string; symbol?: string; purpose?: string; type?: string };

function pickBtcPayment(entries: AddressEntry[]) {
  const btc = entries.filter((a) => !a.address.startsWith("S"));
  return (
    btc.find((a) => a.purpose === "payment" || a.type === "p2wpkh") ??
    btc.find((a) => /^(bc1q|tb1q|bcrt1q)/.test(a.address)) ??
    btc.find((a) => a.purpose !== "ordinals" && a.type !== "p2tr") ??
    null
  );
}

export type WalletId = "leather" | "xverse";

const WALLETS: Record<WalletId, { name: string; providerId: string; installed: () => unknown }> = {
  leather: { name: "Leather", providerId: "LeatherProvider", installed: () => (window as WalletWindow).LeatherProvider },
  xverse: {
    name: "Xverse",
    providerId: "XverseProviders.BitcoinProvider",
    installed: () => (window as WalletWindow).XverseProviders?.BitcoinProvider,
  },
};
type WalletWindow = Window & { LeatherProvider?: unknown; XverseProviders?: { BitcoinProvider?: unknown } };

export function isWalletInstalled(id: WalletId) {
  return typeof window !== "undefined" && Boolean(WALLETS[id].installed());
}

/**
 * Connects the chosen wallet and returns the user's Stacks and Bitcoin addresses.
 * If the extension is installed we talk to it directly; otherwise the Connect modal
 * is shown filtered to that wallet, where it offers the install link.
 */
export async function connectWallet(id: WalletId): Promise<WalletSession> {
  const w = WALLETS[id];
  const provider = w.installed() as ConnectOptions["provider"];
  const request = connect({
    // Connect maps `getAddresses` to Xverse's `wallet_connect` and forwards `network` as-is.
    // Xverse expects its own network names, and with "testnet" it never answers, so we leave it
    // out and check the returned address prefix below instead.
    ...(id === "xverse" ? {} : { network: STACKS_NETWORK }),
    ...(provider ? { provider } : { approvedProviderIds: [w.providerId] }),
  });
  const { addresses } = await withTimeout(
    request,
    CONNECT_TIMEOUT_MS,
    `${w.name} didn’t respond. Open the ${w.name} extension, unlock it, and try again.`,
  );
  const entries = addresses as AddressEntry[];
  const stx = entries.find((a) => a.symbol === "STX" || a.address.startsWith("S"));
  if (!stx) throw new Error("Your wallet didn’t share a Stacks address. Switch it to Testnet and try again.");
  if (STACKS_NETWORK === "testnet" && !stx.address.startsWith("ST") && !stx.address.startsWith("SN")) {
    throw new Error("Your wallet is on Mainnet. Switch it to Testnet and connect again.");
  }
  const btc = pickBtcPayment(entries);
  return {
    stxAddress: stx.address,
    btcAddress: btc?.address ?? null,
    btcPublicKey: btc?.publicKey ?? null,
    walletName: w.name,
    connectedAt: new Date().toISOString(),
  };
}

const CONNECT_TIMEOUT_MS = 120_000;

export function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

export function disconnectWallet() {
  try {
    disconnect();
  } catch {}
}
