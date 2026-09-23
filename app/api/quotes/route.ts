import { randomUUID } from "crypto";
import { getPrice } from "@/lib/pricing";
import { store } from "@/lib/store";
import { detectNetwork, MAX_NGN, MIN_NGN, normalizePhone } from "@/lib/phone";
import { ngnToSats } from "@/lib/format";
import { SETTLEMENT_ADDRESS } from "@/lib/stacks/config";
import type { Network, Quote } from "@/lib/types";

const QUOTE_TTL_MS = 5 * 60_000;
const NETWORK_IDS: Network[] = ["mtn", "airtel", "glo", "9mobile"];

type Body = {
  sender?: string;
  category?: string;
  network?: string;
  phone?: string;
  amountNgn?: number;
  /** User confirmed a network that doesn't match the number's prefix (ported number). */
  networkOverride?: boolean;
};

const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }

  const { sender, category, network, phone, amountNgn, networkOverride } = body;
  if (!sender || !/^S[PTMN][0-9A-Z]{38,40}$/.test(sender)) return bad("A valid Stacks sender address is required.");
  if (category !== "airtime") return bad("Only airtime is available in this preview.");
  if (!network || !NETWORK_IDS.includes(network as Network)) return bad("Choose a network: MTN, Airtel, Glo or 9mobile.");

  const normalized = phone ? normalizePhone(phone) : null;
  if (!normalized) return bad("Enter a Nigerian mobile number, like 0803 456 7214.");
  const detected = detectNetwork(normalized);
  if (detected && detected !== network && !networkOverride) {
    return bad(`This number looks like ${detected.toUpperCase()}. Confirm the network if they’ve switched.`, 409);
  }

  if (typeof amountNgn !== "number" || !Number.isInteger(amountNgn) || amountNgn < MIN_NGN || amountNgn > MAX_NGN) {
    return bad(`Amount must be between ₦${MIN_NGN} and ₦${MAX_NGN.toLocaleString("en-US")}.`);
  }
  if (!SETTLEMENT_ADDRESS) return bad("Rack’s settlement address isn’t configured.", 500);

  let price;
  try {
    price = await getPrice();
  } catch {
    return bad("Bitcoin price is unavailable right now. Try again in a minute.", 503);
  }

  const now = Date.now();
  const quote: Quote = {
    id: randomUUID(),
    sender,
    category: "airtime",
    network: network as Network,
    phone: normalized,
    amountNgn,
    amountSats: ngnToSats(amountNgn, price.btcNgn),
    btcNgn: price.btcNgn,
    recipient: SETTLEMENT_ADDRESS,
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
    createdAt: new Date(now).toISOString(),
  };
  await store.putQuote(quote);

  return Response.json({ quoteId: quote.id, amountSats: quote.amountSats, recipient: quote.recipient, expiresAt: quote.expiresAt });
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("id is required.");
  const quote = await store.getQuote(id);
  if (!quote) return bad("Quote not found.", 404);
  return Response.json(quote);
}
