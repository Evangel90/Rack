"use client";

import { useState } from "react";
import { EarningsChart } from "@/components/earn/EarningsChart";
import { Icon } from "@/components/icons";
import { Chip } from "@/components/StatusChip";
import { MobileBackHeader } from "@/components/shell/MobileBackHeader";
import { usePrice } from "@/lib/hooks";

// Earn is a static explainer in the testnet MVP (PRD). Every number here is an example.
const EXAMPLE_EARNINGS = [
  { month: "Apr", sats: 380 },
  { month: "May", sats: 1020 },
  { month: "Jun", sats: 1850 },
  { month: "Jul", sats: 2760 },
  { month: "Aug", sats: 3720 },
  { month: "Sep", sats: 5904 },
];

export default function EarnPage() {
  const price = usePrice();
  const [boost, setBoost] = useState(false);

  return (
    <>
      <MobileBackHeader title="Earn" />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="h1">Earn</h1>
          <Chip tone="acc" icon="clock">
            Coming soon
          </Chip>
        </div>
        <p className="tb16">Your bitcoin savings will earn a variable yield, paid in bitcoin. Here’s how it will work.</p>
      </div>

      <p className="txs flex items-start gap-2 rounded-xl bg-info-soft px-3.5 py-3 text-ink">
        <Icon name="info" size={16} className="mt-px text-info" />
        Preview: the rates and earnings below are examples, not your account. Yield isn’t live in this testnet build.
      </p>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
        <section className="card flex flex-col gap-5 p-6 lg:p-7">
          <div className="flex items-center justify-between">
            <span className="lbl">Estimated yield</span>
            <Chip tone="neu" icon="trend">
              Variable
            </Chip>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="num text-[52px] leading-none font-bold lg:text-[64px]">3.8%</span>
            <span className="tb16">
              a year<span className="est">est.</span>
            </span>
          </div>
          <p className="tsm">Example rate. Real rates change with the network and are never guaranteed.</p>
          <div className="grid2 border-t border-line pt-[18px]">
            {(
              [
                ["This month", "+2,184 sats", "≈ ₦3,385"],
                ["Since April", "+5,904 sats", "≈ ₦9,151"],
              ] as const
            ).map(([k, v, n]) => (
              <div key={k} className="flex flex-col gap-1.5">
                <span className="txs">{k} (example)</span>
                <span className="num" style={{ font: "700 22px/1 var(--display)" }}>
                  {v}
                </span>
                <span className="txs">
                  {n}
                  <span className="est">est.</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card flex flex-col gap-4 p-6" aria-label="Boost my yield">
          <div className="flex items-center gap-3">
            <span className="tile t-acc">
              <Icon name="boost" />
            </span>
            <h2 className="h2 flex-1 text-[22px]">Boost my yield</h2>
            <button
              type="button"
              onClick={() => setBoost((b) => !b)}
              aria-pressed={boost}
              aria-label="Boost my yield (preview)"
              className="flex min-h-11 cursor-pointer items-center gap-2.5 border-0 bg-transparent pl-1.5 text-ink"
              style={{ font: "600 15px/1 var(--body)" }}
            >
              <span>{boost ? "On" : "Off"}</span>
              <span className={`sw${boost ? " on" : ""}`} />
            </button>
          </div>
          <p className="tsm">
            Convert a small part of your savings to{" "}
            <span className="inline-flex items-center gap-0.5 font-semibold text-ink">
              STX
              <span className="tipwrap">
                <button className="iconbtn text-ink-3" type="button" style={{ margin: "-12px -10px" }} aria-label="What is STX?">
                  <Icon name="info" size={18} />
                </button>
                <span className="tip" role="tooltip">
                  STX is the token of the Stacks network. Staking locks it for a cycle of about two weeks to help secure the network.
                </span>
              </span>
            </span>{" "}
            and stake it. Staked STX raises the bitcoin yield on the rest of your savings.
          </p>
          <div className="grid2">
            <div className="well flex flex-col gap-1.5 p-3.5">
              <span className="txs">Without Boost</span>
              <span className="num" style={{ font: "700 24px/1 var(--display)" }}>
                3.8%<span className="est">est.</span>
              </span>
            </div>
            <div className="well flex flex-col gap-1.5 border-accent p-3.5">
              <span className="txs">With Boost</span>
              <span className="num" style={{ font: "700 24px/1 var(--display)" }}>
                up to 5.1%<span className="est">est.</span>
              </span>
            </div>
          </div>
          {boost && (
            <div className="flex items-center gap-2.5 rounded-xl bg-success-soft px-3.5 py-3">
              <Icon name="check" className="text-success" bold />
              <span className="tsm text-ink">
                <strong>Preview only.</strong> In a later release, turning Boost on is confirmed in your wallet.
              </span>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-[14px] bg-warn-soft px-4 py-3.5">
            <Icon name="warning" className="mt-px text-warn" />
            <div className="flex flex-col gap-1">
              <span className="text-ink" style={{ font: "700 14.5px/1.3 var(--body)" }}>
                The tradeoff
              </span>
              <p className="tsm text-ink">
                STX is not bitcoin. Its price can fall as well as rise, so the part you convert could be worth less when you switch Boost off. Staked STX
                stays locked until the current cycle ends (about 2 weeks).
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="card flex flex-col gap-5 px-5 py-6 lg:px-7">
        <div className="flex flex-col gap-1">
          <h2 className="h2 text-xl">Earnings over time</h2>
          <span className="txs">Example: total earned, in sats</span>
        </div>
        <EarningsChart data={EXAMPLE_EARNINGS} btcNgn={price.data?.btcNgn} />
      </section>

      <section className="card flex flex-col gap-[18px] px-5 py-6 lg:px-7">
        <h2 className="h2 text-xl">How it works</h2>
        <div className="grid gap-5 lg:grid-cols-3 lg:gap-7">
          {[
            "Your bitcoin savings sit in your own wallet as sBTC, which is bitcoin on the Stacks network.",
            "Through Dual Stacking, the network pays rewards to sBTC holders, and Rack adds them to your savings in bitcoin.",
            "The rate moves with network activity, so every number here is an estimate, never a promise.",
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <span
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-soft text-accent-text"
                style={{ font: "700 15px/1 var(--display)" }}
              >
                {i + 1}
              </span>
              <p className="tsm text-[15px] text-ink">{t}</p>
            </div>
          ))}
        </div>
      </section>
      <p className="txs">Yield is variable, paid in bitcoin and not guaranteed. Past earnings don’t predict future earnings.</p>
    </>
  );
}
