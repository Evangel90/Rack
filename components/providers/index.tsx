"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { PrefsProvider } from "./prefs";
import { WalletProvider } from "./wallet";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: true, retry: 1 } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <PrefsProvider>
        <WalletProvider>{children}</WalletProvider>
      </PrefsProvider>
    </QueryClientProvider>
  );
}
