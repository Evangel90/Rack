import { randomUUID } from "crypto";
import { normalizeTxid } from "@/lib/stacks/verify";
import { store } from "@/lib/store";
import type { Order } from "@/lib/types";

const bad = (error: string, status = 400) => Response.json({ error }, { status });

/** POST /api/orders { quoteId, txid } → { orderId, status } */
export async function POST(req: Request) {
  let body: { quoteId?: string; txid?: string };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const { quoteId, txid } = body;
  if (!quoteId || !txid || !/^(0x)?[0-9a-fA-F]{64}$/.test(txid.trim())) return bad("quoteId and a valid txid are required.");

  const quote = await store.getQuote(quoteId);
  if (!quote) return bad("Unknown quote.", 404);
  if (Date.now() > new Date(quote.expiresAt).getTime()) return bad("This price has expired. Get a new price and try again.", 410);
  if (await store.findOrderByTxid(txid)) return bad("This transaction is already linked to another order.", 409);

  const now = new Date().toISOString();
  const order: Order = {
    id: randomUUID(),
    quoteId,
    sender: quote.sender,
    category: quote.category,
    network: quote.network,
    phone: quote.phone,
    amountNgn: quote.amountNgn,
    amountSats: quote.amountSats,
    txid: normalizeTxid(txid),
    status: "awaiting_payment",
    createdAt: now,
    updatedAt: now,
  };
  await store.putOrder(order);
  // Nothing is marked paid here: the status page polls, and each poll verifies on chain.
  return Response.json({ orderId: order.id, status: order.status }, { status: 201 });
}

/** GET /api/orders?sender= → the sender's orders, newest first. */
export async function GET(req: Request) {
  const sender = new URL(req.url).searchParams.get("sender");
  if (!sender) return bad("sender is required.");
  return Response.json(await store.listOrders(sender));
}
