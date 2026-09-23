"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/components/providers/wallet";
import { fetchBalances } from "./stacks/balances";
import type { Deposit, Order, Price } from "./types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `Request failed (${res.status})`);
  return json as T;
}

export function usePrice() {
  return useQuery({
    queryKey: ["price"],
    queryFn: () => getJson<Price>("/api/price"),
    refetchInterval: 60_000,
    staleTime: 55_000,
  });
}

export function useBalances() {
  const { stxAddress } = useWallet();
  return useQuery({
    queryKey: ["balances", stxAddress],
    queryFn: () => fetchBalances(stxAddress!),
    enabled: Boolean(stxAddress),
    refetchInterval: 30_000,
  });
}

export type ActivityItem =
  | { kind: "order"; id: string; createdAt: string; order: Order }
  | { kind: "deposit"; id: string; createdAt: string; deposit: Deposit };

/** Airtime orders and deposits started in this app, newest first. */
export function useActivity() {
  const { stxAddress } = useWallet();
  return useQuery({
    queryKey: ["activity", stxAddress],
    enabled: Boolean(stxAddress),
    refetchInterval: 15_000,
    queryFn: async (): Promise<ActivityItem[]> => {
      const q = `sender=${encodeURIComponent(stxAddress!)}`;
      const [orders, deposits] = await Promise.all([
        getJson<Order[]>(`/api/orders?${q}`),
        getJson<Deposit[]>(`/api/deposits?${q}`),
      ]);
      return [
        ...orders.map((o) => ({ kind: "order" as const, id: o.id, createdAt: o.createdAt, order: o })),
        ...deposits.map((d) => ({ kind: "deposit" as const, id: d.id, createdAt: d.createdAt, deposit: d })),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  });
}

export { getJson };
