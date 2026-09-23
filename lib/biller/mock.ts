import "server-only";
import { randomBytes } from "crypto";
import type { Network } from "../types";

export type AirtimeRequest = { network: Network; phone: string; amountNgn: number };
export type BillerResult = { ok: true; reference: string } | { ok: false; error: string };

/**
 * Mock biller. Same interface a real partner adapter will implement in M2.
 * MOCK_BILLER_FAIL_RATE (0–1, default 0) makes a share of purchases fail, to demo the failure state.
 */
export async function purchaseAirtime(req: AirtimeRequest): Promise<BillerResult> {
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
  const failRate = Number(process.env.MOCK_BILLER_FAIL_RATE ?? 0);
  if (Math.random() < failRate) {
    return { ok: false, error: `${req.network.toUpperCase()} didn’t confirm the top-up.` };
  }
  const ref = randomBytes(6).toString("base64url").replace(/[-_]/g, "X").slice(0, 8).toUpperCase();
  return { ok: true, reference: `RACK-AT-${ref}` };
}
