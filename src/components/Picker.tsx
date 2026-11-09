/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The picker (product-design.md, Controls, control 9; adopted 9 November 2026):
// choosing an entity or one of many, or from a list that grows. A dialog on wide
// screens, a tall sheet from the bottom on phones; search on top above 8 entries.
// A single choice closes on tap; a multiple choice uses checks and «Hecho».
// Escape, a tap outside and «×» close it, and focus returns to what opened it.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, X } from "lucide-react";

export type PickerItem = {
  id: string;
  label: string;
  /** A second line under the label. */
  detail?: string;
  /** A picture before the label (a portrait, a medallion). */
  icon?: React.ReactNode;
};

export type PickerTexts = { search: string; noMatch: (query: string) => string; done: string; cancel: string; close: string };

const PHONE = 640;
const SEARCH_ABOVE = 8;
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Picker({ id, title, intro, items, multiple, selected, onPick, onDone, onClose, texts, footer }: {
  /** Prefix of the element ids: rows are `${id}-item-${item id}`, the done button `${id}-done`. */
  id: string;
  title: string;
  intro?: React.ReactNode;
  items: PickerItem[];
  multiple?: boolean;
  /** The current choice (single) or the starting choices (multiple). */
  selected?: string | string[];
  /** Single choice: the chosen item; the picker closes. */
  onPick?: (itemId: string) => void;
  /** Multiple choice: the chosen items, on «Hecho». */
  onDone?: (itemIds: string[]) => void;
  onClose: () => void;
  texts: PickerTexts;
  /** Extra actions under the list (single choice), such as «Crear familiar». */
  footer?: React.ReactNode;
}) {
  const [phone] = useState(() => window.innerWidth < PHONE);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(Array.isArray(selected) ? selected : []));
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const searchable = items.length > SEARCH_ABOVE;
  const shown = searchable && query ? items.filter((item) => fold(`${item.label} ${item.detail ?? ""}`).includes(fold(query))) : items;

  useLayoutEffect(() => {
    opener.current = document.activeElement;
    const el = box.current;
    const first = el?.querySelector<HTMLElement>(searchable ? "input" : '[aria-current="true"], [data-row]');
    first?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, []);
  useEffect(() => {
    const away = () => onClose();
    window.addEventListener("resize", away);
    return () => window.removeEventListener("resize", away);
  }, [onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
    const el = box.current;
    if (!el) return;
    if (e.key === "Tab") {
      const focusable = Array.from(el.querySelectorAll<HTMLElement>("button:not([disabled]), input"));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const rows = Array.from(el.querySelectorAll<HTMLElement>("[data-row]"));
      if (!rows.length) return;
      e.preventDefault();
      const i = rows.indexOf(document.activeElement as HTMLElement);
      const next = e.key === "ArrowDown" ? Math.min(rows.length - 1, i + 1) : Math.max(0, i - 1);
      rows[i === -1 ? 0 : next].focus();
    }
  };

  const toggle = (itemId: string) => setChosen((current) => {
    const next = new Set(current);
    if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
    return next;
  });

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" onPointerDown={(e) => { e.preventDefault(); onClose(); }} aria-hidden="true" />
      <div
        ref={box}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onKeyDown={onKeyDown}
        className={phone
          ? "fixed z-[61] inset-x-0 bottom-0 h-[85vh] flex flex-col rounded-t-2xl border border-b-0 border-amber-600/50 bg-[#150f22] shadow-[0_-12px_40px_rgba(0,0,0,0.7)] px-2.5 pt-1.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))]"
          : "fixed z-[61] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(440px,calc(100vw-32px))] max-h-[min(640px,86vh)] flex flex-col rounded-2xl border border-amber-600/50 bg-[#150f22] shadow-[0_24px_60px_rgba(0,0,0,0.85)] px-2.5 pt-1.5 pb-2.5"}
      >
        {phone && <div className="w-10 h-1 rounded bg-neutral-700 mx-auto mt-1 mb-1.5 shrink-0" aria-hidden="true" />}
        <div className="flex items-center gap-2.5 px-1.5 pt-2 pb-2.5 border-b border-amber-600/25 shrink-0">
          <h3 id={`${id}-title`} className="flex-1 font-magic text-[13px] font-bold uppercase tracking-[0.1em] text-amber-400">{title}</h3>
          <button type="button" onClick={onClose} aria-label={texts.close}
            className="w-8 h-8 grid place-items-center rounded-md text-neutral-400 hover:text-neutral-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        {intro && <div className="px-2 pt-2.5 text-xs text-neutral-300 shrink-0">{intro}</div>}
        {searchable && (
          <label className="mt-2.5 mx-0.5 flex items-center gap-2 px-2.5 min-h-10 rounded-lg border border-amber-600/50 bg-neutral-950/40 focus-within:border-amber-500 shrink-0">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              id={`${id}-search`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={texts.search}
              aria-label={texts.search}
              autoComplete="off"
              className="flex-1 min-w-0 bg-transparent border-0 p-0 text-sm text-neutral-100 focus:outline-none focus:ring-0 focus:shadow-none"
            />
          </label>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto py-2 grid gap-0.5 content-start">
          {shown.length === 0 && <p className="py-5 text-center text-sm text-neutral-400">{texts.noMatch(query)}</p>}
          {shown.map((item) => {
            const isOn = multiple ? chosen.has(item.id) : selected === item.id;
            return (
              <button
                key={item.id}
                id={`${id}-item-${item.id}`}
                data-row
                type="button"
                role={multiple ? "checkbox" : undefined}
                aria-checked={multiple ? isOn : undefined}
                aria-current={!multiple && isOn ? "true" : undefined}
                onClick={() => (multiple ? toggle(item.id) : onPick?.(item.id))}
                className="flex items-center gap-3 w-full min-h-[52px] px-2.5 py-1.5 rounded-[10px] border border-transparent text-left text-neutral-100 hover:bg-white/5 hover:border-amber-600/30 focus:outline-none focus-visible:bg-white/5 focus-visible:border-amber-600/40 cursor-pointer"
              >
                {multiple && (
                  <span aria-hidden="true" className={`w-5 h-5 shrink-0 rounded-[5px] border-[1.5px] grid place-items-center ${isOn
                      ? "bg-[rgba(42,29,16,0.9)] border-[#e5a93c] text-[#f5b841]"
                      : "bg-neutral-950/60 border-amber-600/50 text-transparent"
                    }`}>
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </span>
                )}
                {item.icon}
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold break-words">{item.label}</span>
                  {item.detail && <span className="block text-[11px] text-neutral-400 break-words">{item.detail}</span>}
                </span>
                {!multiple && isOn && <Check className="w-4 h-4 shrink-0 text-[#f5b841]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        {(multiple || footer) && (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2.5 border-t border-amber-600/25 shrink-0">
            {footer && <div className="mr-auto">{footer}</div>}
            {multiple && (
              <>
                <button type="button" onClick={onClose}
                  className="min-h-10 px-3.5 rounded-lg border border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-neutral-200 text-xs font-semibold cursor-pointer hover:border-[#f3d88c] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                  {texts.cancel}
                </button>
                <button id={`${id}-done`} type="button" disabled={!chosen.size} onClick={() => onDone?.([...chosen])}
                  className="min-h-10 px-3.5 rounded-lg border border-[#9b7424] bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] text-[#1a1105] text-xs font-bold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                  {texts.done} ({chosen.size})
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}

/** The picker's texts from the app's translations. */
export const pickerTexts = (t: { pickerSearch: string; pickerNoMatch: string; pickerDone: string; pickerClose: string; cancel: string }): PickerTexts => ({
  search: t.pickerSearch, noMatch: (query) => t.pickerNoMatch.replace("{q}", query), done: t.pickerDone, cancel: t.cancel, close: t.pickerClose,
});
