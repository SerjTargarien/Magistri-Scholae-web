// What the open sheet's store needs the viewer to know (R3.4 switch): changes
// waiting for the connection, a change someone else made to the same field
// (keep mine or theirs), a change the server refused, and drafts discarded
// because the field became read-only. Hidden while everything is saved, so it
// never covers the screens. R3.5 gives it its final design.
import { SAVE_STATUS_TEXT, type Language } from "../localization";
import type { SheetStore } from "../store/sheetStore";

const show = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value));

export function SaveStatus({ store, lang }: { store?: SheetStore; lang: Language }) {
  if (!store) return null;
  const t = SAVE_STATUS_TEXT[lang];
  const { state, conflicts, error, problems, dropped } = store;
  if (state !== "offline" && state !== "conflict" && state !== "error" && !problems.length && !dropped.length) return null;
  return <aside id="save-status" role="status" aria-live="polite"
    className="fixed bottom-5 left-5 z-50 max-w-md space-y-2 p-4 rounded-xl border-2 border-amber-500/40 bg-neutral-950/95 text-xs text-amber-100 shadow-2xl">
    {state === "offline" && <p>{t.offline}{store.pending.size ? ` (${store.pending.size})` : ""}</p>}
    {conflicts.length > 0 && <div className="space-y-2"><p>{t.conflict}</p>{conflicts.map(c =>
      <div key={c.path} className="rounded-lg border border-amber-500/20 p-2">
        <p className="font-mono text-amber-300">{c.path}</p>
        <p>{t.mine}: {show(c.mine)}</p><p>{t.theirs}: {show(c.theirs)}</p>
        <div className="flex gap-2 pt-1">
          <button type="button" className="px-2 py-1 rounded border border-amber-500/40 hover:bg-amber-900/40" onClick={() => store.resolve(c.path, "mine")}>{t.keepMine}</button>
          <button type="button" className="px-2 py-1 rounded border border-neutral-600 hover:bg-neutral-800" onClick={() => store.resolve(c.path, "theirs")}>{t.keepTheirs}</button>
        </div>
      </div>)}</div>}
    {state === "error" && error && <p className="text-rose-300">{t.refused}: {[error.code, error.path, error.rule].filter(Boolean).join(" · ")}
      {" "}<button type="button" className="underline" onClick={() => void store.flush()}>{t.retry}</button></p>}
    {problems.length > 0 && <p className="text-rose-300">{t.notAccepted}: {problems.map(p => `${p.path} (${p.rule}${p.limit === undefined ? "" : ` ${show(p.limit)}`})`).join(", ")}</p>}
    {dropped.length > 0 && <p>{t.dropped}: {dropped.join(", ")}</p>}
  </aside>;
}
