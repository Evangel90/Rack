"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { NetworkBadge } from "@/components/NetworkBadge";
import { useActivity, useBalances, usePrice } from "@/lib/hooks";
import { formatInt, formatNgn, satsToNgn } from "@/lib/format";
import { maskPhone, networkInfo } from "@/lib/phone";
import type { Order } from "@/lib/types";

const categories: { name: string; sub: string; icon: IconName; href: string | null }[] = [
  { name: "Airtime", sub: "MTN, Airtel, Glo, 9mobile", icon: "phone", href: "/pay/airtime" },
  { name: "Data", sub: "Bundles for every network", icon: "signal", href: null },
  { name: "Electricity", sub: "Prepaid and postpaid meters", icon: "bolt", href: "/pay/electricity" },
  { name: "TV", sub: "DStv, GOtv, StarTimes", icon: "tv", href: null },
];

export default function PayPage() {
  const balances = useBalances();
  const price = usePrice();
  const activity = useActivity();
  const sats = balances.data ? Number(balances.data.sbtc) : null;
  const available =
    sats === null ? null : price.data ? `${formatNgn(satsToNgn(sats, price.data.btcNgn))} · ${formatInt(sats)} sats` : `${formatInt(sats)} sats`;

  // "Pay again": the user's last distinct fulfilled airtime purchases.
  const seen = new Set<string>();
  const again: Order[] = [];
  for (const a of activity.data ?? []) {
    if (a.kind !== "order" || a.order.status !== "fulfilled") continue;
    const key = `${a.order.network}|${a.order.phone}|${a.order.amountNgn}`;
    if (seen.has(key)) continue;
    seen.add(key);
    again.push(a.order);
    if (again.length === 4) break;
  }

  return (
    <>
      <div className="flex flex-col gap-1.5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="flex flex-col gap-1.5 lg:gap-2">
          <h1 className="h1 text-[30px] lg:text-[34px]">Pay a bill</h1>
          <p className="tsm lg:text-base lg:leading-normal">
            <span className="lg:hidden">From your bitcoin savings{available ? ` · ${available} available` : ""}</span>
            <span className="hidden lg:inline">Paid from your bitcoin savings. The naira price is locked when you check out.</span>
          </p>
        </div>
        <div className="well hidden flex-col items-end gap-1 px-4 py-3 lg:flex">
          <span className="txs">Available to spend</span>
          {available ? (
            <span style={{ font: "600 15px/1 var(--body)" }}>{available}</span>
          ) : (
            <span className="skel" style={{ width: 180, height: 16 }} />
          )}
        </div>
      </div>

      <section aria-label="Bill categories" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {categories.map((c) => {
          const body = (
            <>
              <span className="flex items-start justify-between">
                <span className={`tile ${c.href ? "t-acc" : ""} h-[52px] w-[52px] rounded-2xl lg:h-14 lg:w-14 lg:rounded-[18px]`}>
                  <Icon name={c.icon} size={24} />
                </span>
                {c.href === "/pay/airtime" ? (
                  <Icon name="chevronRight" className="hidden text-ink-3 lg:block" />
                ) : (
                  <span className="chip c-neu">Soon</span>
                )}
              </span>
              <span className="flex flex-col gap-1 lg:gap-1.5">
                <span className="text-[19px] leading-[1.1] font-bold tracking-[-0.02em] lg:text-[22px]" style={{ fontFamily: "var(--display)" }}>
                  {c.name}
                </span>
                <span className="txs lg:text-[14.5px] lg:font-normal lg:text-ink-2">{c.sub}</span>
              </span>
            </>
          );
          return c.href ? (
            <Link key={c.name} className="bill gap-4 p-[18px] lg:gap-3.5 lg:p-[22px]" href={c.href}>
              {body}
            </Link>
          ) : (
            <div key={c.name} className="bill gap-4 p-[18px] opacity-70 lg:gap-3.5 lg:p-[22px]" aria-label={`${c.name}: coming soon`} style={{ cursor: "default" }}>
              {body}
            </div>
          );
        })}
      </section>

      {again.length > 0 && (
        <section className="flex flex-col lg:gap-3.5">
          <h2 className="m-0 pt-1.5 pb-1 text-lg font-bold lg:text-xl" style={{ fontFamily: "var(--display)", letterSpacing: "-0.02em" }}>
            Pay again
          </h2>
          <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-4">
            {again.map((o) => {
              const n = networkInfo(o.network);
              const href = `/pay/airtime?network=${o.network}&phone=${o.phone}&amount=${o.amountNgn}`;
              return (
                <div key={o.id} className="row min-h-[68px] lg-card lg:flex-col lg:items-stretch lg:gap-3.5 lg:p-[18px]">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <NetworkBadge network={o.network} size={40} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span style={{ font: "600 15px/1.2 var(--body)" }}>
                        {n.name} · {formatNgn(o.amountNgn)}
                      </span>
                      <span className="txs truncate">Airtime · {maskPhone(o.phone)}</span>
                    </span>
                  </div>
                  <Link className="pill px-3.5 text-sm lg:hidden" href={href} aria-label={`Pay ${n.name} ${maskPhone(o.phone)} again`}>
                    Pay again
                  </Link>
                  <Link className="btn btn-s btn-sm btn-block hidden lg:inline-flex" href={href}>
                    Pay {formatNgn(o.amountNgn)} again
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="well hidden justify-center gap-7 px-5 py-4 lg:flex">
        {(
          [
            ["lock", "Price locked for 5 minutes at checkout"],
            ["shield", "Your wallet sends exactly the quoted amount"],
            ["check", "You approve every payment in your wallet"],
          ] as const
        ).map(([icon, text]) => (
          <span key={text} className="txs flex items-start gap-2">
            <Icon name={icon} size={16} className="mt-px text-success" />
            {text}
          </span>
        ))}
      </div>
    </>
  );
}
