"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { NetworkBadge } from "@/components/NetworkBadge";
import { useWallet } from "@/components/providers/wallet";
import { FlowPanel } from "@/components/shell/FlowPanel";
import { useBalances, usePrice } from "@/lib/hooks";
import { formatInt, ngnToSats } from "@/lib/format";
import { AMOUNT_PRESETS, detectNetwork, formatLocalPhone, MAX_NGN, MIN_NGN, NETWORKS, networkInfo, normalizePhone } from "@/lib/phone";
import type { Network } from "@/lib/types";

export default function AirtimePage() {
  return (
    <Suspense>
      <AirtimeForm />
    </Suspense>
  );
}

function AirtimeForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { stxAddress } = useWallet();
  const price = usePrice();
  const balances = useBalances();

  const initialNetwork = NETWORKS.find((n) => n.id === params.get("network"))?.id ?? null;
  const [phone, setPhone] = useState(() => (params.get("phone") ? formatLocalPhone(params.get("phone")!) : ""));
  const [chosen, setChosen] = useState<Network | null>(initialNetwork);
  const [amount, setAmount] = useState(() => params.get("amount") ?? "2000");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmOverride, setConfirmOverride] = useState(false);

  const normalized = normalizePhone(phone);
  const detected = normalized ? detectNetwork(normalized) : null;
  const network = chosen ?? detected;
  const mismatch = Boolean(detected && chosen && detected !== chosen);
  const amountNgn = Number(amount.replace(/\D/g, ""));
  const amountOk = Number.isInteger(amountNgn) && amountNgn >= MIN_NGN && amountNgn <= MAX_NGN;
  const estSats = price.data && amountOk ? ngnToSats(amountNgn, price.data.btcNgn) : null;
  const insufficient = estSats !== null && balances.data !== undefined && BigInt(estSats) > balances.data.sbtc;

  const phoneError = touched && phone && !normalized ? "Enter a Nigerian mobile number, like 0803 456 7214." : null;
  const amountError = touched && !amountOk ? `Enter an amount from ₦${MIN_NGN} to ₦${formatInt(MAX_NGN)}.` : null;
  const canSubmit = Boolean(normalized && network && amountOk && !submitting && (!mismatch || confirmOverride) && !insufficient);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || !stxAddress || !network || !normalized) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sender: stxAddress,
          category: "airtime",
          network,
          phone: normalized,
          amountNgn,
          networkOverride: mismatch && confirmOverride,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn’t get a price. Try again.");
      router.push(`/pay/review/${json.quoteId}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Couldn’t get a price. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="contents">
      <FlowPanel
        title="Airtime"
        step="Step 2 of 3 · Details"
        back="/pay"
        close="/pay"
        footer={
          <>
            <button type="submit" className={`btn btn-p btn-lg btn-block${canSubmit ? "" : " dis"}`} aria-disabled={!canSubmit}>
              {submitting ? "Getting your price…" : "Continue"}
              {!submitting && <Icon name="chevronRight" />}
            </button>
            <p className="txs flex items-start justify-center gap-2 text-center">
              <Icon name="lock" size={16} className="mt-px text-success" />
              You approve every payment in your wallet.
            </p>
          </>
        }
      >
        <div className="field">
          <label className="lbl" htmlFor="air-phone">
            Phone number
          </label>
          <div className={`inp${phoneError ? " err" : normalized ? " ok" : ""}`}>
            {network ? <NetworkBadge network={network} size={26} /> : <Icon name="phone" className="text-ink-3" />}
            <input
              id="air-phone"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="0803 456 7214"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setConfirmOverride(false);
              }}
              onBlur={() => {
                setTouched(true);
                if (normalized) setPhone(formatLocalPhone(normalized));
              }}
              aria-invalid={Boolean(phoneError)}
              aria-describedby="air-det"
            />
          </div>
          <span id="air-det" role={phoneError ? "alert" : undefined}>
            {phoneError ? (
              <span className="txs flex items-center gap-1.5 font-semibold text-danger">
                <Icon name="warning" size={16} />
                {phoneError}
              </span>
            ) : detected ? (
              <span className="txs flex items-center gap-1.5 font-semibold text-success">
                <Icon name="check" size={16} bold />
                {networkInfo(detected).name} number detected. Change it below if they’ve switched networks.
              </span>
            ) : normalized ? (
              <span className="txs">We couldn’t tell the network from this number. Pick it below.</span>
            ) : null}
          </span>
        </div>

        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="lbl mb-2.5 p-0">Network</legend>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {NETWORKS.map((n) => {
              const on = network === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`pill${on ? " on" : ""}`}
                  aria-pressed={on}
                  onClick={() => {
                    setChosen(n.id);
                    setConfirmOverride(false);
                  }}
                  style={{ justifyContent: "flex-start", padding: "0 14px 0 8px", gap: 10 }}
                >
                  <NetworkBadge network={n.id} />
                  {n.name}
                </button>
              );
            })}
          </div>
          {mismatch && detected && chosen && (
            <label className="check rounded-xl bg-warn-soft px-3.5 py-2">
              <input type="checkbox" checked={confirmOverride} onChange={(e) => setConfirmOverride(e.target.checked)} />
              <span>
                This looks like a {networkInfo(detected).name} number. They’ve switched to {networkInfo(chosen).name}.
              </span>
            </label>
          )}
        </fieldset>

        <div className="field">
          <label className="lbl" htmlFor="air-amt">
            Amount
          </label>
          <div className={`inp${amountError ? " err" : ""}`}>
            <span className="num text-ink-3" style={{ font: "700 22px/1 var(--display)" }}>
              ₦
            </span>
            <input
              id="air-amt"
              inputMode="numeric"
              value={amount ? formatInt(amountNgn) : ""}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onBlur={() => setTouched(true)}
              style={{ font: "700 22px/1 var(--display)" }}
              aria-invalid={Boolean(amountError)}
              aria-describedby="air-amt-help"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {AMOUNT_PRESETS.map((a) => (
              <button
                key={a}
                type="button"
                className={`pill${amountNgn === a ? " on" : ""}`}
                aria-pressed={amountNgn === a}
                onClick={() => setAmount(String(a))}
                style={{ padding: "0 12px" }}
              >
                ₦{formatInt(a)}
              </button>
            ))}
          </div>
          <span id="air-amt-help" className="tsm font-medium">
            {amountError ? (
              <span className="text-danger" role="alert">
                {amountError}
              </span>
            ) : insufficient ? (
              <span className="text-danger" role="alert">
                That’s more than your bitcoin savings ({formatInt(Number(balances.data!.sbtc))} sats).
              </span>
            ) : estSats !== null ? (
              <>≈ {formatInt(estSats)} sats from your savings</>
            ) : price.isError ? (
              "Bitcoin price unavailable. You’ll see the exact amount on the next step."
            ) : (
              " "
            )}
          </span>
        </div>

        {serverError && (
          <p role="alert" className="tsm flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-danger">
            <Icon name="warning" size={18} className="mt-px" />
            <span>{serverError}</span>
          </p>
        )}
      </FlowPanel>
    </form>
  );
}
