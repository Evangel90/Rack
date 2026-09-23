export const SATS_PER_BTC = 100_000_000;

const ngnFmt = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
const usdFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatNgn(n: number) {
  return `₦${ngnFmt.format(Math.round(n))}`;
}
export function formatUsd(n: number) {
  return `$${usdFmt.format(n)}`;
}
export function formatSats(sats: number | bigint) {
  return `${intFmt.format(Number(sats))} sats`;
}
export function formatInt(n: number) {
  return intFmt.format(n);
}
export function formatBtc(sats: number | bigint) {
  return `${(Number(sats) / SATS_PER_BTC).toFixed(8)} BTC`;
}
export function formatStx(micro: number | bigint) {
  return `${(Number(micro) / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })} STX`;
}

export function satsToNgn(sats: number, btcNgn: number) {
  return (sats / SATS_PER_BTC) * btcNgn;
}
export function satsToUsd(sats: number, btcUsd: number) {
  return (sats / SATS_PER_BTC) * btcUsd;
}
/** PRD pricing rule: sats = ceil(ngn / btcNgn × 100,000,000). */
export function ngnToSats(ngn: number, btcNgn: number) {
  return Math.ceil((ngn / btcNgn) * SATS_PER_BTC);
}

export function shortAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function explorerTxUrl(txid: string) {
  const id = txid.startsWith("0x") ? txid : `0x${txid}`;
  return `https://explorer.hiro.so/txid/${id}?chain=testnet`;
}

export function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`;
}
