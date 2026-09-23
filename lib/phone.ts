import type { Network } from "./types";

export const NETWORKS: { id: Network; name: string; letter: string; bg: string; fg: string }[] = [
  { id: "mtn", name: "MTN", letter: "M", bg: "#F2C200", fg: "#1C1813" },
  { id: "airtel", name: "Airtel", letter: "A", bg: "#D42A2A", fg: "#FFFFFF" },
  { id: "glo", name: "Glo", letter: "G", bg: "#2E8B2E", fg: "#FFFFFF" },
  { id: "9mobile", name: "9mobile", letter: "9", bg: "#0B5345", fg: "#FFFFFF" },
];

export function networkInfo(id: Network) {
  return NETWORKS.find((n) => n.id === id)!;
}

// Common Nigerian mobile prefixes (4-digit, local format). Ported numbers can differ, so users can override.
const PREFIXES: Record<Network, string[]> = {
  mtn: ["0703", "0706", "0803", "0806", "0810", "0813", "0814", "0816", "0903", "0906", "0913", "0916", "0704", "07025", "07026"],
  airtel: ["0701", "0708", "0802", "0808", "0812", "0901", "0902", "0904", "0907", "0911", "0912"],
  glo: ["0705", "0805", "0807", "0811", "0815", "0905", "0915"],
  "9mobile": ["0809", "0817", "0818", "0908", "0909"],
};

/** Normalise a Nigerian mobile number to `234XXXXXXXXXX`, or null if it isn't one. */
export function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 || !/^[789][01]\d{8}$/.test(d)) return null;
  return `234${d}`;
}

export function detectNetwork(input: string): Network | null {
  const n = normalizePhone(input);
  if (!n) return null;
  const local = `0${n.slice(3)}`;
  // Check longer prefixes first so 07025 wins over 0702.
  let best: { net: Network; len: number } | null = null;
  for (const [net, list] of Object.entries(PREFIXES) as [Network, string[]][]) {
    for (const p of list) {
      if (local.startsWith(p) && (!best || p.length > best.len)) best = { net, len: p.length };
    }
  }
  return best?.net ?? null;
}

/** `08034567214` → `0803 456 7214` */
export function formatLocalPhone(input: string) {
  const n = normalizePhone(input);
  if (!n) return input;
  const l = `0${n.slice(3)}`;
  return `${l.slice(0, 4)} ${l.slice(4, 7)} ${l.slice(7)}`;
}

export function maskPhone(normalized: string) {
  const l = `0${normalized.slice(3)}`;
  return `${l.slice(0, 4)} •••• ${l.slice(-3)}`;
}

export const MIN_NGN = 100;
export const MAX_NGN = 50_000;
export const AMOUNT_PRESETS = [500, 1000, 2000, 5000];
