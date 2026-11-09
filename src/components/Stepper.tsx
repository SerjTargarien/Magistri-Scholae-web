/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The stepper (product-design.md, Controls, control 1; adopted 9 November 2026):
// an ordered number where the exact value matters. «−» and «+» stop at the range,
// disabled there. For a range above 20 the value can also be typed (`typed`), in a
// plain text box: never the browser's number spinner.
import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { HIT } from "./TagMenu";

const STEP = "w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
const STEP_ON = "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-amber-400 hover:border-amber-600/60 cursor-pointer";
const STEP_OFF = "bg-neutral-900 border-neutral-800 text-neutral-700 cursor-not-allowed";

export function Stepper({ id, value, min, max, onChange, label, showLabel, typed, labelClassName = "text-xs text-neutral-300" }: {
  /** The value's id; the buttons are `${id}-minus` and `${id}-plus`. */
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** What the number is: the buttons' names, and shown beside it with `showLabel`. */
  label: string;
  showLabel?: boolean;
  /** The value is a box that can be typed in (ranges above 20). */
  typed?: boolean;
  labelClassName?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const set = (next: number) => onChange(Math.min(max, Math.max(min, Math.round(next))));
  const commit = () => {
    if (draft !== null && draft !== "") set(parseInt(draft, 10));
    setDraft(null);
  };
  const controls = (
    <span className="inline-flex items-center gap-1.5" role="group" aria-label={label}>
      <button id={`${id}-minus`} type="button" disabled={value <= min} onClick={() => set(value - 1)}
        aria-label={`${label}: −1`} className={`${HIT} ${STEP} ${value <= min ? STEP_OFF : STEP_ON}`}>
        <Minus className="w-3.5 h-3.5" />
      </button>
      {typed ? (
        <input
          id={id}
          type="text"
          inputMode="numeric"
          maxLength={String(max).length}
          aria-label={label}
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            else if (e.key === "Escape") setDraft(null);
          }}
          className="w-14 text-center font-mono font-bold text-sm text-amber-400 bg-neutral-950 border border-neutral-700/60 rounded-lg px-1 py-1 focus:outline-none focus:border-amber-500"
        />
      ) : (
        <span id={id} aria-live="polite" className="min-w-[2ch] text-center font-mono font-bold text-sm text-amber-400 tabular-nums">{value}</span>
      )}
      <button id={`${id}-plus`} type="button" disabled={value >= max} onClick={() => set(value + 1)}
        aria-label={`${label}: +1`} className={`${HIT} ${STEP} ${value >= max ? STEP_OFF : STEP_ON}`}>
        <Plus className="w-3.5 h-3.5" />
      </button>
    </span>
  );
  if (!showLabel) return controls;
  return (
    <div className="flex items-center justify-between gap-3 min-h-10 px-2">
      <span className={labelClassName}>{label}</span>
      {controls}
    </div>
  );
}
