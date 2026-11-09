/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The segmented control (product-design.md, Controls, control 5; adopted 9 November 2026):
// 2–4 short options that set a mode, in one fixed row, the chosen one lit.
// Arrow keys move and choose, as in a radio group.
import React, { useRef } from "react";

export function Segmented<T extends string>({ label, options, value, onChange, full, small, id }: {
  /** The group's accessible name. */
  label: string;
  options: { value: T; label: string; id?: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Fill the available width, options sharing it equally. */
  full?: boolean;
  /** Smaller text and height, for narrow places (the sheet's portrait column). */
  small?: boolean;
  id?: string;
}) {
  const group = useRef<HTMLDivElement>(null);
  const move = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };
  return (
    <div
      id={id}
      ref={group}
      role="radiogroup"
      aria-label={label}
      className={`${full ? "flex w-full" : "inline-flex"} p-[3px] gap-0.5 rounded-[10px] border border-amber-600/50 bg-neutral-950/40`}
    >
      {options.map((option, index) => {
        const chosen = option.value === value;
        return (
          <button
            key={option.value}
            id={option.id}
            type="button"
            role="radio"
            aria-checked={chosen}
            tabIndex={chosen ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => move(e, index)}
            className={`${full ? "flex-1" : ""} ${small ? "min-h-7 px-2 text-[10px]" : "min-h-8 px-3 text-xs"} rounded-[7px] border font-semibold whitespace-nowrap transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${chosen
                ? "bg-[rgba(42,29,16,0.9)] border-[#e5a93c] text-[#f5b841] shadow-[0_0_12px_rgba(229,169,60,0.3)]"
                : "border-transparent text-neutral-300 hover:text-neutral-100"
              }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
