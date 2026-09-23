"use client";

import Link from "next/link";
import { ActivityRow, ActivitySkeletonRow } from "@/components/ActivityRow";
import { CurrencySeg } from "@/components/CurrencySeg";
import { Icon, type IconName } from "@/components/icons";
import { useMoney } from "@/components/Money";
import { Chip } from "@/components/StatusChip";
import { ErrorLine } from "@/components/ErrorLine";
import { useActivity, useBalances, usePrice } from "@/lib/hooks";
import { formatInt, formatStx } from "@/lib/format";
import { USDCX } from "@/lib/stacks/config";

const actions: { href: string; icon: IconName; tile: string; title: string; sub: string }[] = [
  { href: "/save", icon: "save", tile: "t-acc", title: "Save", sub: "Add bitcoin from your wallet" },
  { href: "/pay", icon: "receipt", tile: "t-info", title: "Pay a bill", sub: "Airtime now · more coming" },
  { href: "/earn", icon: "trend", tile: "t-ok", title: "Earn", sub: "Variable yield · coming soon" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function HomePage() {
  const balances = useBalances();
  const price = usePrice();
  const activity = useActivity();
  const sats = balances.data ? Number(balances.data.sbtc) : 0;
  const recent = activity.data?.slice(0, 5) ?? [];
  const inProgress = activity.data?.find((a) => a.kind === "deposit" && !["done", "failed"].includes(a.deposit.status));
  const isNewUser = balances.isSuccess && sats === 0 && activity.isSuccess && activity.data.length === 0;

  return (
    <>
      <div className="hidden items-end justify-between gap-4 lg:flex">
        <div className="flex flex-col gap-1.5">
          <span className="txs" suppressHydrationWarning>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <h1 className="h1" suppressHydrationWarning>
            {greeting()}
          </h1>
        </div>
        <Link className="btn btn-s btn-sm" href="/withdraw">
          <Icon name="arrowOut" size={18} />
          Withdraw
        </Link>
      </div>
      <h1 className="sr-only lg:hidden">Home</h1>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
          <SavingsHero />

          {isNewUser ? (
            <StartSaving />
          ) : (
            <div className="grid grid-cols-3 gap-2.5 lg:gap-4">
              {actions.map((a) => (
                <Link key={a.href} className="qa items-start gap-3 rounded-[18px] px-3 py-4 lg:gap-3.5 lg:rounded-[20px] lg:p-5" href={a.href}>
                  <span className={`tile ${a.tile} lg:h-[52px] lg:w-[52px] lg:rounded-2xl`}>
                    <Icon name={a.icon} size={22} />
                  </span>
                  <span className="flex flex-col gap-1.5">
                    <span className="text-base leading-[1.1] font-bold tracking-[-0.01em] lg:text-xl lg:tracking-[-0.02em]" style={{ fontFamily: "var(--display)" }}>
                      {a.title}
                    </span>
                    <span className="tsm hidden lg:block">{a.sub}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          {inProgress?.kind === "deposit" && (
            <div className="lg:hidden">
              <DepositProgressCard sats={inProgress.deposit.amountSats} status={inProgress.deposit.status} id={inProgress.deposit.id} />
            </div>
          )}

          <section aria-label="Recent activity" className="flex flex-col lg-card lg:px-7 lg:pt-[22px] lg:pb-2.5">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-lg font-bold lg:text-xl" style={{ fontFamily: "var(--display)", letterSpacing: "-0.02em" }}>
                {isNewUser ? "Activity" : "Recent activity"}
              </h2>
              {!isNewUser && (
                <Link className="link inline-flex min-h-11 items-center" style={{ fontSize: 14.5 }} href="/activity">
                  See all
                </Link>
              )}
            </div>
            {activity.isPending ? (
              <>
                <ActivitySkeletonRow />
                <ActivitySkeletonRow />
                <ActivitySkeletonRow />
              </>
            ) : activity.isError ? (
              <ErrorLine message="Couldn’t load your activity." onRetry={() => activity.refetch()} />
            ) : recent.length === 0 ? (
              <div className="well my-3 flex items-start gap-3.5 p-5" style={{ borderStyle: "dashed" }}>
                <span className="tile">
                  <Icon name="list" />
                </span>
                <div className="flex flex-col gap-1">
                  <span style={{ font: "600 15px/1.2 var(--body)" }}>No activity yet</span>
                  <span className="tsm">Your deposits and bill payments will show up here.</span>
                </div>
              </div>
            ) : (
              recent.map((item) => <ActivityRow key={item.id} item={item} btcNgn={price.data?.btcNgn} />)
            )}
          </section>
        </div>

        <div className="flex flex-col gap-5">
          {inProgress?.kind === "deposit" && (
            <div className="hidden lg:block">
              <DepositProgressCard sats={inProgress.deposit.amountSats} status={inProgress.deposit.status} id={inProgress.deposit.id} />
            </div>
          )}
          <OtherBalances />
          <EarnTeaser />
          <section className="well hidden flex-col gap-3.5 px-5 py-[18px] lg:flex">
            {(
              [
                ["shield", "Rack never holds your funds"],
                ["lock", "You approve every payment in your wallet"],
                ["bolt", "Network fees are paid in STX from your wallet"],
              ] as const
            ).map(([icon, text]) => (
              <div key={text} className="flex items-start gap-2.5">
                <Icon name={icon} size={18} className="mt-px text-success" />
                <span className="tsm font-medium text-ink">{text}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}

function SavingsHero() {
  const balances = useBalances();
  const price = usePrice();
  const money = useMoney();
  const loading = balances.isPending || (price.isPending && !price.isError);
  const m = balances.data ? money(Number(balances.data.sbtc), price.data) : null;

  return (
    <section
      aria-label="Total bitcoin savings"
      aria-busy={loading}
      className="flex flex-col gap-3.5 pt-2 pb-1 lg-card lg:gap-[26px] lg:rounded-3xl lg:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5">
          <span className="lbl whitespace-nowrap lg:text-[15px]">Total bitcoin savings</span>
          <span className="tipwrap">
            <button className="iconbtn text-ink-3" type="button" style={{ margin: "-12px -10px" }} aria-label="About bitcoin savings">
              <Icon name="info" size={18} />
            </button>
            <span className="tip" role="tooltip">
              Your savings are held as sBTC: bitcoin on the Stacks network, backed 1:1 by BTC and kept in your own wallet.
            </span>
          </span>
        </span>
        <span className="lg:hidden">
          <CurrencySeg compact />
        </span>
        <span className="hidden lg:block">
          <CurrencySeg />
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <span className="skel h-[46px] w-[230px] rounded-[10px] lg:h-[68px] lg:w-[340px]" />
          <span className="skel" style={{ width: 180, height: 16 }} />
        </div>
      ) : balances.isError ? (
        <ErrorLine message="Couldn’t load your balance from the Stacks network." onRetry={() => balances.refetch()} />
      ) : (
        m && (
          <div className="flex flex-col gap-2 lg:gap-2.5">
            <span className="num num-xl" style={{ fontWeight: 700, lineHeight: 1 }}>
              {m.primary}
            </span>
            <span className="flex items-center justify-between gap-2.5">
              <span className="tb16 text-[15px] font-medium lg:text-[17px]">{m.secondary}</span>
              <Link className="pill lg:hidden" href="/withdraw" style={{ padding: "0 14px", fontSize: 14, gap: 6 }}>
                <Icon name="arrowOut" size={16} />
                Withdraw
              </Link>
            </span>
            {price.isError && <span className="txs">Naira price unavailable right now. Showing bitcoin only.</span>}
            {price.data?.stale && <span className="txs">Price from {new Date(price.data.updatedAt).toLocaleTimeString("en-GB")} (last known)</span>}
          </div>
        )
      )}

      <div className="flex items-center gap-2.5 lg:border-t lg:border-line lg:pt-5">
        <Chip tone="neu" icon="trend">
          Earn
        </Chip>
        <span className="tsm text-sm lg:text-[14.5px]">
          Variable bitcoin yield, coming soon<span className="est">est.</span>
        </span>
        <Link className="link ml-auto hidden min-h-11 items-center lg:inline-flex" style={{ fontSize: 14.5 }} href="/earn">
          How it works
        </Link>
      </div>
    </section>
  );
}

function OtherBalances() {
  const balances = useBalances();
  const b = balances.data;
  return (
    <section className="card flex flex-col gap-1 px-[22px] py-4" aria-label="Other balances">
      <span className="eyebrow pb-2">In your wallet</span>
      <div className="kv">
        <span className="k">
          STX <span className="txs">(network fees)</span>
        </span>
        <span className="v">{b ? formatStx(b.stx) : <span className="skel inline-block" style={{ width: 80, height: 14 }} />}</span>
      </div>
      {USDCX && (
        <div className="kv">
          <span className="k">USDCx</span>
          <span className="v">
            {b ? `${formatInt(Number(b.usdcx ?? 0n) / 1_000_000)} USDCx` : <span className="skel inline-block" style={{ width: 80, height: 14 }} />}
          </span>
        </div>
      )}
      {b && b.stx === 0n && (
        <p className="txs pt-2">
          You need a little testnet STX for network fees.{" "}
          <a className="link" href="https://platform.hiro.so/faucet" target="_blank" rel="noreferrer">
            Get some from the faucet
          </a>
        </p>
      )}
    </section>
  );
}

function EarnTeaser() {
  return (
    <section className="card hidden flex-col gap-3.5 p-[22px] lg:flex">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Earn</span>
        <Chip tone="neu" icon="clock">
          Coming soon
        </Chip>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="num" style={{ fontSize: 44, fontWeight: 700, lineHeight: 1 }}>
          3.8%
        </span>
        <span className="tsm">
          a year<span className="est">est.</span>
        </span>
      </div>
      <p className="tsm">Example rate, variable and not guaranteed. Paid in bitcoin, straight into your savings.</p>
      <Link href="/earn" className="well flex min-h-14 items-center gap-3 px-3.5 py-3 text-ink no-underline">
        <Icon name="boost" className="text-ink-2" />
        <span className="flex-1" style={{ font: "600 14.5px/1.3 var(--body)" }}>
          How yield works
        </span>
        <Icon name="chevronRight" size={18} className="text-ink-3" />
      </Link>
    </section>
  );
}

const STEPS = ["sent", "confirming", "minting", "done"] as const;

function DepositProgressCard({ sats, status, id }: { sats: number; status: string; id: string }) {
  const idx = Math.max(0, STEPS.indexOf(status as (typeof STEPS)[number]));
  const labels = ["Sent", "Confirming on Bitcoin", "Minting sBTC", "Done"];
  return (
    <Link href={`/save?deposit=${id}`} className="card flex flex-col gap-3 px-[18px] py-4 text-ink no-underline">
      <span className="flex items-center gap-3">
        <span className="tile t-acc" style={{ width: 40, height: 40 }}>
          <Icon name="arrowIn" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <span style={{ font: "600 15px/1.2 var(--body)" }}>Saving {formatInt(sats)} sats</span>
          <span className="txs">
            {labels[idx]} · step {idx + 1} of 4
          </span>
        </span>
        <Chip tone="info" icon="clock">
          In progress
        </Chip>
      </span>
      <span className="flex gap-1" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className="h-[5px] flex-1 rounded-[3px]"
            style={{ background: i < idx ? "var(--success)" : i === idx ? "var(--accent)" : "var(--line-strong)" }}
          />
        ))}
      </span>
    </Link>
  );
}

function StartSaving() {
  return (
    <section className="card flex flex-col gap-4 p-[22px]" style={{ borderRadius: 22 }}>
      <span className="tile t-acc" style={{ width: 48, height: 48 }}>
        <Icon name="save" size={22} />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="h2">Start saving</h2>
        <p className="tsm">Move bitcoin from your wallet into Rack savings. It stays yours and is ready whenever you need to pay a bill.</p>
      </div>
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {["Choose how much bitcoin to save", "Approve it in your wallet", "It lands in about 10–30 minutes"].map((t, i) => (
          <li key={t} className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-sunken"
              style={{ font: "700 14px/1 var(--display)" }}
            >
              {i + 1}
            </span>
            <span className="tsm text-ink">{t}</span>
          </li>
        ))}
      </ol>
      <Link className="btn btn-p btn-lg btn-block lg:w-auto lg:self-start" href="/save">
        <Icon name="save" />
        Start saving
      </Link>
    </section>
  );
}
