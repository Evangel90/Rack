import "server-only";
import { SbtcApiClientTestnet } from "sbtc";
import { HIRO_API_URL, SBTC_BTC_API_URL, SBTC_DEPLOYER, SBTC_EMILY_URL } from "../stacks/config";
import { store } from "../store";
import type { Deposit, DepositStatus } from "../types";

const client = () =>
  new SbtcApiClientTestnet({ sbtcContract: SBTC_DEPLOYER, stxApiUrl: HIRO_API_URL, sbtcApiUrl: SBTC_EMILY_URL, btcApiUrl: SBTC_BTC_API_URL });

// Emily deposit statuses → our step tracker.
const EMILY: Record<string, DepositStatus> = {
  pending: "confirming",
  reprocessing: "confirming",
  rbf: "confirming",
  accepted: "minting",
  confirmed: "done",
  failed: "failed",
};

/**
 * Tells Emily about the deposit (PRD step 4: notifySbtc with the txid and scripts).
 * Needs the raw BTC transaction, so it only works when SBTC_BTC_API_URL points at a
 * mempool-style API for the Bitcoin network the signers watch.
 */
async function notify(d: Deposit): Promise<Deposit> {
  if (!SBTC_BTC_API_URL) return d;
  const txRes = await fetch(`${SBTC_BTC_API_URL}/tx/${d.btcTxid}`, { cache: "no-store" });
  if (!txRes.ok) return d; // not seen by that API yet
  const tx = (await txRes.json()) as { vout: { scriptpubkey_address?: string }[] };
  const vout = tx.vout.findIndex((o) => o.scriptpubkey_address === d.depositAddress);
  if (vout < 0) return save(d, { status: "failed", statusMessage: "This Bitcoin transaction doesn’t pay your deposit address." });
  const hex = await client().fetchTxHex(d.btcTxid);
  const res = await client().notifySbtc({ depositScript: d.depositScript, reclaimScript: d.reclaimScript, vout, transaction: hex });
  return save(d, { vout, notified: true, status: EMILY[res.status] ?? "confirming", statusMessage: res.statusMessage });
}

/** Advances a deposit: notify Emily if needed, then read its status (PRD step 5). */
export async function refreshDeposit(d: Deposit): Promise<Deposit> {
  if (d.status === "done" || d.status === "failed") return d;
  if (!d.notified) {
    d = await notify(d).catch(() => d);
    if (!d.notified) return d;
  }
  const res = await client().fetchDeposit({ txid: d.btcTxid, vout: d.vout ?? 0 }).catch(() => null);
  const status = res?.status ? EMILY[res.status.toLowerCase()] : undefined;
  if (!status || status === d.status) return d;
  return save(d, { status, statusMessage: res?.statusMessage });
}

async function save(d: Deposit, patch: Partial<Deposit>) {
  const next = { ...d, ...patch, updatedAt: new Date().toISOString() };
  await store.putDeposit(next);
  return next;
}
