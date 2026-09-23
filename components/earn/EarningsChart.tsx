"use client";

import { useEffect, useRef, useState } from "react";
import { formatInt } from "@/lib/format";

export type EarningsPoint = { month: string; sats: number };

const H = 300;
const PAD = { top: 76, right: 16, bottom: 28, left: 52 };

/**
 * Single-series cumulative earnings line (2px, one axis, recessive grid) with a crosshair
 * tooltip and a table fallback. Colour is the validated --chart-line token for each theme.
 */
export function EarningsChart({ data, btcNgn }: { data: EarningsPoint[]; btcNgn?: number }) {
  const [hover, setHover] = useState(data.length - 1);
  // Draw at the real pixel width so axis text stays 12px at every size.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(600);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const max = Math.ceil(Math.max(...data.map((d) => d.sats)) / 2000) * 2000;
  const ticks = [0, max / 2, max];
  const x = (i: number) => PAD.left + (i * (W - PAD.left - PAD.right)) / (data.length - 1);
  const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.sats)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const p = data[hover];
  const tipLeftPct = (x(hover) / W) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div ref={box} className="relative" onMouseLeave={() => setHover(data.length - 1)}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block" role="img" aria-label="Example: total sats earned by month">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fill="var(--ink-3)" style={{ font: "500 12px var(--body)" }}>
                {formatInt(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <text key={d.month} x={x(i)} y={H - 8} textAnchor="middle" fill="var(--ink-3)" style={{ font: "500 12px var(--body)" }}>
              {d.month}
            </text>
          ))}
          <path d={area} fill="var(--chart-line)" opacity={0.1} />
          <path d={line} fill="none" stroke="var(--chart-line)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="var(--ink-3)" strokeWidth={1} opacity={0.5} />
          <circle cx={x(hover)} cy={y(p.sats)} r={5} fill="var(--chart-line)" stroke="var(--surface)" strokeWidth={2} />
          {/* Hit targets: full-height column per point, wider than the mark. */}
          {data.map((d, i) => (
            <rect
              key={d.month}
              x={x(i) - (W - PAD.left - PAD.right) / (data.length - 1) / 2}
              y={0}
              width={(W - PAD.left - PAD.right) / (data.length - 1)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onTouchStart={() => setHover(i)}
            />
          ))}
        </svg>
        <div
          className="pointer-events-none absolute top-0 flex w-[168px] flex-col gap-1 rounded-xl bg-ink px-3 py-2.5 text-bg shadow-[var(--shadow-lg)]"
          style={{ left: `clamp(0px, calc(${tipLeftPct}% - 84px), calc(100% - 168px))` }}
          aria-hidden="true"
        >
          <span className="opacity-75" style={{ font: "600 12px/1 var(--body)" }}>
            {p.month} · total earned
          </span>
          <span className="num" style={{ font: "700 17px/1 var(--display)" }}>
            {formatInt(p.sats)} sats
          </span>
          {btcNgn && (
            <span className="opacity-75" style={{ font: "500 12px/1 var(--body)" }}>
              ≈ ₦{formatInt((p.sats / 1e8) * btcNgn)} · est.
            </span>
          )}
        </div>
      </div>
      <details className="text-ink-2" style={{ font: "500 14px/1.4 var(--body)" }}>
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-accent-text">Show as table</summary>
        <table className="mt-1.5 w-full border-collapse">
          <thead className="sr-only">
            <tr>
              <th>Month</th>
              <th>Total earned</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month}>
                <td className="border-b border-line py-1.5">{d.month} (example)</td>
                <td className="border-b border-line py-1.5 text-right">{formatInt(d.sats)} sats</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
