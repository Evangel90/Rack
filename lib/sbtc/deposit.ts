"use client";

import { request } from "@stacks/connect";
import {
  buildSbtcDepositAddress,
  DEFAULT_MAX_SIGNER_FEE,
  DEFAULT_RECLAIM_LOCK_TIME,
  MAINNET,
  REGTEST,
  SbtcApiClientTestnet,
  TESTNET,
} from "sbtc";
import { HIRO_API_URL, SBTC_BTC_NETWORK, SBTC_DEPLOYER, SBTC_EMILY_URL } from "../stacks/config";

/** Max fee the sBTC signers may take from a deposit (sbtc package default: 80,000 sats). */
export const MAX_SIGNER_FEE = DEFAULT_MAX_SIGNER_FEE;
/** Smallest deposit we allow: it must comfortably exceed the max signer fee. */
export const MIN_DEPOSIT_SATS = 100_000;

const BTC_NETWORKS = { regtest: REGTEST, testnet: TESTNET, mainnet: MAINNET };

export type PreparedDeposit = { address: string; depositScript: string; reclaimScript: string };

function client() {
  return new SbtcApiClientTestnet({ sbtcContract: SBTC_DEPLOYER, stxApiUrl: HIRO_API_URL, sbtcApiUrl: SBTC_EMILY_URL });
}

/** The reclaim script needs a 32-byte x-only (schnorr) key; wallets share a 33-byte compressed key. */
function xOnly(pubkeyHex: string) {
  const h = pubkeyHex.toLowerCase().replace(/^0x/, "");
  if (h.length === 66) return h.slice(2);
  if (h.length === 64) return h;
  throw new Error("Your wallet shared an unexpected Bitcoin public key format.");
}

/**
 * Builds the user's personal sBTC deposit address: BTC sent there mints sBTC to their own
 * Stacks address. If the deposit isn't processed, the user can reclaim with their own key.
 */
export async function prepareDeposit({ stxAddress, btcPublicKey }: { stxAddress: string; btcPublicKey: string }): Promise<PreparedDeposit> {
  const signersPublicKey = await client().fetchSignersPublicKey();
  const d = buildSbtcDepositAddress({
    network: BTC_NETWORKS[SBTC_BTC_NETWORK],
    stacksAddress: stxAddress,
    signersPublicKey,
    reclaimPublicKey: xOnly(btcPublicKey),
    maxSignerFee: MAX_SIGNER_FEE,
    reclaimLockTime: DEFAULT_RECLAIM_LOCK_TIME,
  });
  return { address: d.address, depositScript: d.depositScript, reclaimScript: d.reclaimScript };
}

/** Asks the user's Bitcoin wallet to send `amountSats` to the deposit address. Returns the BTC txid. */
export async function sendBtcFromWallet(address: string, amountSats: number): Promise<string> {
  const res = await request("sendTransfer", { recipients: [{ address, amount: amountSats }], network: SBTC_BTC_NETWORK });
  if (!res.txid) throw new Error("The wallet didn’t return a Bitcoin transaction id.");
  return res.txid;
}
