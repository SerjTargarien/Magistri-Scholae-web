/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A date and time drawn by the app (product-design.md, Controls; R3.5, the move
// to the Bitácora): a button with the day that opens a month calendar, and the
// hour and minutes as steppers. Never the browser's date picker. Month and
// weekday names come from the browser's own Spanish/English formats.
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Language } from "../localization";
import { Stepper } from "./Stepper";

export interface DateTimeTexts { day: string; hour: string; minute: string; prevMonth: string; nextMonth: string }

const locale = (lang: Language) => (lang === "es" ? "es-ES" : "en-GB");
const NAV = "w-9 h-9 grid place-items-center rounded-lg border border-neutral-800 text-amber-300 hover:border-amber-600/60 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

export function DateTimeField({ id, value, onChange, lang, texts }: {
  /** Ids: `${id}-day` (the button), `${id}-day-<n>` (calendar days), `${id}-hour`, `${id}-minute`. */
  id: string;
  /** Milliseconds. */
  value: number;
  onChange: (value: number) => void;
  lang: Language;
  texts: DateTimeTexts;
}) {
  const chosen = new Date(value);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(chosen.getFullYear(), chosen.getMonth(), 1));
  const set = (date: Date) => onChange(date.getTime());
  const withTime = (hours: number, minutes: number) => { const d = new Date(value); d.setHours(hours, minutes, 0, 0); set(d); };

  const dayLabel = new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short", year: "numeric" }).format(chosen);
  const monthName = new Intl.DateTimeFormat(locale(lang), { month: "long", year: "numeric" }).format(month);
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1); // «Noviembre de 2026»
  // Monday first; narrow weekday names from a known Monday (5 January 2026).
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale(lang), { weekday: "narrow" }).format(new Date(2026, 0, 5 + i)));
  const first = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const isChosen = (d: number) => chosen.getFullYear() === month.getFullYear() && chosen.getMonth() === month.getMonth() && chosen.getDate() === d;
  const shift = (step: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + step, 1));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          id={`${id}-day`}
          aria-expanded={open}
          aria-label={`${texts.day}: ${dayLabel}`}
          onClick={() => { setMonth(new Date(chosen.getFullYear(), chosen.getMonth(), 1)); setOpen(!open); }}
          className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-neutral-950 text-amber-100 text-xs font-bold hover:border-amber-400 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          {dayLabel}
        </button>
        <span className="inline-flex items-center gap-1">
          <Stepper id={`${id}-hour`} label={texts.hour} value={chosen.getHours()} min={0} max={23} typed onChange={h => withTime(h, chosen.getMinutes())} />
          <span className="text-neutral-400 font-mono">:</span>
          <Stepper id={`${id}-minute`} label={texts.minute} value={chosen.getMinutes()} min={0} max={59} typed onChange={m => withTime(chosen.getHours(), m)} />
        </span>
      </div>
      {open && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-2 space-y-1.5 max-w-xs" role="group" aria-label={texts.day}>
          <div className="flex items-center justify-between">
            <button type="button" className={NAV} aria-label={texts.prevMonth} onClick={() => shift(-1)}><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs text-amber-200">{monthLabel}</span>
            <button type="button" className={NAV} aria-label={texts.nextMonth} onClick={() => shift(1)}><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((w, i) => <span key={i} className="text-[10px] font-mono text-neutral-500 uppercase">{w}</span>)}
            {Array.from({ length: first }, (_, i) => <span key={`blank-${i}`} />)}
            {Array.from({ length: days }, (_, i) => i + 1).map(d => (
              <button
                key={d}
                type="button"
                id={`${id}-day-${d}`}
                aria-pressed={isChosen(d)}
                onClick={() => { const next = new Date(value); next.setFullYear(month.getFullYear(), month.getMonth(), d); set(next); setOpen(false); }}
                className={`h-8 rounded-md text-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isChosen(d) ? "bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] text-[#1a1105] font-bold" : "bg-neutral-900/70 text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
