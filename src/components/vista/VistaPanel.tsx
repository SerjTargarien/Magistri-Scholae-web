/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The Máster's «Vista de jugadores» panel (7a; product-design.md 10d, approved demo). «Ahora» is
// what the players see, with the values captured when shown; it stays editable. On another
// sheet, «Preparado» is what that sheet will show next (kept on the server), and «Mostrar» puts
// it all on screen at once. One box adds a sheet's value or, when nothing matches, a line of text.
import React, { useId, useState } from "react";
import { AlignLeft, EyeOff, Image as ImageIcon, Monitor, RotateCcw, Search, X } from "lucide-react";
import type { ApiPlayerView, ApiSheetProjection, ApiViewSpec } from "../../contracts/api-v1";
import { VISTA_TEXT, type Language } from "../../localization";
import { choicesFor, describeSpec, itemLabel, matches, MAX_VIEW_ITEMS, MAX_VIEW_TEXT, valueText } from "../../account/vista";

const BUTTON = "inline-flex items-center justify-center gap-1.5 min-h-8 px-2.5 rounded-lg border text-[11px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
const QUIET = `${BUTTON} border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-neutral-200 hover:border-[#f3d88c]`;

function Row({ label, value, free, photo, removeLabel, onRemove, disabled, id }: {
  label: string; value: string; free?: boolean; photo?: boolean; removeLabel: string; onRemove: () => void; disabled: boolean; id: string;
}) {
  return (
    <li className="flex items-center gap-2.5 min-h-10 pl-2.5 pr-1 py-1 rounded-lg border border-violet-500/15 bg-neutral-950/35 min-w-0">
      {photo ? <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        : free ? <AlignLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        : <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-400 shrink-0 max-w-[45%] break-words">{label}</span>}
      <span className={`flex-1 min-w-0 break-words ${free ? "font-serif italic text-[15px] leading-snug" : "text-[13px]"}`}>{photo ? label : value}</span>
      <button type="button" id={id} disabled={disabled} onClick={onRemove} title={removeLabel} aria-label={removeLabel}
        className="w-8 h-8 grid place-items-center rounded-md text-neutral-500 hover:text-rose-400 cursor-pointer disabled:opacity-50 shrink-0"><X className="w-4 h-4" /></button>
    </li>
  );
}

/** One box: the sheet's values that are not on the list yet, or the typed words as a line of text. */
function Adder({ id, sheet, used, lang, disabled, onAdd }: {
  id: string; sheet?: ApiSheetProjection; used: ApiViewSpec[]; lang: Language; disabled: boolean; onAdd: (spec: ApiViewSpec) => void;
}) {
  const x = VISTA_TEXT[lang];
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const listId = useId();
  const full = used.length >= MAX_VIEW_ITEMS;
  const choices = sheet ? choicesFor(sheet, used, lang, x.portrait).filter(c => matches(c, query)) : [];
  const typed = query.trim().slice(0, MAX_VIEW_TEXT);
  const options = [...choices.slice(0, 8).map(c => ({ spec: c.spec, label: c.label, preview: c.preview, free: false })),
    ...(typed ? [{ spec: { kind: "text", value: typed } as ApiViewSpec, label: x.addText.replace("{text}", typed), preview: "", free: true }] : [])];
  const open = query.length > 0 && options.length > 0;
  const pick = (i: number) => { const o = options[i]; if (!o) return; onAdd(o.spec); setQuery(""); setSel(0); };
  return (
    <div className="relative">
      <label className="flex items-center gap-2 px-2.5 min-h-10 rounded-lg border border-amber-600/50 bg-neutral-950/40 focus-within:border-amber-500 focus-within:shadow-[0_0_0_2px_rgba(245,158,11,0.2)]">
        <Search className="w-4 h-4 text-neutral-400 shrink-0" />
        <span className="sr-only">{x.add}</span>
        <input id={id} type="text" role="combobox" aria-expanded={open} aria-controls={listId} autoComplete="off" maxLength={MAX_VIEW_TEXT}
          disabled={disabled || full} placeholder={full ? x.full : x.add} value={query}
          onChange={e => { setQuery(e.target.value); setSel(0); }}
          onKeyDown={e => {
            if (e.key === "ArrowDown" && options.length) { e.preventDefault(); setSel((sel + 1) % options.length); }
            else if (e.key === "ArrowUp" && options.length) { e.preventDefault(); setSel((sel - 1 + options.length) % options.length); }
            else if (e.key === "Enter" && open) { e.preventDefault(); pick(sel); }
            else if (e.key === "Escape") setQuery("");
          }}
          className="flex-1 min-w-0 bg-transparent border-0 py-2 text-[13px] text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-0 focus:shadow-none" />
      </label>
      {open && (
        // In the panel's flow (the panel scrolls on its own; a floating list would be cut off at its edge).
        <ul id={listId} role="listbox" className="mt-1 p-1.5 rounded-xl border border-[#c89d3c]/55 bg-[#150f22] shadow-[0_16px_40px_rgba(0,0,0,0.8)] grid gap-0.5 max-h-64 overflow-y-auto">
          {options.map((o, i) => (
            <li key={i} id={`${id}-option-${i}`} role="option" aria-selected={i === sel}
              onMouseDown={e => { e.preventDefault(); pick(i); }}
              className={`flex items-baseline gap-2 min-h-9 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer ${i === sel ? "bg-white/[0.07] outline outline-1 outline-[#c8a248]/35" : ""} ${o.free ? "italic text-neutral-400" : "text-neutral-100"}`}>
              <span className="break-words">{o.label}</span>
              {o.preview && <span className="text-xs text-neutral-400 min-w-0 break-words">{o.preview}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VistaPanel({ lang, view, nowSheet, openSheet, prepared, busy, linkActive, onNow, onHide, onPrepared, onShowPrepared, onReset }: {
  lang: Language;
  view: ApiPlayerView;
  /** The sheet that is showing, to add more of its values (when the Máster can read it). */
  nowSheet?: ApiSheetProjection;
  /** The sheet open now, when it is not the one showing: its «Preparado». */
  openSheet?: ApiSheetProjection;
  prepared?: ApiViewSpec[];
  busy: boolean;
  linkActive: boolean;
  onNow: (specs: ApiViewSpec[]) => void;
  onHide: () => void;
  onPrepared: (specs: ApiViewSpec[]) => void;
  onShowPrepared: () => void;
  onReset: () => void;
}) {
  const x = VISTA_TEXT[lang];
  const now = view.now;
  const nowName = now ? String((now.items.find(i => i.kind === "field" && i.path === "nombre") as { value?: string } | undefined)?.value ?? nowSheet?.fields.nombre ?? "") : "";
  return (
    <>
      <div className="grid gap-2" id="vista-now">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">{x.now}</span>
          {now && <span className="font-magic text-[13px] font-bold uppercase tracking-[0.06em] text-[#fce8a6] break-words">{nowName}</span>}
          {now && <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />{x.visible}</span>}
        </div>
        {now ? (
          <>
            <ul className="grid gap-1">
              {now.items.map((item, i) => {
                const label = item.kind === "photo" ? x.portrait : item.kind === "field" ? itemLabel(now.sheetKind, item.path, item.value, lang) : "";
                const value = item.kind === "field" ? valueText(item.path, item.value) : item.kind === "text" ? item.value : "";
                return <Row key={i} id={`vista-now-remove-${i}`} label={label} value={value} photo={item.kind === "photo"} free={item.kind === "text"} disabled={busy}
                  removeLabel={x.remove.replace("{item}", label || x.text)} onRemove={() => { const next = view.specs.filter((_, j) => j !== i); if (next.length) onNow(next); else onHide(); }} />;
              })}
            </ul>
            <Adder id="vista-now-add" sheet={nowSheet} used={view.specs} lang={lang} disabled={busy} onAdd={spec => onNow([...view.specs, spec])} />
            <div className="flex items-center gap-2 justify-between flex-wrap">
              <span className="text-xs text-neutral-400">{x.onlyThis}</span>
              <button type="button" id="btn-vista-hide" disabled={busy} onClick={onHide} className={`${BUTTON} border-rose-500/50 bg-[#4c1420] text-rose-100 hover:border-rose-300`}>
                <EyeOff className="w-3.5 h-3.5" />{x.hide}
              </button>
            </div>
          </>
        ) : <p className="text-xs text-neutral-400">{x.nothing}</p>}
        {!linkActive && <p className="text-xs text-amber-200/80 border-l-2 border-amber-500/60 pl-2.5">{x.noLink}</p>}
      </div>

      {openSheet && prepared && (
        <div className="grid gap-2 pt-3 border-t border-dashed border-[#c8a248]/35" id="vista-prepared">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">{x.prepared}</span>
            <span className="font-magic text-[13px] font-bold uppercase tracking-[0.06em] text-[#fce8a6] break-words">{String(openSheet.fields.nombre ?? "")}</span>
          </div>
          <ul className="grid gap-1">
            {prepared.map((spec, i) => {
              const d = describeSpec(openSheet, spec, lang, x.portrait);
              return <Row key={i} id={`vista-prepared-remove-${i}`} label={d.label} value={d.value} photo={spec.kind === "photo"} free={spec.kind === "text"} disabled={busy}
                removeLabel={x.remove.replace("{item}", d.label || x.text)} onRemove={() => onPrepared(prepared.filter((_, j) => j !== i))} />;
            })}
          </ul>
          <Adder id="vista-prepared-add" sheet={openSheet} used={prepared} lang={lang} disabled={busy} onAdd={spec => onPrepared([...prepared, spec])} />
          <div className="flex items-center gap-2 justify-between flex-wrap">
            <button type="button" id="btn-vista-reset" disabled={busy} onClick={onReset} title={x.resetTitle} className={QUIET}><RotateCcw className="w-3.5 h-3.5 text-amber-400" />{x.reset}</button>
            <button type="button" id="btn-vista-show-prepared" disabled={busy || prepared.length === 0} onClick={onShowPrepared}
              className={`${BUTTON} border-[#9b7424] bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] text-[#1a1105]`}>
              <Monitor className="w-3.5 h-3.5" />{x.show}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
