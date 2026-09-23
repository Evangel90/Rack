"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "../icons";
import { DepositStatusChip } from "../StatusChip";
import { StepTracker, type Step } from "../StepTracker";
import { FlowPanel } from "../shell/FlowPanel";
import { getJson, usePrice } from "@/lib/hooks";
import { formatBtc, formatInt, formatNgn, formatWhen, satsToNgn } from "@/lib/format";
import { BTC_EXPLORER_URL } from "@/lib/stacks/config";
import type { Deposit } from "@/lib/types";

const ORDER = ["sent", "confirming", "minting", "done"] as const;

export function DepositTracker({ id }: { id: string }) {
  const price = usePrice();
  const q = useQuery({
    queryKey: ["deposit", id],
    queryFn: () => getJson<Deposit>(`/api/deposits/${id}`),
    refetchInterval: (s) => (s.state.data && ["done", "failed"].includes(s.state.data.status) ? false : 15_000),
  });
  const d = q.data;

  if (q.isPending) {
    return (
      <FlowPanel title="Saving" back="/home">
        <span className="skel" style={{ width: 240, height: 40 }} />
        <span className="skel" style={{ height: 180, borderRadius: 16 }} />
      </FlowPanel>
    );
  }
  if (!d) {
    return (
      <FlowPanel title="Saving" back="/home">
        <p className="tb16">We couldn’t find this deposit.</p>
        <Link className="btn btn-s self-start" href="/activity">
          Go to Activity
        </Link>
      </FlowPanel>
    );
  }

  const idx = d.status === "failed" ? -1 : ORDER.indexOf(d.status);
  const state = (i: number): Step["state"] => (d.status === "done" || i < idx ? "done" : i === idx ? "active" : "todo");
  const steps: Step[] = [
    { label: "Sent from your wallet", detail: formatWhen(d.createdAt), state: "done" },
    {
      label: "Confirming on Bitcoin",
      detail: d.notified ? "Waiting for Bitcoin blocks. Usually 10–30 minutes." : "Waiting for the sBTC signers to see your transaction.",
      state: d.status === "failed" ? "failed" : state(1),
    },
    { label: "Minting sBTC", detail: "Your BTC becomes bitcoin savings you can use for bills.", state: d.status === "failed" ? "todo" : state(2) },
    { label: "Done", detail: "Added to your savings.", state: d.status === "done" ? "done" : "todo" },
  ];
  // Measured at the last poll, so render stays pure.
  const minutes = Math.round((q.dataUpdatedAt - new Date(d.createdAt).getTime()) / 60_000);
  const explorer = BTC_EXPLORER_URL ? `${BTC_EXPLORER_URL}/tx/${d.btcTxid}` : null;

  return (
    <FlowPanel
      title={d.status === "done" ? "Saved" : "Saving bitcoin"}
      back="/home"
      close="/home"
      footer={
        <Link className="btn btn-p btn-lg btn-block" href="/home">
          Back to home
        </Link>
      }
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="lbl">{d.status === "done" ? "Saved" : "Saving"}</span>
          <DepositStatusChip status={d.status} />
        </div>
        <span className="num" style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>
          {formatInt(d.amountSats)} sats
        </span>
        <span className="tsm">
          {formatBtc(d.amountSats)}
          {price.data ? ` · ≈ ${formatNgn(satsToNgn(d.amountSats, price.data.btcNgn))}` : ""}
        </span>
      </div>

      <div role="status" aria-live="polite">
        <StepTracker steps={steps} />
      </div>

      {d.status === "failed" ? (
        <section className="flex flex-col gap-2.5 rounded-2xl bg-danger-soft px-[18px] py-4">
          <h3 className="h3">This deposit didn’t go through</h3>
          <p className="tsm text-ink">{d.statusMessage ?? "The sBTC signers didn’t accept it."} Your BTC is safe: you can reclaim it with your own key after the lock time. A reclaim button is coming in the next release.</p>
        </section>
      ) : (
        minutes >= 30 &&
        d.status !== "done" && (
          <section className="well flex flex-col gap-2.5 border-transparent bg-info-soft px-[18px] py-4">
            <div className="flex items-center gap-2.5 text-info">
              <Icon name="clock" />
              <h3 className="h3 text-ink">It’s taking a while</h3>
              <span className="txs ml-auto">Started {minutes} min ago</span>
            </div>
            <p className="tsm text-ink">Bitcoin adds a new block about every 10 minutes. Nothing is lost, and you don’t need to keep Rack open.</p>
          </section>
        )
      )}

      <div>
        <div className="kv">
          <span className="k">Bitcoin transaction</span>
          <span className="v">
            {explorer ? (
              <a className="link inline-flex items-center gap-1" href={explorer} target="_blank" rel="noreferrer">
                <span className="mono">
                  {d.btcTxid.slice(0, 8)}…{d.btcTxid.slice(-6)}
                </span>
                <Icon name="external" size={14} />
              </a>
            ) : (
              <span className="mono">
                {d.btcTxid.slice(0, 8)}…{d.btcTxid.slice(-6)}
              </span>
            )}
          </span>
        </div>
        <div className="kv">
          <span className="k">Deposit address</span>
          <span className="v mono break-all" style={{ fontSize: 13 }}>
            {d.depositAddress}
          </span>
        </div>
      </div>
      <div className="txs flex items-start justify-center gap-2">
        <Icon name="shield" size={16} className="mt-px text-success" />
        <span>Your funds are safe: if this fails, you can reclaim your BTC.</span>
      </div>
    </FlowPanel>
  );
}
