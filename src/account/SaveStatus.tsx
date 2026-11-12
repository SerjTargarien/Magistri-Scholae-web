// What the open sheet's store needs the viewer to know, in plain words (R3.5 step 1):
// changes waiting for the connection, a change someone else made to the same field
// (keep mine or theirs), a change that was not saved and why, and changes discarded
// because the field became read-only. Hidden while saving works (owner, 12 November
// 2026: only problems are shown), so it never covers the screens.
import { SAVE_STATUS_TEXT, type Language } from "../localization";
import type { SheetStore } from "../store/sheetStore";
import { describeValue, errorText, fieldLabel, problemText, retryable } from "./saveMessages";

/** Refusals the viewer can fix by editing the field again; the store then saves by itself. */
const FIXABLE = new Set(["field_too_long", "field_required", "field_out_of_range", "too_many_items", "invalid_field_value", "sheet_too_large"]);

const button = "px-2.5 py-1.5 rounded-lg border font-bold transition-colors cursor-pointer";

export function SaveStatus({ store, lang }: { store?: SheetStore; lang: Language }) {
  if (!store) return null;
  const t = SAVE_STATUS_TEXT[lang];
  const { state, conflicts, error, problems, dropped } = store;
  if (state !== "offline" && state !== "conflict" && state !== "error" && !problems.length && !dropped.length) return null;
  const kind = store.sheet.entityType;
  const unique = (items: string[]) => [...new Set(items)];
  return <aside id="save-status" role="status" aria-live="polite"
    className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 space-y-3 p-4 rounded-xl border-2 border-amber-500/40 bg-neutral-950/95 text-xs leading-relaxed text-amber-100 shadow-2xl break-words">
    {state === "offline" && <div>
      <p>{t.offline}</p>
      {store.pending.size > 0 && <p className="text-amber-200/80">{t.waiting.replace("{n}", String(store.pending.size))}</p>}
    </div>}

    {conflicts.length > 0 && <div className="space-y-2">
      <p>{t.conflict}</p>
      {conflicts.map(c => <div key={c.path} className="rounded-lg border border-amber-500/20 p-2 space-y-1">
        <p className="font-bold text-amber-300">{fieldLabel(kind, c.path, lang)}</p>
        <p><span className="text-amber-200/70">{t.mine}:</span> {describeValue(c.mine, lang)}</p>
        <p><span className="text-amber-200/70">{t.theirs}:</span> {describeValue(c.theirs, lang)}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className={`${button} border-amber-500/40 hover:bg-amber-900/40`} onClick={() => store.resolve(c.path, "mine")}>{t.keepMine}</button>
          <button type="button" className={`${button} border-neutral-600 hover:bg-neutral-800`} onClick={() => store.resolve(c.path, "theirs")}>{t.keepTheirs}</button>
        </div>
      </div>)}
    </div>}

    {state === "error" && error && <div className="space-y-1 text-rose-200">
      {!retryable(error.code) && <p className="font-bold">{t.notSaved}</p>}
      <p>{errorText(error, kind, lang)}</p>
      {FIXABLE.has(error.code) && <p className="text-rose-200/80">{t.fixHint}</p>}
      {/* «Reintentar» only where it can help: a lost connection, a server error, too many changes. */}
      {retryable(error.code) && <button type="button" id="btn-save-retry" className={`${button} border-rose-400/40 hover:bg-rose-900/40`} onClick={() => void store.flush()}>{t.retryNow}</button>}
    </div>}

    {problems.length > 0 && <div className="space-y-1 text-rose-200">
      <p className="font-bold">{t.notSaved}</p>
      {unique(problems.map(p => problemText(p, kind, lang))).map(text => <p key={text}>{text}</p>)}
      {problems.some(p => p.rule !== "notWritable") && <p className="text-rose-200/80">{t.fixHint}</p>}
    </div>}

    {dropped.length > 0 && <div className="space-y-2">
      <p>{t.dropped.replace("{fields}", unique(dropped.map(path => fieldLabel(kind, path, lang))).join(", "))}</p>
      <button type="button" id="btn-save-dropped-ok" className={`${button} border-amber-500/40 hover:bg-amber-900/40`} onClick={() => store.dismissDropped()}>{t.dismiss}</button>
    </div>}
  </aside>;
}
