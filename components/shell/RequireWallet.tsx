"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useWallet } from "../providers/wallet";

/** Route guard: app screens need a connected wallet, otherwise back to the landing page. */
export function RequireWallet({ children }: { children: ReactNode }) {
  const { ready, stxAddress } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (ready && !stxAddress) router.replace("/");
  }, [ready, stxAddress, router]);

  if (!ready || !stxAddress) return <div className="min-h-dvh" aria-busy="true" />;
  return <>{children}</>;
}
