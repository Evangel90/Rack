"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons";
import { Wordmark } from "../Wordmark";
import { TestnetBanner } from "../TestnetBanner";
import { ThemeToggle } from "../ThemeToggle";
import { useWallet } from "../providers/wallet";
import { shortAddress } from "@/lib/format";

const sideNav: { href: string; label: string; icon: IconName }[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/save", label: "Save", icon: "save" },
  { href: "/pay", label: "Pay", icon: "receipt" },
  { href: "/earn", label: "Earn", icon: "trend" },
  { href: "/activity", label: "Activity", icon: "list" },
  { href: "/settings", label: "Settings", icon: "sliders" },
];

const tabs = ["/home", "/pay", "/save", "/activity"].map((h) => sideNav.find((n) => n.href === h)!);
// Mobile screens that get the brand header and tab bar; every other screen is a flow with its own back header.
const tabRoutes = ["/home", "/pay", "/activity"];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isTabPage = tabRoutes.includes(pathname);
  const { stxAddress, walletName } = useWallet();
  const short = stxAddress ? shortAddress(stxAddress) : "";

  return (
    <div className="flex min-h-dvh flex-col">
      <TestnetBanner />
      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <nav
          aria-label="Main"
          className="sticky top-0 hidden h-dvh w-64 flex-none flex-col gap-8 border-r border-line bg-surface-2 px-5 pt-7 pb-6 lg:flex"
        >
          <div className="flex items-center justify-between">
            <Link href="/home" aria-label="Rack home" className="flex px-2.5 py-1 no-underline">
              <Wordmark size="lg" />
            </Link>
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-1">
            {sideNav.map((n) => {
              const on = isActive(pathname, n.href);
              return (
                <Link key={n.href} href={n.href} className={`nav${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
                  <Icon name={n.icon} />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-auto flex flex-col gap-3.5">
            {stxAddress && (
              <Link href="/settings" className="well flex items-center gap-3 px-3.5 py-3 text-ink no-underline">
                <WalletBadge name={walletName} size={34} />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span style={{ font: "600 14px/1 var(--body)" }}>{walletName ?? "Wallet"}</span>
                  <span className="mono txs whitespace-nowrap">{short}</span>
                </span>
                <span className="flex items-center gap-1.5 text-success" style={{ font: "600 12px/1 var(--body)" }}>
                  <span className="dot bg-success" />
                  Connected
                </span>
              </Link>
            )}
            <TrustLine />
          </div>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile brand header (tab pages only) */}
          {isTabPage && (
            <header className="flex h-[60px] flex-none items-center justify-between pr-3 pl-5 lg:hidden">
              <Link href="/home" aria-label="Rack home" className="flex no-underline">
                <Wordmark />
              </Link>
              <span className="flex items-center gap-1">
                <ThemeToggle />
                {stxAddress && (
                  <Link
                    href="/settings"
                    className="pill"
                    style={{ minHeight: 44, padding: "0 14px", gap: 8, fontSize: 13 }}
                    aria-label={`Wallet connected: ${short}. Open settings`}
                  >
                    <span className="dot bg-success" />
                    <span className="mono">{short}</span>
                  </Link>
                )}
              </span>
            </header>
          )}

          <main className={`flex-1 px-5 lg:px-14 lg:py-10 ${isTabPage ? "pt-1 pb-6" : "pt-0 pb-0"}`}>
            <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 lg:gap-7">{children}</div>
          </main>

          {/* Mobile tab bar */}
          {isTabPage && (
            <nav
              aria-label="Main"
              className="sticky bottom-0 z-10 flex flex-none gap-1 border-t border-line bg-surface px-2 pt-2 pb-[calc(12px+env(safe-area-inset-bottom))] lg:hidden"
            >
              {tabs.map((t) => {
                const on = isActive(pathname, t.href);
                return (
                  <Link key={t.href} href={t.href} className={`tab${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
                    <span className="tbi">
                      <Icon name={t.icon} />
                    </span>
                    <span>{t.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

export function TrustLine({ className = "" }: { className?: string }) {
  return (
    <div className={`txs flex items-start gap-2 px-1 ${className}`}>
      <Icon name="shield" size={16} className="mt-px text-success" />
      <span>Rack never holds your funds. You approve every payment in your wallet.</span>
    </div>
  );
}

export function WalletBadge({ name, size = 44 }: { name?: string | null; size?: number }) {
  const isX = name?.toLowerCase().startsWith("x");
  return (
    <span
      className="badge"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.45),
        background: isX ? "#E8E1D6" : "#1C1813",
        color: isX ? "#1C1813" : "#F6F2EC",
        boxShadow: "inset 0 0 0 1px var(--line-strong)",
      }}
    >
      {name ? name[0].toUpperCase() : "W"}
    </span>
  );
}
