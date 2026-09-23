"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Icon } from "@/components/icons";
import { useWallet } from "@/components/providers/wallet";
import { WalletBadge } from "@/components/shell/AppShell";
import { FlowPanel } from "@/components/shell/FlowPanel";
import { Chip } from "@/components/StatusChip";
import { StepTracker } from "@/components/StepTracker";
import { useBalances, usePrice } from "@/lib/hooks";
import { formatBtc, formatInt, formatNgn, SATS_PER_BTC, satsToNgn, shortAddress } from "@/lib/format";

// Withdraw (sBTC → BTC) is Milestone 1 scope in the design. This build shows the UI with the
// user's real balance and address; the request itself isn't sent, and the next steps are a preview.
const EXAMPLE_BTC_FEE = 1_200;

export default function WithdrawPage() {
  return (
    <Suspense>
      <WithdrawRouter />
    </Suspense>
  );
}

function WithdrawRouter() {
  const params = useSearchParams();
  const sats = Math.max(0, Number(params.get("sats")) || 100_000);
  const step = params.get("step");
  if (step === "tracking") return <TrackingPreview sats={sats} />;
  if (step === "done") return <DonePreview sats={sats} />;
  return <WithdrawForm />;
}

function PreviewNote() {
  return (
    <p className="txs flex items-start gap-2 rounded-xl bg-info-soft px-3.5 py-3 text-ink">
      <Icon name="info" size={16} className="mt-px text-info" />
      Preview: withdrawals arrive in Milestone 1. Nothing is sent from this screen.
    </p>
  );
}

function useNgn() {
  const price = usePrice();
  return (s: number) => (price.data ? formatNgn(satsToNgn(s, price.data.btcNgn)) : null);
}

