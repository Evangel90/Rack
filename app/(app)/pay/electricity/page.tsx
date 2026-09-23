"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { FlowPanel } from "@/components/shell/FlowPanel";
import { Chip } from "@/components/StatusChip";
import { usePrice } from "@/lib/hooks";
import { formatInt, ngnToSats } from "@/lib/format";

const PRESETS = [5000, 10000, 20000, 50000];

/** Static preview of the electricity flow (M2). Demo values; nothing is submitted. */
export default function ElectricityPreviewPage() {
  const price = usePrice();
  const [type, setType] = useState<"prepaid" | "postpaid">("prepaid");
  const [amount, setAmount] = useState(10000);

  return (
    <FlowPanel
      title="Electricity"
      step="Preview · coming soon"
      back="/pay"
      close="/pay"
      footer={
        <>
          <button type="button" className="btn btn-p btn-lg btn-block dis" aria-disabled="true">
            Coming soon
          </button>
          <p className="txs text-center">Electricity arrives with a licensed bill-payment partner. Airtime works today.</p>
        </>
      }
    >
      <p className="txs flex items-start gap-2 rounded-xl bg-info-soft px-3.5 py-3 text-ink">
        <Icon name="info" size={16} className="mt-px text-info" />
        Preview with example details. Nothing here is sent.
      </p>
      <div className="field">
        <span className="lbl" id="disco-l">
          Electricity company
        </span>
        <div className="inp" aria-labelledby="disco-l">
          <span className="badge" aria-hidden="true" style={{ width: 30, height: 30, background: "#3F5E8C", color: "#FFFFFF", fontSize: 14 }}>
            IE
          </span>
          <span className="flex-1" style={{ font: "500 17px/1.2 var(--body)" }}>
            Ikeja Electric (IKEDC)
          </span>
          <Icon name="chevronDown" className="text-ink-3" />
        </div>
      </div>
      <div className="field">
        <span className="lbl">Meter type</span>
        <div className="seg flex" role="group" aria-label="Meter type">
          {(["prepaid", "postpaid"] as const).map((t) => (
            <button key={t} type="button" className={`flex-1 ${type === t ? "on" : ""}`} aria-pressed={type === t} onClick={() => setType(t)}>
              {t === "prepaid" ? "Prepaid" : "Postpaid"}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="meter">
          Meter number
        </label>
        <div className="inp ok">
          <input id="meter" inputMode="numeric" defaultValue="4512 3345 8890" className="mono" style={{ letterSpacing: ".04em" }} />
          <Icon name="check" className="text-success" bold />
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-success-soft px-3.5 py-3">
          <Icon name="user" className="text-success" />
          <span className="flex flex-col gap-[3px]">
            <span className="text-ink" style={{ font: "600 15px/1.2 var(--body)" }}>
              Meter belongs to: ADEBAYO O. (example)
            </span>
            <span className="txs text-ink-2">Ikeja Electric · {type === "prepaid" ? "Prepaid" : "Postpaid"} · verified before you pay</span>
          </span>
        </div>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="el-amt">
          Amount
        </label>
        <div className="inp">
          <span className="num text-ink-3" style={{ font: "700 22px/1 var(--display)" }}>
            ₦
          </span>
          <input id="el-amt" inputMode="numeric" readOnly value={formatInt(amount)} style={{ font: "700 22px/1 var(--display)" }} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((a) => (
            <button key={a} type="button" className={`pill${amount === a ? " on" : ""}`} aria-pressed={amount === a} onClick={() => setAmount(a)} style={{ padding: "0 10px" }}>
              ₦{formatInt(a)}
            </button>
          ))}
        </div>
        <span className="tsm font-medium">{price.data ? `≈ ${formatInt(ngnToSats(amount, price.data.btcNgn))} sats from your savings` : " "}</span>
      </div>
      <span>
        <Chip tone="acc" icon="clock">
          Coming in a later release
        </Chip>
      </span>
    </FlowPanel>
  );
}
