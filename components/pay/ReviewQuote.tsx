"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { NetworkBadge } from "../NetworkBadge";
import { Chip } from "../StatusChip";
import { useWallet } from "../providers/wallet";
import { FlowPanel } from "../shell/FlowPanel";
import { getJson } from "@/lib/hooks";
import { explorerTxUrl, formatBtc, formatInt, formatNgn } from "@/lib/format";
import { formatLocalPhone, networkInfo } from "@/lib/phone";
import { isUserRejection, payWithSbtc } from "@/lib/stacks/transfer";
import type { Quote } from "@/lib/types";

type Phase = { name: "review" } | { name: "wallet" } | { name: "recording"; txid: string } | { name: "error"; message: string; txid?: string };

const QUOTE_MS = 5 * 60_000;

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export function ReviewQuote({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { stxAddress, walletName } = useWallet();
  const wallet = walletName ?? "your wallet";
  const quote = useQuery({ queryKey: ["quote", quoteId], queryFn: () => getJson<Quote>(`/api/quotes?id=${quoteId}`), staleTime: Infinity });
  const [phase, setPhase] = useState<Phase>({ name: "review" });
  const [renewing, setRenewing] = useState(false);
  const now = useNow(Boolean(quote.data));

  const q = quote.data;
  const msLeft = q ? new Date(q.expiresAt).getTime() - now : 0;
  const expired = q ? msLeft <= 0 : false;
  const mmss = `${Math.floor(Math.max(0, msLeft) / 60_000)}:${String(Math.floor((Math.max(0, msLeft) % 60_000) / 1000)).padStart(2, "0")}`;
  const pct = Math.max(0, Math.min(100, (msLeft / QUOTE_MS) * 100));

  async function renew() {
    if (!q) return;
    setRenewing(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sender: q.sender, category: "airtime", network: q.network, phone: q.phone, amountNgn: q.amountNgn, networkOverride: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.replace(`/pay/review/${json.quoteId}`);
    } catch (e) {
      setPhase({ name: "error", message: e instanceof Error && e.message ? e.message : "Couldn’t get a new price. Try again." });
      setRenewing(false);
    }
  }

  async function confirm() {
    if (!q || !stxAddress || expired) return;
    setPhase({ name: "wallet" });
    let txid: string;
    try {
      txid = await payWithSbtc({ amountSats: q.amountSats, sender: stxAddress, recipient: q.recipient, quoteId: q.id, walletName });
    } catch (e) {
      setPhase(
        isUserRejection(e)
          ? { name: "review" }
          : { name: "error", message: e instanceof Error ? e.message : "The wallet couldn’t send the payment." },
      );
      return;
    }
    setPhase({ name: "recording", txid });
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quoteId: q.id, txid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn’t record the order.");
      qc.invalidateQueries({ queryKey: ["activity"] });
      router.push(`/pay/status/${json.orderId}`);
    } catch (e) {
      setPhase({ name: "error", txid, message: e instanceof Error ? e.message : "Couldn’t record the order." });
    }
  }

  if (quote.isPending) {
    return (
      <FlowPanel title="Review and confirm" step="Step 3 of 3" back="/pay/airtime" close="/pay">
        <div className="skel" style={{ height: 86, borderRadius: 18 }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel" style={{ height: 20 }} />
        ))}
      </FlowPanel>
    );
  }

  if (quote.isError || !q) {
    return (
      <FlowPanel title="Review and confirm" back="/pay/airtime" close="/pay">
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-warn-soft p-4">
          <span style={{ font: "700 15px/1.2 var(--body)" }}>We couldn’t find this price</span>
          <span className="tsm text-ink">It may have expired or the server restarted. Start again to get a fresh price.</span>
          <Link className="btn btn-s btn-sm" href="/pay/airtime">
            Start again
          </Link>
        </div>
      </FlowPanel>
    );
  }

  const net = networkInfo(q.network);
  const againHref = `/pay/airtime?network=${q.network}&phone=${q.phone}&amount=${q.amountNgn}`;

  if (phase.name === "wallet" || phase.name === "recording") {
    return (
      <FlowPanel title="Approve in your wallet" step="Step 3 of 3" width={540}>
        <div className="flex flex-col items-center gap-[18px] pt-3 text-center">
          <span className="pulse flex h-[84px] w-[84px] items-center justify-center rounded-[26px] bg-accent-soft text-accent-text">
            <Icon name="wallet" size={36} />
          </span>
          <h2 className="h1 text-[30px]">{phase.name === "wallet" ? "Check your wallet to approve" : "Payment sent"}</h2>
          <p className="tb16 max-w-[400px]">
            {phase.name === "wallet"
              ? `We’ve sent the request to ${wallet}. Check the details there and tap Approve. This screen updates on its own.`
              : "Recording your order. Hold on a moment…"}
          </p>
        </div>
        <div className="well px-[18px] py-1">
          <div className="kv">
            <span className="k">Paying</span>
            <span className="v">
              {net.name} airtime · {formatNgn(q.amountNgn)}
            </span>
          </div>
          <div className="kv">
            <span className="k">From your savings</span>
            <span className="v">{formatInt(q.amountSats)} sats</span>
          </div>
          <div className="kv">
            <span className="k">Network fee</span>
            <span className="v">Paid in STX, shown in {wallet}</span>
          </div>
        </div>
        <div role="status" className="flex items-center justify-center gap-2.5 text-ink-2" style={{ font: "600 15px/1.2 var(--body)" }}>
          <span className="dot pulse bg-accent" style={{ width: 10, height: 10 }} />
          {phase.name === "wallet" ? `Waiting for your approval · price locked for ${mmss}` : "Saving your order…"}
        </div>
        {phase.name === "wallet" && (
          <p className="tsm text-center">Wallet didn’t open? Make sure {wallet} is installed, unlocked and set to Testnet.</p>
        )}
      </FlowPanel>
    );
  }

  return (
    <FlowPanel
      title="Review and confirm"
      step="Step 3 of 3"
      back={againHref}
      close="/pay"
      width={540}
      footer={
        <>
          {expired ? (
            <button type="button" className="btn btn-p btn-lg btn-block" onClick={renew} disabled={renewing}>
              <Icon name="refresh" />
              {renewing ? "Getting a new price…" : "Get a new price"}
            </button>
          ) : (
            <button type="button" className="btn btn-p btn-lg btn-block" onClick={confirm}>
              <Icon name="wallet" />
              Confirm in wallet
            </button>
          )}
          <p className="txs flex items-start justify-center gap-2 text-center">
            <Icon name="lock" size={16} className="mt-px text-success" />
            You approve every payment in your wallet. Rack never holds your funds.
          </p>
        </>
      }
    >
      <div className="flex items-center gap-3.5 rounded-[18px] border border-line bg-surface-2 p-4">
        <span className="tile t-acc" style={{ width: 52, height: 52 }}>
          <Icon name="phone" size={24} />
        </span>
        <div className="flex flex-1 flex-col gap-[5px]">
          <span style={{ font: "600 15px/1.2 var(--body)" }}>Airtime · {net.name}</span>
          <span className="txs">{formatLocalPhone(q.phone)}</span>
        </div>
        <div className="flex flex-col items-end gap-[5px]">
          <span className="num" style={{ font: "700 28px/1 var(--display)" }}>
            {formatNgn(q.amountNgn)}
          </span>
          <span className="txs">{formatInt(q.amountSats)} sats</span>
        </div>
      </div>

      <div>
        <div className="kv">
          <span className="k">Recipient</span>
          <span className="v inline-flex items-center gap-2">
            <NetworkBadge network={q.network} size={22} />
            <span className="mono">{formatLocalPhone(q.phone)}</span>
          </span>
        </div>
        <div className="kv">
          <span className="k">Bill amount</span>
          <span className="v">{formatNgn(q.amountNgn)}</span>
        </div>
        <div className="kv">
          <span className="k">From your savings</span>
          <span className="v">
            {formatInt(q.amountSats)} sats
            <span className="txs mt-0.5 block font-medium">{formatBtc(q.amountSats)}</span>
          </span>
        </div>
        <div className="kv">
          <span className="k">
            <span className="inline-flex items-center gap-1">
              Network fee
              <span className="tipwrap">
                <button className="iconbtn text-ink-3" type="button" style={{ margin: "-12px -10px" }} aria-label="About network fees">
                  <Icon name="info" size={18} />
                </button>
                <span className="tip" role="tooltip">
                  The Stacks network charges a small fee in STX. {wallet} shows the exact fee before you approve.
                </span>
              </span>
            </span>
          </span>
          <span className="v">
            Small STX fee
            <span className="txs mt-0.5 block font-medium">shown in your wallet</span>
          </span>
        </div>
        <div className="kv mt-1 pt-3.5" style={{ borderTop: "1.5px solid var(--ink)", borderBottom: 0 }}>
          <span className="k font-bold text-ink">Total</span>
          <span className="v">
            <span className="num" style={{ font: "700 20px/1 var(--display)" }}>
              {formatNgn(q.amountNgn)}
            </span>{" "}
            · {formatInt(q.amountSats)} sats
          </span>
        </div>
      </div>

      {expired ? (
        <div className="flex items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3.5" role="alert">
          <Icon name="clock" className="mt-px text-warn" />
          <div className="flex flex-col gap-1">
            <span className="text-ink" style={{ font: "700 15px/1.2 var(--body)" }}>
              Price expired
            </span>
            <span className="tsm text-ink">Bitcoin’s price moves, so quotes last 5 minutes. Get a new one to continue.</span>
          </div>
        </div>
      ) : (
        <div className="well flex flex-col gap-2.5 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <Icon name="clock" className="text-ink-2" />
            <span className="flex-1" style={{ font: "600 15px/1.2 var(--body)" }}>
              Price locked for{" "}
              <span className="num" style={{ font: "700 16px/1 var(--display)" }}>
                {mmss}
              </span>
            </span>
            <Chip tone="ok" icon="lock">
              Locked
            </Chip>
          </div>
          <div
            role="progressbar"
            aria-label="Quote time left"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            className="h-1.5 overflow-hidden rounded-[3px] bg-sunken"
          >
            <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: pct < 20 ? "var(--warn)" : "var(--success)" }} />
          </div>
          <span className="txs">When time runs out you can get a fresh price. You’re never charged more without seeing it first.</span>
        </div>
      )}

      {phase.name === "error" && (
        <div role="alert" className="flex flex-col gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-danger">
          <span className="tsm flex items-start gap-2 text-danger">
            <Icon name="warning" size={18} className="mt-px" />
            {phase.message}
          </span>
          {phase.txid && (
            <a className="link text-sm" href={explorerTxUrl(phase.txid)} target="_blank" rel="noreferrer">
              View the transaction on the explorer
            </a>
          )}
        </div>
      )}
    </FlowPanel>
  );
}
