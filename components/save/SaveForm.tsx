"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "../icons";
import { useWallet } from "../providers/wallet";
import { FlowPanel } from "../shell/FlowPanel";
import { usePrice } from "@/lib/hooks";
import { formatBtc, formatInt, formatNgn, ngnToSats, satsToNgn, SATS_PER_BTC } from "@/lib/format";
import { MAX_SIGNER_FEE, MIN_DEPOSIT_SATS, prepareDeposit, sendBtcFromWallet, type PreparedDeposit } from "@/lib/sbtc/deposit";
import { isUserRejection } from "@/lib/stacks/transfer";
import { SBTC_BTC_NETWORK } from "@/lib/stacks/config";

type Phase =
  | { name: "form" }
  | { name: "preparing" }
  | { name: "wallet"; deposit: PreparedDeposit }
  | { name: "fallback"; deposit: PreparedDeposit; reason: string }
  | { name: "error"; message: string };

export function SaveForm() {
  const { stxAddress, btcPublicKey, walletName, disconnect } = useWallet();
  const price = usePrice();
  const router = useRouter();
  const qc = useQueryClient();
  const [unit, setUnit] = useState<"btc" | "ngn">("btc");
  const [raw, setRaw] = useState("0.005");
  const [phase, setPhase] = useState<Phase>({ name: "form" });
  const wallet = walletName ?? "your wallet";

  const value = Number(raw.replace(/,/g, ""));
  const sats =
    !Number.isFinite(value) || value <= 0
      ? 0
      : unit === "btc"
        ? Math.round(value * SATS_PER_BTC)
        : price.data
          ? ngnToSats(value, price.data.btcNgn)
          : 0;
  const tooSmall = sats > 0 && sats < MIN_DEPOSIT_SATS;
  const receiveMin = Math.max(0, sats - MAX_SIGNER_FEE);
  const ngn = (s: number) => (price.data ? formatNgn(satsToNgn(s, price.data.btcNgn)) : null);
  const equiv = unit === "btc" ? (sats && ngn(sats) ? `≈ ${ngn(sats)}` : "") : sats ? `≈ ${formatBtc(sats)} · ${formatInt(sats)} sats` : "";
  const canSubmit = sats >= MIN_DEPOSIT_SATS && Boolean(stxAddress && btcPublicKey);

  async function start() {
    if (!stxAddress || !btcPublicKey || !canSubmit) return;
    setPhase({ name: "preparing" });
    let deposit: PreparedDeposit;
    try {
      deposit = await prepareDeposit({ stxAddress, btcPublicKey });
    } catch (e) {
      setPhase({ name: "error", message: e instanceof Error ? e.message : "Couldn’t reach the sBTC signers. Try again." });
      return;
    }
    await sendFromWallet(deposit);
  }

  async function sendFromWallet(deposit: PreparedDeposit) {
    setPhase({ name: "wallet", deposit });
    let btcTxid: string;
    try {
      btcTxid = await sendBtcFromWallet(deposit.address, sats);
    } catch (e) {
      if (isUserRejection(e)) return setPhase({ name: "form" });
      return setPhase({ name: "fallback", deposit, reason: e instanceof Error ? e.message : String(e) });
    }
    const res = await fetch("/api/deposits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender: stxAddress, btcTxid, amountSats: sats, depositAddress: deposit.address, depositScript: deposit.depositScript, reclaimScript: deposit.reclaimScript }),
    });
    const json = await res.json();
    if (!res.ok) return setPhase({ name: "error", message: json.error ?? "Couldn’t record the deposit." });
    qc.invalidateQueries({ queryKey: ["activity"] });
    router.push(`/save?deposit=${json.id}`);
  }

  if (!btcPublicKey) {
    return (
      <FlowPanel title="Save bitcoin" step="Step 1 of 2" back="/home" close="/home">
        <p className="tb16">To save, Rack needs your wallet’s Bitcoin address. Reconnect your wallet to share it.</p>
        <button type="button" className="btn btn-p self-start" onClick={() => (disconnect(), router.push("/"))}>
          <Icon name="wallet" />
          Reconnect wallet
        </button>
      </FlowPanel>
    );
  }

  if (phase.name === "wallet" || phase.name === "preparing") {
    return (
      <FlowPanel title="Approve in your wallet" step="Step 2 of 2" width={540}>
        <div className="flex flex-col items-center gap-[18px] pt-3 text-center">
          <span className="pulse flex h-[84px] w-[84px] items-center justify-center rounded-[26px] bg-accent-soft text-accent-text">
            <Icon name="wallet" size={36} />
          </span>
          <h2 className="h1 text-[30px]">{phase.name === "preparing" ? "Preparing your deposit" : "Check your wallet to approve"}</h2>
          <p className="tb16 max-w-[400px]">
            {phase.name === "preparing"
              ? "Building your personal deposit address with the sBTC signers…"
              : `We’ve asked ${wallet} to send ${formatBtc(sats)} to your deposit address. Check the details there and approve.`}
          </p>
        </div>
        <div role="status" className="flex items-center justify-center gap-2.5 text-ink-2" style={{ font: "600 15px/1.2 var(--body)" }}>
          <span className="dot pulse bg-accent" style={{ width: 10, height: 10 }} />
          {phase.name === "preparing" ? "Talking to the Stacks network…" : "Waiting for your approval"}
        </div>
      </FlowPanel>
    );
  }

  if (phase.name === "fallback") {
    return <Fallback deposit={phase.deposit} sats={sats} reason={phase.reason} onRetry={() => sendFromWallet(phase.deposit)} />;
  }

  return (
    <FlowPanel
      title="Save bitcoin"
      step="Step 1 of 2"
      back="/home"
      close="/home"
      footer={
        <>
          <button type="button" className={`btn btn-p btn-lg btn-block${canSubmit ? "" : " dis"}`} aria-disabled={!canSubmit} onClick={start}>
            <Icon name="wallet" />
            Confirm in wallet
          </button>
          <p className="txs flex items-start justify-center gap-2 text-center">
            <Icon name="lock" size={16} className="mt-px text-success" />
            You’ll approve this in {wallet}. Rack never holds your funds.
          </p>
        </>
      }
    >
      <div className="flex items-center justify-between">
        <span className="lbl">Enter amount in</span>
        <div className="seg" role="group" aria-label="Amount unit">
          {(["btc", "ngn"] as const).map((u) => (
            <button
              key={u}
              type="button"
              className={unit === u ? "on" : ""}
              aria-pressed={unit === u}
              onClick={() => {
                if (u === unit) return;
                if (sats && price.data) setRaw(u === "btc" ? (sats / SATS_PER_BTC).toFixed(8).replace(/0+$/, "").replace(/\.$/, "") : String(Math.round(satsToNgn(sats, price.data.btcNgn))));
                setUnit(u);
              }}
              disabled={u === "ngn" && !price.data}
            >
              {u === "btc" ? "BTC" : "Naira"}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="lbl" htmlFor="save-amt">
          Amount to save
        </label>
        <div className={`inp big${tooSmall ? " err" : ""}`}>
          {unit === "ngn" && (
            <span className="num text-ink-3" style={{ fontSize: 34, fontWeight: 700 }}>
              ₦
            </span>
          )}
          <input
            id="save-amt"
            inputMode="decimal"
            value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/[^0-9.,]/g, ""))}
            aria-describedby="save-eq"
            aria-invalid={tooSmall}
          />
          {unit === "btc" && (
            <span className="num text-ink-2" style={{ fontSize: 22, fontWeight: 700 }}>
              BTC
            </span>
          )}
        </div>
        <span id="save-eq" className="tsm font-medium" role={tooSmall ? "alert" : undefined}>
          {tooSmall ? <span className="text-danger">The smallest deposit is {formatBtc(MIN_DEPOSIT_SATS)} ({formatInt(MIN_DEPOSIT_SATS)} sats).</span> : equiv || " "}
        </span>
      </div>

      <div className="well px-[18px] py-1">
        <div className="kv">
          <span className="k">You send</span>
          <span className="v">{formatBtc(sats)}</span>
        </div>
        <div className="kv">
          <span className="k">
            <span className="inline-flex items-center gap-1">
              Max signer fee
              <span className="tipwrap">
                <button className="iconbtn text-ink-3" type="button" style={{ margin: "-12px -10px" }} aria-label="About the signer fee">
                  <Icon name="info" size={18} />
                </button>
                <span className="tip" role="tooltip">
                  The sBTC signers take a fee from your deposit to process it: at most this much, often less. Rack takes no cut.
                </span>
              </span>
            </span>
          </span>
          <span className="v">
            up to {formatInt(MAX_SIGNER_FEE)} sats
          </span>
        </div>
        <div className="kv">
          <span className="k">Bitcoin network fee</span>
          <span className="v">Shown in {wallet}</span>
        </div>
        <div className="kv">
          <span className="k">Rack fee</span>
          <span className="v">₦0</span>
        </div>
        <div className="kv">
          <span className="k">
            <span className="flex flex-col gap-[3px]">
              <span className="font-semibold text-ink">You’ll receive at least</span>
              <span className="txs">as bitcoin savings (sBTC)</span>
            </span>
          </span>
          <span className="v">
            <span className="flex flex-col items-end gap-[3px]">
              <span className="num" style={{ font: "700 20px/1 var(--display)" }}>
                {formatInt(receiveMin)} sats<span className="est">est.</span>
              </span>
              {ngn(receiveMin) && <span className="txs">≈ {ngn(receiveMin)}</span>}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <Icon name="clock" size={18} className="mt-px text-ink-2" />
        <p className="tsm">Takes about 10–30 minutes, sometimes longer, while Bitcoin confirms it. You can close Rack; we’ll keep tracking.</p>
      </div>

      {SBTC_BTC_NETWORK === "regtest" && (
        <p className="txs rounded-xl bg-info-soft px-3.5 py-3 text-ink">
          Testnet note: Stacks testnet’s sBTC runs on a Bitcoin regtest network, so most wallets can’t send test BTC to it. If yours can’t, we’ll show
          your deposit address so you can see the full flow.
        </p>
      )}

      {phase.name === "error" && (
        <p role="alert" className="tsm flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-danger">
          <Icon name="warning" size={18} className="mt-px" />
          <span>{phase.message}</span>
        </p>
      )}
    </FlowPanel>
  );
}

