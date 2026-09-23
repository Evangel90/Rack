import { randomUUID } from "crypto";
import { refreshDeposit } from "@/lib/sbtc/track";
import { store } from "@/lib/store";
import type { Deposit } from "@/lib/types";

const bad = (error: string, status = 400) => Response.json({ error }, { status });

/** POST /api/deposits: record a BTC→sBTC deposit the user just sent from their wallet. */
export async function POST(req: Request) {
  let b: Partial<Deposit>;
  try {
    b = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  if (!b.sender || !/^S[PTMN][0-9A-Z]{38,40}$/.test(b.sender)) return bad("A valid Stacks address is required.");
  if (!b.btcTxid || !/^[0-9a-fA-F]{64}$/.test(b.btcTxid)) return bad("A valid Bitcoin txid is required.");
  if (!b.amountSats || !Number.isInteger(b.amountSats) || b.amountSats <= 0) return bad("amountSats is required.");
  if (!b.depositAddress || !b.depositScript || !b.reclaimScript) return bad("Deposit address and scripts are required.");

  const now = new Date().toISOString();
  let deposit: Deposit = {
    id: randomUUID(),
    sender: b.sender,
    btcTxid: b.btcTxid.toLowerCase(),
    amountSats: b.amountSats,
    depositAddress: b.depositAddress,
    depositScript: b.depositScript,
    reclaimScript: b.reclaimScript,
    notified: false,
    status: "sent",
    createdAt: now,
    updatedAt: now,
  };
  await store.putDeposit(deposit);
  deposit = await refreshDeposit(deposit).catch(() => deposit);
  return Response.json(deposit, { status: 201 });
}

/** GET /api/deposits?sender= → BTC→sBTC deposits started in this app, newest first. */
export async function GET(req: Request) {
  const sender = new URL(req.url).searchParams.get("sender");
  if (!sender) return bad("sender is required.");
  return Response.json(await store.listDeposits(sender));
}
