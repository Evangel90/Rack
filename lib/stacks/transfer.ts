"use client";

import { request } from "@stacks/connect";
import { Cl, Pc } from "@stacks/transactions";
import { SBTC, SBTC_ASSET, STACKS_NETWORK } from "./config";
import { quoteMemoHex } from "./memo";

/**
 * Asks the user's wallet to send exactly `amountSats` sBTC to Rack's settlement address.
 * SIP-010 `transfer(amount, sender, recipient, memo)` with the quote id in the memo,
 * post-condition mode Deny and one post-condition: the sender sends exactly the quoted amount.
 */
export async function payWithSbtc({
  amountSats,
  sender,
  recipient,
  quoteId,
  walletName,
}: {
  walletName?: string | null;
  amountSats: number;
  sender: string;
  recipient: string;
  quoteId: string;
}): Promise<string> {
  if (!SBTC) throw new Error("sBTC contract isn’t configured (NEXT_PUBLIC_SBTC_CONTRACT).");

  const postCondition = Pc.principal(sender).willSendEq(amountSats).ft(SBTC.id as `${string}.${string}`, SBTC_ASSET);

  const result = await request("stx_callContract", {
    contract: SBTC.id as `${string}.${string}`,
    functionName: "transfer",
    functionArgs: [
      Cl.uint(amountSats),
      Cl.principal(sender),
      Cl.principal(recipient),
      Cl.some(Cl.bufferFromHex(quoteMemoHex(quoteId))),
    ],
    // Xverse uses its own active network and can stall on an unexpected `network` value.
    ...(/xverse/i.test(walletName ?? "") ? {} : { network: STACKS_NETWORK }),
    postConditions: [postCondition],
    postConditionMode: "deny",
  });

  if (!result.txid) throw new Error("The wallet didn’t return a transaction id.");
  return result.txid;
}

/** True when the error means the user closed or rejected the wallet prompt. */
export function isUserRejection(e: unknown) {
  const err = e as { code?: number; message?: string } | undefined;
  return err?.code === 4001 || /cancel|reject|denied|closed/i.test(err?.message ?? "");
}
