import { refreshDeposit } from "@/lib/sbtc/track";
import { store } from "@/lib/store";

/** GET /api/deposits/[id] → the deposit, with its status refreshed from the sBTC API. */
export async function GET(_req: Request, ctx: RouteContext<"/api/deposits/[id]">) {
  const { id } = await ctx.params;
  const deposit = await store.getDeposit(id);
  if (!deposit) return Response.json({ error: "Deposit not found." }, { status: 404 });
  return Response.json(await refreshDeposit(deposit).catch(() => deposit));
}
