/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The filter bar (product-design.md, Controls, control 11; approved by the owner in the
// controls demo, 9 November 2026): one row however many filters exist. The magnifier
// chooses where to search (everything by default); «Filtros» shows how many filters are
// on and opens a sheet with the sort order (one field from a searchable list, with a
// direction) and one section per filter, each a list with checks. Active filters show as
// small removable chips under the search. A dialog on wide screens, a sheet from the
// bottom on phones; Escape, a tap outside and «×» close it. Used by the main list (R4 b)
// and, later, the Biblioteca (R5).
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ChevronLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { Segmented } from "./Segmented";
import { HIT, TagMenu } from "./TagMenu";

export type SortDirection = "asc" | "desc";
export interface FilterState {
  query: string;
  /** Where to search: "all" or one of the search fields. */
  field: string;
  /** The checked options of each section, by section id; an empty section filters nothing. */
  selected: Record<string, string[]>;
  sort: string;
  dir: SortDirection;
}
export interface FilterOption { value: string; label: string; icon?: React.ReactNode }
export interface FilterSection {
  id: string; title: string; options: FilterOption[];
  /** What the section selects when untouched (the main list hides inactive sheets); it neither counts nor shows a chip. */
  defaultSelected?: string[];
  /** Said in the results line while the section is at its default. */
  defaultNote?: string;
}
/** A section's selection: its own, or its default. Empty means it filters nothing. */
export const selectionOf = (state: FilterState, section: FilterSection) => state.selected[section.id] ?? section.defaultSelected ?? [];
/** Back to the default when a defaulted section is emptied or set to its default. */
function normalized(state: FilterState, sections: FilterSection[]): FilterState {
  const selected = { ...state.selected };
  for (const section of sections) {
    const list = selected[section.id];
    if (!list || !section.defaultSelected) continue;
    const same = list.length === section.defaultSelected.length && list.every((v) => section.defaultSelected!.includes(v));
    if (!list.length || same) delete selected[section.id];
  }
  return { ...state, selected };
}
export interface SortField { value: string; label: string; /** Numbers and dates start from the highest. */ descFirst?: boolean }
export interface FilterTexts {
  search: string; searchIn: string; everything: string; everythingHint: string; filters: string; activeFilters: string;
  sortBy: string; fieldCount: string; direction: string; asc: string; desc: string; searchField: string; noField: string;
  back: string; clear: string; show: string; showOne: string; results: string; removeFilter: string; close: string;
}

const PHONE = 640;
/** Tells this page's history entry apart from one left by a reload (as the image viewer does). */
const PAGE_TOKEN = Math.random().toString(36).slice(2);
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));

/** How many filters are on (the sort order is not a filter). */
export const activeCount = (state: FilterState) => Object.values(state.selected).reduce((n, list) => n + list.length, 0);

