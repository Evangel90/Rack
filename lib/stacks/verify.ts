import "server-only";
import { Cl, type ClarityValue } from "@stacks/transactions";
import { HIRO_API_URL, SBTC } from "./config";
import { quoteMemoHex } from "./memo";
import type { Quote } from "../types";

export type Verification = { state: "pending" } | { state: "verified" } | { state: "failed"; reason: string };

type HiroTx = {
  tx_status: string;
  tx_type: string;
  sender_address: string;
  contract_call?: { contract_id: string; function_name: string; function_args?: { hex: string; name: string }[] };
};

export function normalizeTxid(txid: string) {
  const t = txid.trim().toLowerCase();
  return t.startsWith("0x") ? t : `0x${t}`;
}

/**
 * Verifies an airtime payment on chain before an order is marked paid (PRD):
 * the tx succeeded, called the sBTC token's `transfer`, from the quote's sender,
 * to the settlement address, for at least `amountSats`, with the quote id as memo.
 */
export async function verifyPayment(txid: string, quote: Quote): Promise<Verification> {
  const res = await fetch(`${HIRO_API_URL}/extended/v1/tx/${normalizeTxid(txid)}`, { cache: "no-store" });
  // Freshly broadcast transactions can take a few seconds to be indexed.
  if (res.status === 404) return { state: "pending" };
  if (!res.ok) throw new Error(`Hiro API ${res.status}`);
  const tx = (await res.json()) as HiroTx;

  if (tx.tx_status === "pending") return { state: "pending" };
  if (tx.tx_status !== "success") return { state: "failed", reason: `The transaction didn’t go through (${tx.tx_status.replace(/_/g, " ")}).` };

  const call = tx.contract_call;
  if (tx.tx_type !== "contract_call" || !call || !SBTC) return { state: "failed", reason: "This transaction isn’t an sBTC transfer." };
  if (call.contract_id !== SBTC.id || call.function_name !== "transfer") return { state: "failed", reason: "This transaction isn’t an sBTC transfer." };
  if (tx.sender_address !== quote.sender) return { state: "failed", reason: "The payment came from a different wallet." };

  const args = (call.function_args ?? []).map((a) => Cl.deserialize(a.hex) as ClarityValue);
  const [amount, sender, recipient, memo] = args;
  if (amount?.type !== "uint" || BigInt(amount.value) < BigInt(quote.amountSats)) {
    return { state: "failed", reason: "The amount sent is less than the quoted price." };
  }
  if (!sender || !("value" in sender) || sender.value !== quote.sender) return { state: "failed", reason: "The payment came from a different wallet." };
  if (!recipient || !("value" in recipient) || recipient.value !== quote.recipient) {
    return { state: "failed", reason: "The payment went to the wrong address." };
  }
  const memoHex = memo?.type === "some" && memo.value.type === "buffer" ? memo.value.value.toLowerCase() : null;
  if (memoHex !== quoteMemoHex(quote.id)) return { state: "failed", reason: "The payment isn’t tagged with this order’s quote." };

  return { state: "verified" };
}
