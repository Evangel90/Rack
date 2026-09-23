import { getPrice } from "@/lib/pricing";

export async function GET() {
  try {
    return Response.json(await getPrice());
  } catch {
    return Response.json({ error: "Bitcoin price is unavailable right now. Try again in a minute." }, { status: 503 });
  }
}
