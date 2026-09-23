import { networkInfo } from "@/lib/phone";
import type { Network } from "@/lib/types";

export function NetworkBadge({ network, size = 28 }: { network: Network; size?: number }) {
  const n = networkInfo(network);
  return (
    <span className="badge" aria-hidden="true" style={{ width: size, height: size, background: n.bg, color: n.fg, fontSize: Math.round(size * 0.45) }}>
      {n.letter}
    </span>
  );
}
