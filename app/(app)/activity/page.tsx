"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityRow, ActivitySkeletonRow } from "@/components/ActivityRow";
import { ErrorLine } from "@/components/ErrorLine";
import { Icon } from "@/components/icons";
import { useActivity, usePrice, type ActivityItem } from "@/lib/hooks";

type Filter = "all" | "savings" | "bills" | "earnings";
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "savings", label: "Savings" },
  { id: "bills", label: "Bills" },
  { id: "earnings", label: "Earnings" },
];

function groupLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function ActivityPage() {
  const activity = useActivity();
  const price = usePrice();
  const [filter, setFilter] = useState<Filter>("all");

  const items = (activity.data ?? []).filter(
    (a) => filter === "all" || (filter === "savings" && a.kind === "deposit") || (filter === "bills" && a.kind === "order"),
  );
  const groups: { label: string; items: ActivityItem[] }[] = [];
  for (const item of items) {
    const label = groupLabel(item.createdAt);
    const g = groups.at(-1);
    if (g?.label === label) g.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="h1 text-[30px] lg:text-[34px]">Activity</h1>
        <p className="tb16 hidden lg:block">Deposits and bill payments started in Rack, with links to the explorer.</p>
      </div>

      <div role="group" aria-label="Filter activity" className="-mt-1 flex gap-1.5 lg:hidden">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`pill${filter === f.id ? " on" : ""}`}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            style={{ padding: "0 12px", fontSize: 14 }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="seg hidden self-start lg:inline-flex" role="group" aria-label="Filter activity">
        {filters.map((f) => (
          <button key={f.id} type="button" className={filter === f.id ? "on" : ""} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} style={{ minWidth: 96 }}>
            {f.label}
          </button>
        ))}
      </div>

      <section aria-label="Activity list" className="lg-card -mt-2 lg:mt-0 lg:px-7 lg:pb-3">
        <div aria-hidden="true" className="txs hidden grid-cols-[44px_minmax(0,1fr)_140px_150px] gap-4 pt-4 pr-[34px] lg:grid">
          <span />
          <span>Details</span>
          <span>Status</span>
          <span className="text-right">Amount</span>
        </div>

        {activity.isPending ? (
          <div className="pt-3">
            <ActivitySkeletonRow />
            <ActivitySkeletonRow />
            <ActivitySkeletonRow />
            <ActivitySkeletonRow />
          </div>
        ) : activity.isError ? (
          <div className="py-4">
            <ErrorLine message="Couldn’t load your activity." onRetry={() => activity.refetch()} />
          </div>
        ) : filter === "earnings" ? (
          <Empty
            title="No earnings yet"
            body="Earning a variable bitcoin yield is coming soon. Earnings will show up here, paid in bitcoin."
            cta={{ href: "/earn", label: "How yield works" }}
          />
        ) : groups.length === 0 ? (
          <Empty
            title={filter === "savings" ? "No deposits yet" : filter === "bills" ? "No bill payments yet" : "No activity yet"}
            body="Your deposits and bill payments will show up here."
            cta={filter === "savings" ? { href: "/save", label: "Save bitcoin" } : { href: "/pay", label: "Pay a bill" }}
          />
        ) : (
          groups.map((g) => (
            <div key={g.label}>
              <h2 className="eyebrow m-0 pt-[18px] pb-1 lg:pt-[22px] lg:pb-1.5">{g.label}</h2>
              {g.items.map((item) => (
                <ActivityRow key={item.id} item={item} btcNgn={price.data?.btcNgn} showExplorer />
              ))}
            </div>
          ))
        )}
      </section>
    </>
  );
}

function Empty({ title, body, cta }: { title: string; body: string; cta: { href: string; label: string } }) {
  return (
    <div className="well my-4 flex items-start gap-3.5 p-5" style={{ borderStyle: "dashed" }}>
      <span className="tile">
        <Icon name="list" />
      </span>
      <div className="flex flex-col items-start gap-1">
        <span style={{ font: "600 15px/1.2 var(--body)" }}>{title}</span>
        <span className="tsm">{body}</span>
        <Link className="link mt-1 inline-flex min-h-11 items-center" href={cta.href}>
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
