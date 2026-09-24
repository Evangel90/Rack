"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CurrencySeg } from "@/components/CurrencySeg";
import { Icon, type IconName } from "@/components/icons";
import { usePrefs, type ThemePref } from "@/components/providers/prefs";
import { useWallet } from "@/components/providers/wallet";
import { WalletBadge } from "@/components/shell/AppShell";
import { MobileBackHeader } from "@/components/shell/MobileBackHeader";
import { Chip } from "@/components/StatusChip";
import { shortAddress } from "@/lib/format";
import { ISSUES_URL, REPO_URL } from "@/lib/links";

const themes: { id: ThemePref; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

// Static preview (recipients are out of scope for the testnet MVP).
const exampleRecipients = [
  { name: "Mum", sub: "MTN airtime · 0803 •••• 214", letter: "M", bg: "#F2C200", fg: "#1C1813" },
  { name: "Home meter", sub: "Ikeja Electric · 4512 •••• 8890", letter: "IE", bg: "#3F5E8C", fg: "#FFFFFF" },
];

const help: { icon: IconName; label: string; href: string }[] = [
  { icon: "book", label: "Help centre", href: "https://docs.stacks.co/concepts/sbtc" },
  { icon: "wallet", label: "What’s a wallet?", href: "https://leather.io/learn" },
  { icon: "trend", label: "How yield works", href: "/earn" },
  { icon: "warning", label: "Report a problem", href: ISSUES_URL },
  { icon: "code", label: "Source code on GitHub", href: REPO_URL },
];

export default function SettingsPage() {
  const { stxAddress, btcAddress, walletName, connectedAt, disconnect } = useWallet();
  const { theme, setTheme } = usePrefs();
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }

  return (
    <>
      <MobileBackHeader />
      <h1 className="h1">Settings</h1>
      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="flex flex-col gap-5 lg:gap-6">
          <section className="card flex flex-col gap-4 p-5 lg:p-6">
            <h2 className="h2 text-[19px]">Display</h2>
            <div className="flex flex-col gap-2.5">
              <span className="lbl">Main currency</span>
              <span>
                <CurrencySeg />
              </span>
              <span className="txs">Amounts always show the bitcoin value too.</span>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="lbl">Appearance</span>
              <div className="seg self-start" role="group" aria-label="Appearance">
                {themes.map((t) => (
                  <button key={t.id} type="button" className={theme === t.id ? "on" : ""} aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="card flex flex-col gap-4 p-5 lg:p-6">
            <h2 className="h2 text-[19px]">Connected wallet</h2>
            <div className="flex items-center gap-3.5">
              <WalletBadge name={walletName} size={48} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span style={{ font: "600 17px/1 var(--body)" }}>{walletName ?? "Wallet"}</span>
                {stxAddress && (
                  <span className="flex items-center gap-1">
                    <span className="mono tsm">{shortAddress(stxAddress)}</span>
                    <button
                      type="button"
                      className="iconbtn text-ink-3"
                      style={{ margin: "-12px 0" }}
                      aria-label="Copy Stacks address"
                      onClick={() => copy("stx", stxAddress)}
                    >
                      <Icon name={copied === "stx" ? "check" : "copy"} size={18} />
                    </button>
                    <span className="sr-only" role="status">
                      {copied === "stx" ? "Stacks address copied" : ""}
                    </span>
                  </span>
                )}
              </div>
              <Chip tone="ok" icon="check">
                Connected
              </Chip>
            </div>
            <div className="well px-4 py-1">
              <div className="kv">
                <span className="k">Stacks address</span>
                <span className="v mono break-all" style={{ fontSize: 13 }}>
                  {stxAddress}
                </span>
              </div>
              <div className="kv">
                <span className="k">Bitcoin address</span>
                <span className="v mono">{btcAddress ? shortAddress(btcAddress) : "Not shared"}</span>
              </div>
              {connectedAt && (
                <div className="kv">
                  <span className="k">Connected since</span>
                  <span className="v">{new Date(connectedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              )}
              <div className="kv">
                <span className="k">Network</span>
                <span className="v">Stacks testnet</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-d self-start"
              onClick={() => {
                disconnect();
                router.replace("/");
              }}
            >
              <Icon name="logout" />
              Disconnect wallet
            </button>
            <p className="txs">Disconnecting doesn’t move your funds. They stay in your wallet.</p>
          </section>
        </div>

        <div className="flex flex-col gap-5 lg:gap-6">
          <section className="card flex flex-col gap-4 p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="h2 text-[19px]">Saved recipients</h2>
              <Chip tone="neu" icon="clock">
                Coming soon
              </Chip>
            </div>
            <div aria-label="Example recipients">
              {exampleRecipients.map((r) => (
                <div key={r.name} className="row min-h-16 opacity-80">
                  <span className="badge" aria-hidden="true" style={{ width: 36, height: 36, background: r.bg, color: r.fg, fontSize: 16 }}>
                    {r.letter}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span style={{ font: "600 15px/1.2 var(--body)" }}>{r.name} (example)</span>
                    <span className="txs truncate">{r.sub}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="txs">For now, use “Pay again” on the Pay screen to repeat a past top-up.</p>
          </section>

          <section id="help" className="card flex scroll-mt-6 flex-col gap-4 p-5 lg:p-6">
            <h2 className="h2 text-[19px]">Help and support</h2>
            <div>
              {help.map((h) => (
                <a
                  key={h.label}
                  className="row min-h-14"
                  href={h.href}
                  {...(h.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  <span className="tile h-10 w-10 rounded-xl">
                    <Icon name={h.icon} />
                  </span>
                  <span className="flex-1" style={{ font: "600 15px/1.2 var(--body)" }}>
                    {h.label}
                  </span>
                  <Icon name="chevronRight" className="text-ink-3" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
      <p className="txs">
        Rack · Testnet preview · No real funds ·{" "}
        <a className="link" href={REPO_URL} target="_blank" rel="noreferrer">
          Open source on GitHub
        </a>
      </p>
    </>
  );
}