function WithdrawForm() {
  const { btcAddress, walletName } = useWallet();
  const balances = useBalances();
  const ngn = useNgn();
  const [raw, setRaw] = useState("0.001");
  const available = balances.data ? Number(balances.data.sbtc) : null;
  const value = Number(raw.replace(/,/g, ""));
  const sats = Number.isFinite(value) && value > 0 ? Math.round(value * SATS_PER_BTC) : 0;
  const tooMuch = available !== null && sats > available;
  const receive = Math.max(0, sats - EXAMPLE_BTC_FEE);
  const wallet = walletName ?? "your wallet";

  return (
    <FlowPanel
      title="Withdraw to Bitcoin"
      step="Step 1 of 2 · Amount"
      back="/home"
      close="/home"
      width={500}
      footer={
        <>
          <button type="button" className="btn btn-p btn-lg btn-block dis" aria-disabled="true">
            <Icon name="wallet" />
            Confirm in wallet · coming soon
          </button>
          <Link className="link inline-flex min-h-11 items-center self-center" style={{ fontSize: 14.5 }} href={`/withdraw?step=tracking&sats=${sats || 100_000}`}>
            Preview the next steps
          </Link>
          <p className="txs flex items-start justify-center gap-2 text-center">
            <Icon name="lock" size={16} className="mt-px text-success" />
            You’ll approve this in {wallet}. Rack never holds your funds.
          </p>
        </>
      }
    >
      <PreviewNote />
      <p className="tsm">Turn bitcoin savings back into regular BTC in your own Bitcoin wallet.</p>

      <div className="field">
        <label className="lbl" htmlFor="wd-amt">
          Amount to withdraw
        </label>
        <div className={`inp big${tooMuch ? " err" : ""}`}>
          <input
            id="wd-amt"
            inputMode="decimal"
            value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/[^0-9.,]/g, ""))}
            aria-describedby="wd-eq"
            aria-invalid={tooMuch}
          />
          <span className="num text-ink-2" style={{ fontSize: 22, fontWeight: 700 }}>
            BTC
          </span>
        </div>
        <span id="wd-eq" className="tsm font-medium" role={tooMuch ? "alert" : undefined}>
          {tooMuch ? (
            <span className="text-danger">That’s more than your bitcoin savings.</span>
          ) : sats ? (
            `${ngn(sats) ? `≈ ${ngn(sats)} · ` : ""}${formatInt(sats)} sats`
          ) : (
            " "
          )}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="txs">
          {available === null
            ? "Loading your savings…"
            : `Available: ${formatInt(available)} sats${ngn(available) ? ` · ≈ ${ngn(available)}` : ""}`}
        </span>
        <button
          type="button"
          className="btn btn-g btn-sm text-accent-text"
          disabled={!available}
          onClick={() => available && setRaw((available / SATS_PER_BTC).toFixed(8).replace(/0+$/, "").replace(/\.$/, ""))}
        >
          Use max
        </button>
      </div>

      <div className="field">
        <span className="lbl inline-flex items-center gap-1">
          Sending to
          <span className="tipwrap">
            <button className="iconbtn text-ink-3" type="button" style={{ margin: "-12px -10px" }} aria-label="Why only this address?">
              <Icon name="info" size={18} />
            </button>
            <span className="tip" role="tooltip">
              For safety, withdrawals only go to the Bitcoin address of the wallet you connected.
            </span>
          </span>
        </span>
        <div className="well flex items-center gap-3 px-4 py-3.5">
          <WalletBadge name={walletName} size={40} />
          <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <span style={{ font: "600 15.5px/1.2 var(--body)" }}>Your {wallet} wallet</span>
            <span className="mono txs">{btcAddress ? `${shortAddress(btcAddress)} · Bitcoin address` : "No Bitcoin address shared"}</span>
          </span>
          <Chip tone="ok" icon="check">
            Yours
          </Chip>
        </div>
      </div>

      <div className="well px-[18px] py-1">
        <div className="kv">
          <span className="k">You withdraw</span>
          <span className="v">{formatInt(sats)} sats</span>
        </div>
        <div className="kv">
          <span className="k">
            <span className="inline-flex items-center gap-1">
              Bitcoin network fee
              <span className="tipwrap">
                <button className="iconbtn text-ink-3" type="button" style={{ margin: "-12px -10px" }} aria-label="About the Bitcoin network fee">
                  <Icon name="info" size={18} />
                </button>
                <span className="tip" role="tooltip">
                  Paid to Bitcoin miners to send your BTC. It comes out of the amount you withdraw. Rack takes no cut.
                </span>
              </span>
            </span>
          </span>
          <span className="v">
            {formatInt(EXAMPLE_BTC_FEE)} sats<span className="est">est.</span>
          </span>
        </div>
        <div className="kv">
          <span className="k">Stacks network fee</span>
          <span className="v">
            Small STX fee
            <span className="txs mt-0.5 block font-medium">shown in your wallet</span>
          </span>
        </div>
        <div className="kv">
          <span className="k font-semibold text-ink">You’ll receive</span>
          <span className="v">
            <span className="flex flex-col items-end gap-[3px]">
              <span className="num" style={{ font: "700 20px/1 var(--display)" }}>
                {formatInt(receive)} sats<span className="est">est.</span>
              </span>
              <span className="txs">as BTC{ngn(receive) ? ` · ≈ ${ngn(receive)}` : ""}</span>
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <Icon name="clock" size={18} className="mt-px text-ink-2" />
          <p className="tsm">Usually arrives in 1–2 hours. Bitcoin confirms the request over several blocks before your BTC is sent.</p>
        </div>
        <div className="flex items-start gap-2.5">
          <Icon name="trend" size={18} className="mt-px text-ink-2" />
          <p className="tsm">Withdrawn bitcoin stops earning yield. The rest keeps earning.</p>
        </div>
      </div>
    </FlowPanel>
  );
}