export function FilterBar({ id, state, onChange, searchFields, sections, sortFields, defaultSort, shown, total, countFor, texts }: {
  /** Prefix of the element ids. */
  id: string;
  state: FilterState;
  onChange: (next: FilterState) => void;
  /** Where the magnifier can search, besides «Todo». */
  searchFields: { value: string; label: string }[];
  sections: FilterSection[];
  sortFields: SortField[];
  defaultSort: { sort: string; dir: SortDirection };
  /** Results now, and in all. */
  shown: number;
  total: number;
  /** How many results a state would give (the sheet's «Ver N resultados»). */
  countFor: (state: FilterState) => number;
  texts: FilterTexts;
}) {
  const [open, setOpen] = useState(false);
  const n = activeCount(state);
  const fieldLabel = state.field === "all" ? texts.everything : searchFields.find((f) => f.value === state.field)?.label ?? texts.everything;
  const sortLabel = sortFields.find((f) => f.value === state.sort)?.label ?? "";
  const chips = sections.flatMap((section) => (state.selected[section.id] ?? []).map((value) => ({
    section: section.id, value, label: section.options.find((o) => o.value === value)?.label ?? value,
  })));
  const unset = (section: string, value: string) =>
    onChange(normalized({ ...state, selected: { ...state.selected, [section]: (state.selected[section] ?? []).filter((v) => v !== value) } }, sections));
  const notes = sections.filter((s) => s.defaultNote && state.selected[s.id] === undefined).map((s) => ` · ${s.defaultNote}`).join("");

  return (
    <div className="space-y-2" id={id}>
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-1 pl-1 pr-3 min-h-11 rounded-xl border border-amber-600/50 bg-neutral-950/40 focus-within:border-amber-500 focus-within:shadow-[0_0_0_2px_rgba(245,158,11,0.2)]">
          <TagMenu<string>
            id={`${id}-field`}
            title={texts.searchIn}
            value={state.field}
            emptyLabel={texts.everything}
            editable
            onChange={(field) => onChange({ ...state, field })}
            tagClass="inline-flex items-center gap-1 shrink-0 min-h-8 px-2 border-0 border-r border-amber-600/30 rounded-l-md bg-transparent text-neutral-300 hover:text-[#f5b841] font-mono text-[10px] font-semibold uppercase tracking-[0.06em] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            options={[{ value: "all", label: texts.everything, hint: texts.everythingHint, icon: <Search className="w-4 h-4 text-neutral-400" /> },
              ...searchFields.map((f) => ({ value: f.value, label: f.label, icon: <Search className="w-4 h-4 text-neutral-400" /> }))]}
          />
          <input
            id={`${id}-search`}
            type="search"
            value={state.query}
            onChange={(e) => onChange({ ...state, query: e.target.value })}
            placeholder={texts.search}
            aria-label={`${texts.search}: ${fieldLabel}`}
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent border-0 py-2 pl-1 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-0"
          />
        </div>
        <button
          id={`${id}-open`}
          type="button"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className="shrink-0 inline-flex items-center gap-2 min-h-11 px-3.5 rounded-xl border border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-neutral-200 text-xs font-semibold cursor-pointer hover:border-[#f3d88c] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span className="hidden min-[381px]:inline">{texts.filters}</span>
          {n > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#d4af37] text-[#1a1105] font-mono text-[11px] font-bold leading-5 text-center">{n}</span>}
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label={texts.activeFilters} id={`${id}-chips`}>
          {chips.map((chip) => (
            <span key={`${chip.section}-${chip.value}`} className="inline-flex items-center gap-1 min-h-7 pl-2.5 pr-1 rounded-full border border-[#e5a93c] bg-[rgba(42,29,16,0.9)] text-[#f5b841] text-[11px] font-semibold">
              <span className="break-words">{chip.label}</span>
              <button type="button" id={`${id}-unset-${chip.section}-${chip.value}`} onClick={() => unset(chip.section, chip.value)}
                aria-label={fill(texts.removeFilter, { label: chip.label })}
                className={`${HIT} w-5 h-5 grid place-items-center rounded-full hover:bg-white/10 cursor-pointer`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-neutral-500 font-mono" aria-live="polite" id={`${id}-summary`}>
        {fill(texts.results, { n: shown, total, field: sortLabel.toLowerCase(), dir: state.dir === "asc" ? texts.asc.toLowerCase() : texts.desc.toLowerCase() })}{notes}
      </p>

      {open && (
        <FilterSheet id={`${id}-sheet`} state={state} sections={sections} sortFields={sortFields} defaultSort={defaultSort}
          countFor={countFor} texts={texts} onClose={() => setOpen(false)}
          onApply={(next) => { setOpen(false); onChange(normalized(next, sections)); }} />
      )}
    </div>
  );
}

function FilterSheet({ id, state, sections, sortFields, defaultSort, countFor, texts, onClose, onApply }: {
  id: string; state: FilterState; sections: FilterSection[]; sortFields: SortField[]; defaultSort: { sort: string; dir: SortDirection };
  countFor: (state: FilterState) => number; texts: FilterTexts; onClose: () => void; onApply: (next: FilterState) => void;
}) {
  const [phone] = useState(() => window.innerWidth < PHONE);
  const [draft, setDraft] = useState<FilterState>(state);
  const [page, setPage] = useState<"main" | "sort">("main");
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useLayoutEffect(() => {
    opener.current = document.activeElement;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; (opener.current as HTMLElement | null)?.focus?.(); };
  }, []);
  useEffect(() => {
    box.current?.querySelector<HTMLElement>(page === "sort" ? "input" : "[data-sortpage]")?.focus();
  }, [page]);
  // The phone's back button closes the sheet (Controls, rules for every control): one history
  // entry while it is open; leaving goes back through it, and popstate then closes or applies.
  const pushed = useRef(false);
  const pending = useRef<(() => void) | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    try {
      if ((history.state as { filterSheet?: string } | null)?.filterSheet !== PAGE_TOKEN) history.pushState({ ...(history.state ?? {}), filterSheet: PAGE_TOKEN }, "");
      pushed.current = true;
    } catch { pushed.current = false; }
    const onPop = () => { pushed.current = false; const run = pending.current; pending.current = null; (run ?? closeRef.current)(); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const leave = (then?: () => void) => {
    if (pushed.current) { pending.current = then ?? null; try { history.back(); return; } catch { /* closes below */ } }
    (then ?? closeRef.current)();
  };
  useEffect(() => {
    const away = () => leave();
    window.addEventListener("resize", away);
    return () => window.removeEventListener("resize", away);
  }, []);

  const toggle = (section: FilterSection, value: string) => setDraft((d) => {
    const list = selectionOf(d, section);
    return { ...d, selected: { ...d.selected, [section.id]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] } };
  });
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); if (page === "sort") setPage("main"); else leave(); return; }
    if (e.key === "Tab" && box.current) {
      const focusable = Array.from(box.current.querySelectorAll<HTMLElement>("button:not([disabled]), input"));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  };
  const results = countFor(normalized(draft, sections));
  const row = "flex items-center gap-3 w-full min-h-11 px-2.5 py-1.5 rounded-[10px] border border-transparent text-left text-neutral-100 hover:bg-white/5 hover:border-amber-600/30 focus:outline-none focus-visible:bg-white/5 focus-visible:border-amber-600/40 cursor-pointer";
  const groupTitle = "font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 px-2.5 pt-3 pb-1";
  const fields = sortFields.filter((f) => fold(f.label).includes(fold(query)));

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" onPointerDown={(e) => { e.preventDefault(); leave(); }} aria-hidden="true" />
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
          <h3 id={`${id}-title`} className="flex-1 font-magic text-[13px] font-bold uppercase tracking-[0.1em] text-amber-400">{texts.filters}</h3>
          <button type="button" id={`${id}-close`} onClick={() => leave()} aria-label={texts.close}
            className="w-8 h-8 grid place-items-center rounded-md text-neutral-400 hover:text-neutral-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto py-2 content-start">
          {page === "sort" ? (
            <div className="grid gap-0.5">
              <button type="button" id={`${id}-back`} onClick={() => setPage("main")} className={row}>
                <ChevronLeft className="w-4 h-4 text-amber-400" /><span className="text-[13px] font-semibold">{texts.back}</span>
              </button>
              <label className="my-1.5 mx-0.5 flex items-center gap-2 px-2.5 min-h-10 rounded-lg border border-amber-600/50 bg-neutral-950/40 focus-within:border-amber-500">
                <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                <input id={`${id}-sort-search`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={texts.searchField}
                  aria-label={texts.searchField} autoComplete="off"
                  className="flex-1 min-w-0 bg-transparent border-0 p-0 text-sm text-neutral-100 focus:outline-none focus:ring-0" />
              </label>
              <div role="radiogroup" aria-label={texts.sortBy} className="grid gap-0.5">
                {fields.length ? fields.map((f) => (
                  <button key={f.value} type="button" role="radio" aria-checked={draft.sort === f.value} id={`${id}-sort-${f.value}`} className={row}
                    onClick={() => { setDraft((d) => ({ ...d, sort: f.value, dir: f.descFirst ? "desc" : "asc" })); setPage("main"); }}>
                    <span className="flex-1 text-[13px] font-semibold">{f.label}</span>
                    {draft.sort === f.value && <Check className="w-4 h-4 text-[#f5b841]" />}
                  </button>
                )) : <p className="py-5 text-center text-sm text-neutral-400">{fill(texts.noField, { q: query })}</p>}
              </div>
            </div>
          ) : (
            <>
              <div className="pb-2 border-b border-violet-500/10">
                <div className={groupTitle}>{texts.sortBy}</div>
                <button type="button" data-sortpage id={`${id}-sortpage`} onClick={() => { setQuery(""); setPage("sort"); }} className={row}>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold">{sortFields.find((f) => f.value === draft.sort)?.label}</span>
                    <span className="block text-[11px] text-neutral-400">{fill(texts.fieldCount, { n: sortFields.length })}</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </button>
                <div className="px-1.5 pt-1">
                  <Segmented id={`${id}-dir`} full label={texts.direction} value={draft.dir} onChange={(dir) => setDraft((d) => ({ ...d, dir }))}
                    options={[{ value: "asc" as const, label: texts.asc, id: `${id}-dir-asc` }, { value: "desc" as const, label: texts.desc, id: `${id}-dir-desc` }]} />
                </div>
              </div>
              {sections.map((section) => (
                <div key={section.id} className="pb-2 border-b border-violet-500/10 last:border-b-0" role="group" aria-labelledby={`${id}-section-${section.id}`}>
                  <div className={groupTitle} id={`${id}-section-${section.id}`}>{section.title}</div>
                  {section.options.map((option) => {
                    const on = selectionOf(draft, section).includes(option.value);
                    return (
                      <button key={option.value} type="button" role="checkbox" aria-checked={on} id={`${id}-${section.id}-${option.value}`}
                        onClick={() => toggle(section, option.value)} className={row}>
                        <span aria-hidden="true" className={`w-5 h-5 shrink-0 rounded-[5px] border-[1.5px] grid place-items-center ${on
                          ? "bg-[rgba(42,29,16,0.9)] border-[#e5a93c] text-[#f5b841]" : "bg-neutral-950/60 border-amber-600/50 text-transparent"}`}>
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </span>
                        {option.icon}
                        <span className="flex-1 min-w-0 text-[13px] font-semibold break-words">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2.5 border-t border-amber-600/25 shrink-0">
          <button type="button" id={`${id}-clear`} onClick={() => { setDraft((d) => ({ ...d, selected: {}, ...defaultSort })); setPage("main"); }}
            className="min-h-10 px-3.5 rounded-lg border border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-neutral-200 text-xs font-semibold cursor-pointer hover:border-[#f3d88c] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            {texts.clear}
          </button>
          <button type="button" id={`${id}-apply`} onClick={() => leave(() => onApply(draft))}
            className="min-h-10 px-3.5 rounded-lg border border-[#9b7424] bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] text-[#1a1105] text-xs font-bold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            {results === 1 ? texts.showOne : fill(texts.show, { n: results })}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
