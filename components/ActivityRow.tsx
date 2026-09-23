import Link from "next/link";
import { Icon } from "./icons";
import { DepositStatusChip, OrderStatusChip } from "./StatusChip";
import type { ActivityItem } from "@/lib/hooks";
import { explorerTxUrl, formatInt, formatNgn, formatWhen, satsToNgn } from "@/lib/format";
import { maskPhone, networkInfo } from "@/lib/phone";
import { BTC_EXPLORER_URL } from "@/lib/stacks/config";

const DESKTOP_GRID = "lg:grid lg:grid-cols-[44px_minmax(0,1fr)_140px_150px] lg:gap-4";

function describe(item: ActivityItem, btcNgn?: number) {
  if (item.kind === "order") {
    const o = item.order;
    const sign = o.status === "failed" ? "" : "−";
    return {
      href: `/pay/status/${o.id}`,
      icon: "phone" as const,
      tile: "",
      title: `Airtime · ${networkInfo(o.network).name}`,
      detail: maskPhone(o.phone),
      chip: <OrderStatusChip status={o.status} />,
      ngn: `${sign}${formatNgn(o.amountNgn)}`,
      sats: `${sign}${formatInt(o.amountSats)} sats`,
      muted: o.status === "failed",
      explorer: o.txid ? explorerTxUrl(o.txid) : null,
      explorerLabel: "View payment on Stacks explorer",
    };
  }
  const d = item.deposit;
  return {
    href: `/save?deposit=${d.id}`,
    icon: "arrowIn" as const,
    tile: "t-acc",
    title: "Saved bitcoin",
    detail: "From your Bitcoin wallet",
    chip: <DepositStatusChip status={d.status} />,
    ngn: btcNgn ? `+${formatNgn(satsToNgn(d.amountSats, btcNgn))}` : "",
    sats: `+${formatInt(d.amountSats)} sats`,
    muted: d.status === "failed",
    explorer: BTC_EXPLORER_URL ? `${BTC_EXPLORER_URL}/tx/${d.btcTxid}` : null,
    explorerLabel: "View deposit on Bitcoin explorer",
  };
}

export function ActivityRow({ item, btcNgn, showExplorer }: { item: ActivityItem; btcNgn?: number; showExplorer?: boolean }) {
  const r = describe(item, btcNgn);
  const when = formatWhen(item.createdAt);
  return (
    <div className="row relative">
      <Link href={r.href} className={`flex min-w-0 flex-1 items-center gap-3.5 text-ink no-underline ${DESKTOP_GRID}`}>
        <span className={`tile ${r.tile}`}>
          <Icon name={r.icon} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5 lg:gap-[5px]">
          <span className="truncate" style={{ font: "600 15px/1.2 var(--body)" }}>
            {r.title}
          </span>
          <span className="flex items-center gap-2 lg:hidden">
            {r.chip}
            <span className="txs truncate">{when}</span>
          </span>
          <span className="txs hidden truncate lg:block">
            {when} · {r.detail}
          </span>
        </span>
        <span className="hidden lg:block">{r.chip}</span>
        <span className={`flex flex-col items-end gap-1.5${r.muted ? " text-ink-3 line-through" : ""}`}>
          {r.ngn && (
            <span className="num whitespace-nowrap" style={{ font: "700 16px/1 var(--display)", letterSpacing: "-0.02em" }}>
              {r.ngn}
            </span>
          )}
          <span className="txs whitespace-nowrap">{r.sats}</span>
        </span>
      </Link>
      {showExplorer && r.explorer && (
        <a className="iconbtn -mr-2.5 text-ink-3" href={r.explorer} target="_blank" rel="noreferrer" aria-label={r.explorerLabel}>
          <Icon name="external" size={18} />
        </a>
      )}
    </div>
  );
}

export function ActivitySkeletonRow() {
  return (
    <div className="row" aria-hidden="true">
      <span className="skel" style={{ width: 44, height: 44, borderRadius: 14 }} />
      <span className="flex flex-1 flex-col gap-2">
        <span className="skel" style={{ width: "70%", height: 14 }} />
        <span className="skel" style={{ width: "40%", height: 12 }} />
      </span>
      <span className="flex flex-col items-end gap-2">
        <span className="skel" style={{ width: 64, height: 14 }} />
        <span className="skel" style={{ width: 48, height: 12 }} />
      </span>
    </div>
  );
}
