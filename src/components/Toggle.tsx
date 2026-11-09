/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Switch and Check (product-design.md, Controls, controls 3 and 4; adopted 9 November 2026).
// A switch is one on/off property that takes effect at once; the whole row is
// tappable. A check acknowledges something before an action, or chooses several
// items inside a picker. Both are drawn by the app, never by the browser.
import React from "react";
import { Check as Tick } from "lucide-react";

const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";

export function Switch({ id, checked, onChange, label, hint, disabled, inline, labelClassName = "text-xs text-neutral-200" }: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  /** A second line under the label. */
  hint?: React.ReactNode;
  disabled?: boolean;
  /** Only as wide as its content (inside a row of other controls). */
  inline?: boolean;
  labelClassName?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`${inline ? "inline-flex w-auto" : "flex w-full"} items-center justify-between gap-3 min-h-10 px-2 py-1 rounded-lg border border-transparent text-left transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-amber-600/30"} ${FOCUS}`}
    >
      <span className="min-w-0">
        <span className={`block ${labelClassName}`}>{label}</span>
        {hint && <span className="block text-[11px] text-neutral-400">{hint}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`relative w-[38px] h-[22px] shrink-0 rounded-full border transition-colors ${checked
            ? "bg-[rgba(42,29,16,0.9)] border-[#e5a93c] shadow-[0_0_12px_rgba(229,169,60,0.3)]"
            : "bg-neutral-800 border-amber-600/50"
          }`}
      >
        <span className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full transition-transform ${checked ? "translate-x-4 bg-[#f5b841]" : "bg-neutral-400"}`} />
      </span>
    </button>
  );
}

export function Check({ id, checked, onChange, children, disabled }: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-3 min-h-10 px-2 py-1.5 rounded-lg border border-transparent text-left transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-amber-600/30"} ${FOCUS}`}
    >
      <span
        aria-hidden="true"
        className={`mt-px w-5 h-5 shrink-0 rounded-[5px] border-[1.5px] grid place-items-center transition-colors ${checked
            ? "bg-[rgba(42,29,16,0.9)] border-[#e5a93c] text-[#f5b841]"
            : "bg-neutral-950/60 border-amber-600/50 text-transparent"
          }`}
      >
        <Tick className="w-3.5 h-3.5" strokeWidth={3} />
      </span>
      <span className="min-w-0">{children}</span>
    </button>
  );
}
