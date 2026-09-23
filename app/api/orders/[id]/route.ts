import { advanceOrder } from "@/lib/orders";
import { store } from "@/lib/store";

/** GET /api/orders/[id] → the full order, advanced (verified / fulfilled) if it can be. */
export async function GET(_req: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  const order = await store.getOrder(id);
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
  try {
    return Response.json(await advanceOrder(order));
  } catch (e) {
    console.error("advanceOrder failed", e);
    // Chain lookups can fail transiently; report the current state and let the next poll retry.
    return Response.json(order);
  }
}
