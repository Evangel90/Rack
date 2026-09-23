import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { RequireWallet } from "@/components/shell/RequireWallet";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireWallet>
      <AppShell>{children}</AppShell>
    </RequireWallet>
  );
}
