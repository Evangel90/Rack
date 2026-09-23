"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { connectWallet, disconnectWallet, type WalletId, type WalletSession } from "@/lib/stacks/wallet";

type WalletState = {
  /** False until the saved session has been read on the client. */
  ready: boolean;
  stxAddress: string | null;
  btcAddress: string | null;
  btcPublicKey: string | null;
  walletName: string | null;
  connectedAt: string | null;
  connecting: boolean;
  error: string | null;
  connect: (wallet: WalletId) => Promise<boolean>;
  /** Stop waiting for a wallet that never answered (the wallet prompt itself can't be closed from here). */
  cancelConnect: () => void;
  disconnect: () => void;
};

const WalletContext = createContext<WalletState | null>(null);
const KEY = "rack.wallet";

function load(): WalletSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as WalletSession;
    return s.stxAddress ? s : null;
  } catch {
    return null;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSession(load());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Each attempt gets a number; results from a cancelled attempt are ignored.
  const attempt = useRef(0);

  const connect = useCallback(async (wallet: WalletId) => {
    const mine = ++attempt.current;
    setConnecting(true);
    setError(null);
    try {
      const s = await connectWallet(wallet);
      if (mine !== attempt.current) return false;
      setSession(s);
      try {
        localStorage.setItem(KEY, JSON.stringify(s));
      } catch {}
      return true;
    } catch (e) {
      if (mine === attempt.current) setError(e instanceof Error ? e.message : "The wallet didn’t connect. Try again.");
      return false;
    } finally {
      if (mine === attempt.current) setConnecting(false);
    }
  }, []);

  const cancelConnect = useCallback(() => {
    attempt.current++;
    setConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setSession(null);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ready,
        stxAddress: session?.stxAddress ?? null,
        btcAddress: session?.btcAddress ?? null,
        btcPublicKey: session?.btcPublicKey ?? null,
        walletName: session?.walletName ?? null,
        connectedAt: session?.connectedAt ?? null,
        connecting,
        error,
        connect,
        cancelConnect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
