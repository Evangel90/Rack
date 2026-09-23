import { Icon, type IconName } from "./icons";
import type { DepositStatus, OrderStatus } from "@/lib/types";

type Tone = "ok" | "pend" | "fail" | "info" | "neu" | "acc";

// Status is never shown by colour alone: every chip has an icon and a word.
const ORDER: Record<OrderStatus, { tone: Tone; icon: IconName; label: string }> = {
  awaiting_payment: { tone: "pend", icon: "clock", label: "Pending" },
  paid: { tone: "info", icon: "clock", label: "Processing" },
  fulfilled: { tone: "ok", icon: "check", label: "Paid" },
  failed: { tone: "fail", icon: "close", label: "Failed" },
  refund_needed: { tone: "fail", icon: "undo", label: "Refund due" },
};

const DEPOSIT: Record<DepositStatus, { tone: Tone; icon: IconName; label: string }> = {
  sent: { tone: "info", icon: "clock", label: "Sent" },
  confirming: { tone: "info", icon: "clock", label: "Confirming" },
  minting: { tone: "info", icon: "clock", label: "Minting" },
  done: { tone: "ok", icon: "check", label: "Saved" },
  failed: { tone: "fail", icon: "close", label: "Failed" },
};

export function Chip({ tone, icon, children }: { tone: Tone; icon?: IconName; children: React.ReactNode }) {
  return (
    <span className={`chip c-${tone}`}>
      {icon && <Icon name={icon} size={14} bold />}
      {children}
    </span>
  );
}

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const s = ORDER[status];
  return (
    <Chip tone={s.tone} icon={s.icon}>
      {s.label}
    </Chip>
  );
}

export function DepositStatusChip({ status }: { status: DepositStatus }) {
  const s = DEPOSIT[status];
  return (
    <Chip tone={s.tone} icon={s.icon}>
      {s.label}
    </Chip>
  );
}
