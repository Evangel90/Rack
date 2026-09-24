"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConnectDialog } from "@/components/ConnectDialog";
import { Icon, type IconName } from "@/components/icons";
import { TestnetBanner } from "@/components/TestnetBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wordmark } from "@/components/Wordmark";
import { useWallet } from "@/components/providers/wallet";
import { ISSUES_URL, REPO_URL } from "@/lib/links";

const benefits: { icon: IconName; tile: string; title: string; body: string }[] = [
  {
    icon: "save",
    tile: "t-acc",
    title: "Save bitcoin in your own wallet",
    body: "Your savings stay in the Leather or Xverse wallet you already use. Rack can’t move them without you.",
  },
  {
    icon: "trend",
    tile: "t-ok",
    title: "Earn bitcoin yield on your savings",
    body: "A variable yield, paid in bitcoin. You’ll always see an estimate, never a promise.",
  },
  {
    icon: "bolt",
    tile: "t-info",
    title: "Pay bills in seconds",
    body: "Airtime, data, electricity and TV. See the naira price, approve in your wallet, done.",
  },
];

const WALLET_GUIDE = "https://leather.io/learn";

export default function LandingPage() {
  const { ready, stxAddress } = useWallet();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (ready && stxAddress) router.replace("/home");
  }, [ready, stxAddress, router]);

  return (
    <div className="flex min-h-dvh flex-col">
      <TestnetBanner />
      <header className="flex h-[60px] flex-none items-center justify-between pr-3 pl-5 lg:h-auto lg:px-24 lg:py-7">
        <span className="lg:hidden">
          <Wordmark />
        </span>
        <span className="hidden lg:inline">
          <Wordmark size="lg" />
        </span>
        <span className="flex items-center gap-4">
          <a className="link hidden min-h-11 items-center lg:inline-flex" style={{ fontSize: 15 }} href={WALLET_GUIDE} target="_blank" rel="noreferrer">
            What’s a wallet?
          </a>
          <a
            className="hidden min-h-11 items-center gap-2 text-ink-2 no-underline hover:text-ink lg:inline-flex"
            style={{ font: "600 15px/1 var(--body)" }}
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="code" size={18} />
            GitHub
          </a>
          <ThemeToggle />
        </span>
      </header>

      <main className="flex flex-1 flex-col gap-[22px] px-5 pt-3 pb-5 lg:gap-16 lg:px-24 lg:pt-6 lg:pb-12">
        <div className="grid items-center gap-[22px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-[72px]">
          <div className="flex flex-col gap-[22px] lg:gap-7">
            <span className="chip c-acc hidden self-start lg:inline-flex" style={{ height: 32, padding: "0 14px 0 10px", fontSize: 13.5 }}>
              <Icon name="lock" size={15} bold />
              A bitcoin savings account where you keep the keys
            </span>
            <h1
              className="m-0 text-[50px] leading-[0.98] lg:text-[88px] lg:leading-[0.96]"
              style={{ fontFamily: "var(--display)", fontWeight: 800, letterSpacing: "-0.045em" }}
            >
              Save bitcoin.
              <br />
              <span className="text-accent-text">Earn yield.</span>
              <br />
              Pay bills.
            </h1>
            <p className="tb16 lg:max-w-[520px] lg:text-[19px]">
              <span className="lg:hidden">Connect your own bitcoin wallet. Grow your savings in bitcoin and pay bills straight from them.</span>
              <span className="hidden lg:inline">
                Rack connects to your own bitcoin wallet. Your savings grow in bitcoin, and you can pay for airtime, data, electricity and TV straight
                from them.
              </span>
            </p>
            <div className="hidden items-center gap-6 lg:flex">
              <button type="button" className="btn btn-p btn-lg" style={{ padding: "0 32px" }} onClick={() => setOpen(true)}>
                <Icon name="wallet" />
                Connect wallet
              </button>
              <a className="link inline-flex min-h-11 items-center" style={{ fontSize: 15.5 }} href={WALLET_GUIDE} target="_blank" rel="noreferrer">
                What’s a wallet?
              </a>
            </div>
            <div className="hidden gap-6 lg:flex">
              <span className="txs flex items-start gap-2">
                <Icon name="shield" size={16} className="mt-px text-success" />
                Rack never holds your funds
              </span>
              <span className="txs flex items-start gap-2">
                <Icon name="lock" size={16} className="mt-px text-success" />
                You approve every payment in your wallet
              </span>
            </div>
          </div>
          <HeroPreview />
        </div>

        <div className="flex flex-col gap-[18px] lg:grid lg:grid-cols-3 lg:gap-12 lg:border-t lg:border-line lg:pt-10">
          {benefits.map((b) => (
            <div key={b.title} className="flex items-start gap-3.5 lg:flex-col lg:gap-3.5">
              <span className={`tile ${b.tile} lg:h-12 lg:w-12`}>
                <Icon name={b.icon} />
              </span>
              <div className="flex flex-col gap-1 lg:gap-3.5">
                <h3 className="m-0 font-body text-base leading-[1.3] font-semibold lg:font-display lg:text-xl lg:font-bold lg:tracking-[-0.02em]">
                  {b.title}
                </h3>
                <p className="tsm lg:text-[15.5px]">{b.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="txs flex items-start justify-center gap-2 lg:hidden">
          <Icon name="shield" size={16} className="mt-px text-success" />
          <span>Rack never holds your funds. You approve every payment in your wallet.</span>
        </div>

        <footer className="txs flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-line pt-4 lg:justify-between lg:pt-6">
          <span>Rack · Testnet preview on Stacks · No real funds</span>
          <span className="flex items-center gap-4">
            <a className="link inline-flex min-h-11 items-center gap-1.5" href={REPO_URL} target="_blank" rel="noreferrer">
              <Icon name="code" size={16} />
              Source on GitHub
            </a>
            <a className="link inline-flex min-h-11 items-center" href={ISSUES_URL} target="_blank" rel="noreferrer">
              Report a problem
            </a>
          </span>
        </footer>
      </main>

      {/* Mobile sticky connect bar */}
      <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-line bg-surface px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] lg:hidden">
        <button type="button" className="btn btn-p btn-lg btn-block" onClick={() => setOpen(true)}>
          <Icon name="wallet" />
          Connect wallet
        </button>
        <a className="link inline-flex min-h-11 items-center self-center" style={{ fontSize: 15 }} href={WALLET_GUIDE} target="_blank" rel="noreferrer">
          What’s a wallet?
        </a>
      </div>

      <ConnectDialog open={open} onClose={close} />
    </div>
  );
}

/** Decorative product preview from the desktop landing design (demo values). */
function HeroPreview() {
  return (
    <div className="relative hidden h-[520px] lg:block" aria-hidden="true">
      <div className="card absolute top-6 right-0 left-10 flex flex-col gap-[22px] p-7" style={{ borderRadius: 24 }}>
        <div className="flex items-center justify-between">
          <span className="lbl">Total bitcoin savings</span>
          <span className="seg" style={{ padding: 3 }}>
            <span className="inline-flex items-center rounded-[9px] bg-surface px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,.12)]" style={{ font: "600 13px/1 var(--body)" }}>
              NGN
            </span>
            <span className="inline-flex items-center px-3 py-2 text-ink-2" style={{ font: "600 13px/1 var(--body)" }}>
              sats
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="num" style={{ fontSize: 54, fontWeight: 700, lineHeight: 1 }}>
            ₦1,305,333
          </span>
          <span className="tb16" style={{ fontWeight: 500 }}>
            0.00842150 BTC
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="chip c-ok">
            <Icon name="plus" size={14} bold />
            +2,184 sats
          </span>
          <span className="tsm">
            earned this month<span className="est">est.</span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["save", "t-acc", "Save"],
              ["receipt", "", "Pay a bill"],
              ["trend", "t-ok", "Earn"],
            ] as const
          ).map(([icon, tile, label]) => (
            <span key={label} className="well flex flex-col gap-2.5 p-3.5">
              <span className={`tile ${tile}`} style={{ width: 36, height: 36, borderRadius: 11 }}>
                <Icon name={icon} size={18} />
              </span>
              <span style={{ font: "600 14px/1 var(--body)" }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="card absolute bottom-6 left-10 flex w-[340px] items-center gap-3.5 px-5 py-[18px] shadow-[var(--shadow-lg)]" style={{ borderRadius: 20 }}>
        <span className="tile t-ok">
          <Icon name="phone" />
        </span>
        <span className="flex flex-1 flex-col gap-1.5">
          <span style={{ font: "600 15px/1.2 var(--body)" }}>Airtime sent to Mum</span>
          <span className="txs">₦2,000 · 1,290 sats</span>
        </span>
        <span className="chip c-ok">
          <Icon name="check" size={14} bold />
          Paid
        </span>
      </div>
    </div>
  );
}