function Fallback({ deposit, sats, reason, onRetry }: { deposit: PreparedDeposit; sats: number; reason: string; onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <FlowPanel
      title="Your deposit address"
      step="Testnet preview"
      back="/save"
      close="/home"
      footer={
        <>
          <button type="button" className="btn btn-s btn-lg btn-block" onClick={onRetry}>
            <Icon name="refresh" />
            Try the wallet again
          </button>
          <Link className="btn btn-g btn-block" href="/home">
            Back to home
          </Link>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3.5">
        <Icon name="warning" className="mt-px text-warn" />
        <div className="flex flex-col gap-1">
          <span className="text-ink" style={{ font: "700 15px/1.2 var(--body)" }}>
            Your wallet couldn’t send on this network
          </span>
          <span className="tsm text-ink">
            Stacks testnet’s sBTC runs on Bitcoin {SBTC_BTC_NETWORK}, which Leather and Xverse can’t send on. Everything up to signing works: here is the
            real deposit address built for you.
          </span>
          <span className="txs">Wallet said: {reason.slice(0, 140)}</span>
        </div>
      </div>
      <section className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-line-strong bg-surface-2 p-5">
        <span className="lbl">Send {formatBtc(sats)} to</span>
        <span className="mono break-all" style={{ fontSize: 15 }}>
          {deposit.address}
        </span>
        <button
          type="button"
          className="btn btn-s btn-sm self-start"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(deposit.address);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {}
          }}
        >
          <Icon name={copied ? "check" : "copy"} size={18} />
          {copied ? "Copied" : "Copy address"}
        </button>
        <span className="txs">
          Only BTC sent to this address mints sBTC to your Stacks address. If it isn’t processed, you can reclaim it with your own key after the lock time.
        </span>
      </section>
    </FlowPanel>
  );
}
