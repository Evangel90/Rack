import type { ReactNode } from "react";
import { Icon } from "./icons";

export type Step = { label: string; detail?: ReactNode; state: "done" | "active" | "todo" | "failed" };

const stateText: Record<Step["state"], string> = { done: "Done", active: "In progress", todo: "Up next", failed: "Failed" };

/** Vertical step tracker from the design (status never shown by colour alone: each step has a word). */
export function StepTracker({ steps }: { steps: Step[] }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={s.label} className="flex gap-4" aria-current={s.state === "active" ? "step" : undefined}>
            <span className="flex flex-none flex-col items-center">
              {s.state === "done" ? (
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-success text-surface">
                  <Icon name="check" size={16} bold />
                </span>
              ) : s.state === "failed" ? (
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-danger text-surface">
                  <Icon name="close" size={16} bold />
                </span>
              ) : s.state === "active" ? (
                <span className="pulse flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-accent bg-accent-soft">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                </span>
              ) : (
                <span className="h-[30px] w-[30px] rounded-full border-2 border-line-strong bg-surface" />
              )}
              {!last && (
                <span
                  className="my-1 min-h-[22px] w-0.5 flex-1 rounded-sm"
                  style={{ background: s.state === "done" ? "var(--success)" : "var(--line-strong)" }}
                />
              )}
            </span>
            <span className={`flex min-w-0 flex-1 flex-col gap-[5px] pt-1 ${last ? "" : "pb-5"}`}>
              <span className="flex items-baseline justify-between gap-2.5">
                <span style={{ font: "600 16px/1.25 var(--body)", color: s.state === "todo" ? "var(--ink-3)" : "var(--ink)" }}>{s.label}</span>
                <span
                  className="txs whitespace-nowrap font-semibold"
                  style={{
                    color:
                      s.state === "done"
                        ? "var(--success)"
                        : s.state === "active"
                          ? "var(--accent-text)"
                          : s.state === "failed"
                            ? "var(--danger)"
                            : undefined,
                  }}
                >
                  {stateText[s.state]}
                </span>
              </span>
              {s.detail && <span className="tsm">{s.detail}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