function TrackingPreview({ sats }: { sats: number }) {
  const { btcAddress, walletName } = useWallet();
  const ngn = useNgn();
  const receive = Math.max(0, sats - EXAMPLE_BTC_FEE);
  return (
    <FlowPanel
      title="Withdrawing"
      step="Step 2 of 2 · Preview"
      back="/withdraw"
      close="/home"
      width={500}
      footer={
        <>
          <Link className="btn btn-p btn-lg btn-block" href={`/withdraw?step=done&sats=${sats}`}>
            Preview: withdrawal complete
          </Link>
          <Link className="btn btn-g btn-block" href="/home">
            Back to home
          </Link>
        </>
      }
    >
      <PreviewNote />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="lbl">Withdrawing</span>
          <Chip tone="info" icon="clock">
            Processing
          </Chip>
        </div>
        <span className="num" style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>
          {formatInt(sats)} sats
        </span>
        <span className="tsm">
          {formatBtc(sats)}
          {ngn(sats) ? ` · ≈ ${ngn(sats)}` : ""}
        </span>
      </div>
      <StepTracker
        steps={[
          { label: "Approved in your wallet", detail: `Signed in ${walletName ?? "your wallet"}`, state: "done" },
          { label: "Withdrawal requested", detail: `${formatInt(sats)} sats of bitcoin savings set aside for you.`, state: "done" },
          { label: "Confirming on Bitcoin", detail: "Waiting for a few Bitcoin blocks. About an hour.", state: "active" },
          {
            label: "BTC sent to your wallet",
            detail: `${formatInt(receive)} sats arrive at ${btcAddress ? shortAddress(btcAddress) : "your Bitcoin address"}.`,
            state: "todo",
          },
        ]}
      />
      <section className="well flex flex-col gap-2.5 border-transparent bg-info-soft px-[18px] py-4">
        <div className="flex items-center gap-2.5 text-info">
          <Icon name="info" />
          <h3 className="h3 text-ink">Why it takes a while</h3>
        </div>
        <p className="tsm text-ink">
          For safety, withdrawals wait for several Bitcoin blocks before the BTC is released. You can close Rack. We’ll update Activity when it lands in
          your wallet.
        </p>
      </section>
      <div className="txs flex items-start justify-center gap-2">
        <Icon name="shield" size={16} className="mt-px text-success" />
        <span>If the withdrawal can’t be completed, your sats go back to your savings.</span>
      </div>
    </FlowPanel>
  );
}

function DonePreview({ sats }: { sats: number }) {
  const { btcAddress, walletName } = useWallet();
  const balances = useBalances();
  const ngn = useNgn();
  const receive = Math.max(0, sats - EXAMPLE_BTC_FEE);
  const left = balances.data ? Math.max(0, Number(balances.data.sbtc) - sats) : null;
  return (
    <FlowPanel
      title="Withdrawal complete"
      step="Preview"
      back="/withdraw?step=tracking"
      close="/home"
      width={500}
      footer={
        <Link className="btn btn-p btn-lg btn-block" href="/home">
          Back to home
        </Link>
      }
    >
      <PreviewNote />
      <div className="flex flex-col items-center gap-3.5 pt-2 text-center">
        <span className="tile t-ok" style={{ width: 72, height: 72, borderRadius: "50%" }}>
          <Icon name="check" size={32} bold />
        </span>
        <h2 className="h1 text-[28px]">Bitcoin sent to your wallet</h2>
        <p className="tb16 max-w-[400px]">
          {formatInt(receive)} sats arrived in your {walletName ?? ""} wallet as regular BTC.
        </p>
      </div>
      <div>
        <div className="kv">
          <span className="k">Received</span>
          <span className="v">
            <span className="num" style={{ font: "700 18px/1 var(--display)" }}>
              {formatInt(receive)} sats
            </span>
            <span className="txs mt-[3px] block font-medium">
              {formatBtc(receive)}
              {ngn(receive) ? ` · ≈ ${ngn(receive)}` : ""}
            </span>
          </span>
        </div>
        <div className="kv">
          <span className="k">To</span>
          <span className="v mono">{btcAddress ? shortAddress(btcAddress) : "your Bitcoin address"}</span>
        </div>
        <div className="kv">
          <span className="k">Bitcoin network fee</span>
          <span className="v">{formatInt(EXAMPLE_BTC_FEE)} sats (example)</span>
        </div>
        <div className="kv">
          <span className="k">Stacks network fee</span>
          <span className="v">Small STX fee</span>
        </div>
        {left !== null && (
          <div className="kv">
            <span className="k">Savings left</span>
            <span className="v">{formatInt(left)} sats</span>
          </div>
        )}
      </div>
    </FlowPanel>
  );
}
