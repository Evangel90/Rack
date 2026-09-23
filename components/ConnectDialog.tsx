"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { WalletBadge } from "./shell/AppShell";
import { useWallet } from "./providers/wallet";
import { isWalletInstalled, type WalletId } from "@/lib/stacks/wallet";

const wallets: { id: WalletId; name: string }[] = [
  { id: "leather", name: "Leather" },
  { id: "xverse", name: "Xverse" },
];

export function ConnectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connect, cancelConnect, connecting, error } = useWallet();
  const router = useRouter();
  const [installed, setInstalled] = useState<Record<WalletId, boolean>>({ leather: false, xverse: false });
  const [pending, setPending] = useState<WalletId | null>(null);
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- extension detection needs window
    setInstalled({ leather: isWalletInstalled("leather"), xverse: isWalletInstalled("xverse") });
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  async function pick(id: WalletId) {
    setPending(id);
    const ok = await connect(id);
    setPending(null);
    if (ok) router.push("/home");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-12">
      <div className="scrim" onClick={onClose} />
      <section
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-title"
        className="relative flex max-h-full w-full flex-col gap-[18px] rounded-t-[28px] bg-surface px-5 pt-2.5 pb-8 shadow-[var(--shadow-lg)] outline-none lg:w-[480px] lg:gap-[22px] lg:rounded-3xl lg:px-8 lg:pt-5 lg:pb-7"
      >
        <span className="self-center rounded-[3px] bg-line-strong lg:hidden" style={{ width: 44, height: 5 }} />
        <div className="flex items-center justify-between lg:-mr-3">
          <h2 id="connect-title" className="h2">
            Connect your wallet
          </h2>
          <button type="button" className="iconbtn" aria-label="Close" onClick={onClose}>
            <Icon name="close" size={22} />
          </button>
        </div>
        <p className="tb16">
          Pick the wallet app you use. Rack will ask it to share your address. Nothing moves until you approve it there.
        </p>
        <div className="flex flex-col gap-2.5">
          {wallets.map((w) => (
            <button
              key={w.id}
              type="button"
              className="well flex min-h-[76px] cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left text-ink hover:border-accent disabled:cursor-wait"
              style={{ background: "var(--surface)", borderWidth: 1.5 }}
              onClick={() => pick(w.id)}
              disabled={connecting}
              aria-describedby={`${w.id}-hint`}
            >
              <WalletBadge name={w.name} />
              <span className="flex flex-1 flex-col gap-1.5">
                <span style={{ font: "600 17px/1 var(--body)" }}>{w.name}</span>
                <span id={`${w.id}-hint`} className="txs">
                  {pending === w.id
                    ? `Waiting for ${w.name}… approve in the wallet`
                    : installed[w.id]
                      ? "Detected in this browser"
                      : "Tap to open or install"}
                </span>
              </span>
              {pending === w.id ? (
                <span className="spin inline-block h-5 w-5 rounded-full border-2 border-line-strong border-t-accent" aria-hidden="true" />
              ) : (
                <Icon name="chevronRight" className="text-ink-3" />
              )}
            </button>
          ))}
        </div>
        {pending && (
          <div className="flex flex-col items-start gap-2 rounded-xl bg-sunken px-3.5 py-3">
            <span className="tsm text-ink">
              Nothing showing? Click the {wallets.find((w) => w.id === pending)?.name} icon in your browser toolbar: the request may be waiting there.
              Make sure the wallet is unlocked and set to Testnet.
            </span>
            <button
              type="button"
              className="btn btn-s btn-sm"
              onClick={() => {
                cancelConnect();
                setPending(null);
              }}
            >
              Cancel
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="tsm flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-danger">
            <Icon name="warning" size={18} className="mt-px" />
            <span>{error}</span>
          </p>
        )}
        <div className="well flex flex-col gap-2.5 p-4">
          <span style={{ font: "600 15px/1.2 var(--body)" }}>New to wallets?</span>
          <p className="tsm">A wallet is an app that holds your bitcoin and asks you before anything is sent. You keep it, not Rack.</p>
          <a className="link inline-flex min-h-11 items-center self-start" style={{ fontSize: 14.5 }} href="https://leather.io/learn" target="_blank" rel="noreferrer">
            What’s a wallet? 2-minute guide
          </a>
        </div>
        <div className="txs flex items-start justify-center gap-2">
          <Icon name="lock" size={16} className="mt-px text-success" />
          <span>Rack never holds your funds or your keys. You’ll approve every payment in your wallet.</span>
        </div>
      </section>
    </div>
  );
}
