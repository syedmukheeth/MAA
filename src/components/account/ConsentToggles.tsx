"use client";

import { useState, useTransition } from "react";
import { setConsent } from "@/actions/privacy";
import {
  CONSENT_PURPOSE_LABELS,
  CONSENT_PURPOSE_DESCRIPTIONS,
} from "@/lib/privacy/labels";

export type ConsentHistoryRow = {
  id: string;
  purpose: "MARKETING_EMAIL" | "TESTIMONIAL_PUBLICATION";
  status: "GRANTED" | "WITHDRAWN";
  at: string;
  noticeVersion: string;
  source: "REGISTRATION" | "ACCOUNT_PRIVACY_PAGE" | "STAFF_RECORDED";
};

/**
 * One switch per consent purpose, and the history behind them.
 *
 * DPDP §6(6) requires withdrawal to be as easy as giving consent, so switching
 * off is a single click that takes effect immediately — no confirmation dialog,
 * no "are you sure you'll miss our offers" step, no downgrade path. If turning
 * it on takes one click, turning it off takes one click.
 *
 * The history is shown because a consent record the person cannot inspect is
 * evidence for us and nothing for them.
 */
export function ConsentToggles({
  marketing,
  testimonial,
  history,
}: {
  marketing: boolean;
  testimonial: boolean;
  history: ConsentHistoryRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Optimistic local state so the switch responds instantly; the server action
  // revalidates the page and reconciles.
  const [state, setState] = useState({ marketing, testimonial });

  function toggle(
    purpose: "MARKETING_EMAIL" | "TESTIMONIAL_PUBLICATION",
    next: boolean
  ) {
    setError(null);
    const key = purpose === "MARKETING_EMAIL" ? "marketing" : "testimonial";
    setState((s) => ({ ...s, [key]: next }));
    startTransition(async () => {
      const res = await setConsent({ purpose, granted: next });
      if (res.error) {
        setError(res.error);
        setState((s) => ({ ...s, [key]: !next }));
      }
    });
  }

  return (
    <div className="space-y-5">
      <Toggle
        checked={state.marketing}
        disabled={pending}
        onChange={(v) => toggle("MARKETING_EMAIL", v)}
        label={CONSENT_PURPOSE_LABELS.MARKETING_EMAIL}
        description={CONSENT_PURPOSE_DESCRIPTIONS.MARKETING_EMAIL}
      />
      <Toggle
        checked={state.testimonial}
        disabled={pending}
        onChange={(v) => toggle("TESTIMONIAL_PUBLICATION", v)}
        label={CONSENT_PURPOSE_LABELS.TESTIMONIAL_PUBLICATION}
        description={CONSENT_PURPOSE_DESCRIPTIONS.TESTIMONIAL_PUBLICATION}
      />

      {error && (
        <p role="alert" className="text-sm text-brand-red">
          {error}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="text-sm text-bronze underline"
        >
          {showHistory ? "Hide" : "Show"} consent history ({history.length})
        </button>

        {showHistory && (
          <ul className="mt-3 space-y-2 text-xs text-graphite/70">
            {history.length === 0 && (
              <li>
                No record yet — you have not turned either of these on.
              </li>
            )}
            {history.map((h) => (
              <li
                key={h.id}
                className="rounded border border-linen bg-cream/50 px-3 py-2"
              >
                <span className="font-medium text-charcoal">
                  {h.status === "GRANTED" ? "Turned on" : "Turned off"}
                </span>{" "}
                — {CONSENT_PURPOSE_LABELS[h.purpose]}
                <span className="block text-graphite/50">
                  {new Date(h.at).toLocaleString("en-IN")} · notice version{" "}
                  {h.noticeVersion} · {SOURCE_LABELS[h.source]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const SOURCE_LABELS: Record<ConsentHistoryRow["source"], string> = {
  REGISTRATION: "set when you signed up",
  ACCOUNT_PRIVACY_PAGE: "set by you on this page",
  STAFF_RECORDED: "recorded by our staff from your agreement in person",
};

function Toggle({
  checked,
  disabled,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 shrink-0 cursor-pointer accent-bronze disabled:opacity-50"
      />
      <span className="text-sm">
        <span className="font-medium text-charcoal">{label}</span>
        <span className="mt-0.5 block text-graphite/60">{description}</span>
      </span>
    </label>
  );
}
