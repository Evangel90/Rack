"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { Chip, OrderStatusChip } from "../StatusChip";
import { StepTracker, type Step } from "../StepTracker";
import { FlowPanel } from "../shell/FlowPanel";
import { getJson } from "@/lib/hooks";
import { explorerTxUrl, formatInt, formatNgn, formatWhen } from "@/lib/format";
import { formatLocalPhone, networkInfo } from "@/lib/phone";
import type { Order } from "@/lib/types";

const TERMINAL = ["fulfilled", "failed", "refund_needed"];

export function OrderStatusView({ orderId }: { orderId: string }) {
  const qc = useQueryClient();
  const order = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getJson<Order>(`/api/orders/${orderId}`),
    // PRD: the status page polls every 5 seconds until the order settles.
    refetchInterval: (q) => (q.state.data && TERMINAL.includes(q.state.data.status) ? false : 5000),
  });
  const o = order.data;
  const done = o && TERMINAL.includes(o.status);

  useEffect(() => {
    if (done) {
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
    }
  }, [done, qc]);

  if (order.isPending) {
    return (
      <FlowPanel title="Payment status" back="/pay">
        <div className="flex flex-col items-center gap-3.5 pt-2">
          <span className="skel" style={{ width: 72, height: 72, borderRadius: "50%" }} />
          <span className="skel" style={{ width: 220, height: 28 }} />
          <span className="skel" style={{ width: 280, height: 16 }} />
        </div>
      </FlowPanel>
    );
  }
  if (order.isError || !o) {
    return (
      <FlowPanel title="Payment status" back="/activity" backLabel="Back to Activity">
        <p className="tb16">We couldn’t find this order. It may have been created on another server instance. Check Activity or the explorer.</p>
        <Link className="btn btn-s" href="/activity">
          Go to Activity
        </Link>
      </FlowPanel>
    );
  }

  const net = networkInfo(o.network);
  const phone = formatLocalPhone(o.phone);
  const explorer = explorerTxUrl(o.txid);
  const retryHref = `/pay/airtime?network=${o.network}&phone=${o.phone}&amount=${o.amountNgn}`;

  const facts = (
    <div>
      <div className="kv">
        <span className="k">Amount</span>
        <span className="v">
          {formatNgn(o.amountNgn)} · {formatInt(o.amountSats)} sats
        </span>
      </div>
      <div className="kv">
        <span className="k">Recipient</span>
        <span className="v">
          {net.name} · <span className="mono">{phone}</span>
        </span>
      </div>
      {o.reference && (
        <div className="kv">
          <span className="k">Reference</span>
          <span className="v mono">{o.reference}</span>
        </div>
      )}
      <div className="kv">
        <span className="k">Transaction</span>
        <span className="v">
          <a className="link inline-flex items-center gap-1" href={explorer} target="_blank" rel="noreferrer">
            <span className="mono">
              {o.txid.slice(0, 8)}…{o.txid.slice(-6)}
            </span>
            <Icon name="external" size={14} />
          </a>
        </span>
      </div>
      <div className="kv">
        <span className="k">Started</span>
        <span className="v">{formatWhen(o.createdAt)}</span>
      </div>
    </div>
  );

  if (o.status === "fulfilled") {
    return (
      <FlowPanel
        title="Payment complete"
        back="/pay"
        backLabel="Back to Pay"
        close="/home"
        footer={
          <>
            <Link className="btn btn-p btn-lg btn-block" href="/pay">
              Pay another bill
            </Link>
            <ShareButton order={o} />
          </>
        }
      >
        <Hero tone="ok" icon="check" title="Payment complete">
          {formatNgn(o.amountNgn)} of {net.name} airtime sent to {phone}.
        </Hero>
        <section aria-label="Top-up reference" className="flex flex-col gap-3.5 rounded-[20px] border-[1.5px] border-line-strong bg-surface-2 p-5">
          <div className="flex items-center justify-between">
            <span className="lbl">Top-up reference</span>
            <OrderStatusChip status={o.status} />
          </div>
          <span className="num break-all" style={{ font: "700 26px/1.15 var(--display)", letterSpacing: ".02em" }}>
            {o.reference}
          </span>
          <span className="txs">Demo biller: no real airtime is sent on testnet.</span>
        </section>
        {facts}
      </FlowPanel>
    );
  }

  if (o.status === "failed" || o.status === "refund_needed") {
    const refund = o.status === "refund_needed";
    return (
      <FlowPanel
        title={refund ? "Airtime not delivered" : "Payment didn’t go through"}
        back="/pay"
        backLabel="Back to Pay"
        close="/home"
        footer={
          <>
            <Link className="btn btn-p btn-lg btn-block" href={retryHref}>
              <Icon name="refresh" />
              Try again
            </Link>
            <Link className="btn btn-g btn-block" href="/settings#help">
              <Icon name="chat" />
              Get help
            </Link>
          </>
        }
      >
        <Hero tone="fail" icon="close" title={refund ? "Airtime not delivered" : "Payment didn’t go through"}>
          {refund ? `${net.name} didn’t confirm the top-up for ${phone}.` : o.failureReason}
        </Hero>
        {refund ? (
          <section className="flex flex-col gap-2.5 rounded-[18px] bg-success-soft p-[18px]">
            <div className="flex items-center gap-2.5 text-success">
              <Icon name="undo" />
              <h3 className="h3 flex-1 text-ink">Your {formatInt(o.amountSats)} sats will come back</h3>
            </div>
            <p className="tsm text-ink">In this testnet preview Rack returns refunds manually to the wallet that paid, within 24 hours.</p>
            <span>
              <Chip tone="pend" icon="clock">
                Refund due
              </Chip>
            </span>
          </section>
        ) : (
          <section className="flex flex-col gap-2 rounded-[18px] bg-sunken p-[18px]">
            <h3 className="h3">What to do next</h3>
            <p className="tsm">
              Check the transaction on the explorer. If it failed on chain, your sats never left your wallet: just try again. If sats did leave your wallet,
              contact us with the transaction link.
            </p>
          </section>
        )}
        {facts}
      </FlowPanel>
    );
  }

  const steps: Step[] = [
    { label: "Approved in your wallet", detail: formatWhen(o.createdAt), state: "done" },
    {
      label: "Confirming on the Stacks network",
      detail: o.status === "awaiting_payment" ? "Usually a few seconds to a few minutes on testnet." : `${formatInt(o.amountSats)} sats received`,
      state: o.status === "awaiting_payment" ? "active" : "done",
    },
    { label: `Sending airtime to ${phone}`, state: o.status === "paid" ? "active" : "todo" },
    { label: "Airtime delivered", state: "todo" },
  ];

  return (
    <FlowPanel
      title="Payment processing"
      back="/pay"
      backLabel="Back to Pay"
      close="/home"
      footer={
        <>
          <Link className="btn btn-p btn-lg btn-block" href="/home">
            Back to home
          </Link>
          <Link className="btn btn-g btn-block" href="/activity">
            You can leave this screen · View in Activity
          </Link>
        </>
      }
    >
      <Hero tone="info" icon="clock" title="Payment processing" pulse>
        Your sats are on their way. We’ll send the airtime as soon as the network confirms your payment.
      </Hero>
      <div className="well p-[18px]" role="status" aria-live="polite">
        <StepTracker steps={steps} />
      </div>
      <div className="txs flex items-start justify-center gap-2">
        <Icon name="shield" size={16} className="mt-px text-success" />
        <span>We only mark a payment as paid after checking it on the Stacks network.</span>
      </div>
      {facts}
    </FlowPanel>
  );
}

function Hero({ tone, icon, title, pulse, children }: { tone: "ok" | "fail" | "info"; icon: "check" | "close" | "clock"; title: string; pulse?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3.5 text-center">
      <span className={`tile t-${tone}${pulse ? " pulse" : ""}`} style={{ width: 72, height: 72, borderRadius: "50%" }}>
        <Icon name={icon} size={32} bold={icon !== "clock"} />
      </span>
      <h2 className="h1 text-[28px] lg:hidden">{title}</h2>
      <p className="tb16 max-w-[420px]">{children}</p>
    </div>
  );
}

function ShareButton({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const text = `Rack receipt: ${formatNgn(order.amountNgn)} ${networkInfo(order.network).name} airtime to ${formatLocalPhone(order.phone)}, paid with ${formatInt(order.amountSats)} sats. Ref ${order.reference}. ${explorerTxUrl(order.txid)}`;
    try {
      if (navigator.share) await navigator.share({ title: "Rack receipt", text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }
  return (
    <button type="button" className="btn btn-s btn-block" onClick={share}>
      <Icon name={copied ? "check" : "share"} />
      {copied ? "Receipt copied" : "Share receipt"}
    </button>
  );
}
