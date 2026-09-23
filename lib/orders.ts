import "server-only";
import { purchaseAirtime } from "./biller/mock";
import { verifyPayment } from "./stacks/verify";
import { store } from "./store";
import type { Order } from "./types";

// Orders currently being advanced, so concurrent polls don't double-fulfil.
const g = globalThis as unknown as { __rackAdvancing?: Set<string> };
const advancing = (g.__rackAdvancing ??= new Set());

/** Give up waiting for a transaction after this long (testnet blocks can be slow). */
const PAYMENT_TIMEOUT_MS = 60 * 60_000;

/**
 * Moves an order along its state machine. Called when the order is created and each time
 * the status page polls it, so no background worker is needed on Vercel.
 * awaiting_payment → paid (verified on chain) → fulfilled | refund_needed; or → failed.
 */
export async function advanceOrder(order: Order): Promise<Order> {
  if (order.status !== "awaiting_payment" && order.status !== "paid") return order;
  if (advancing.has(order.id)) return order;
  advancing.add(order.id);
  try {
    let o = order;
    if (o.status === "awaiting_payment") {
      const quote = await store.getQuote(o.quoteId);
      if (!quote) return await save(o, { status: "failed", failureReason: "The quote for this order is missing." });
      const v = await verifyPayment(o.txid, quote);
      if (v.state === "pending") {
        if (Date.now() - new Date(o.createdAt).getTime() > PAYMENT_TIMEOUT_MS) {
          return await save(o, { status: "failed", failureReason: "The payment wasn’t confirmed on the Stacks network in time." });
        }
        return o;
      }
      if (v.state === "failed") return await save(o, { status: "failed", failureReason: v.reason });
      o = await save(o, { status: "paid" });
    }

    const result = await purchaseAirtime({ network: o.network, phone: o.phone, amountNgn: o.amountNgn });
    return result.ok
      ? await save(o, { status: "fulfilled", reference: result.reference })
      : await save(o, { status: "refund_needed", failureReason: result.error });
  } finally {
    advancing.delete(order.id);
  }
}

async function save(o: Order, patch: Partial<Order>) {
  const next = { ...o, ...patch, updatedAt: new Date().toISOString() };
  await store.putOrder(next);
  return next;
}
