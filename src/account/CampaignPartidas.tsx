/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Partidas de la campaña» (R4 b; product-design.md section 10b): the Máster names the
// campaign's tables, renames them and removes them. Only the Máster sees partidas, and he
// chooses each partida's characters only here («Elegir personajes», owner, 15 November
// 2026). A character may be in several partidas; one in none is common to all. Opened from
// the main list until the Biblioteca (R5). Each change is saved at once; removing asks first.
import { useState } from "react";
import { ArrowLeft, Dices, Plus, Users, X } from "lucide-react";
import type { ApiTable } from "../contracts/api-v1";
import { PARTIDAS_TEXT, TRANSLATIONS, type Language } from "../localization";
import { ApiFailure } from "../remote/client";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { HIT } from "../components/TagMenu";
import { Picker, pickerTexts } from "../components/Picker";

export interface CampaignPartidasProps {
  lang: Language;
  partidas: ApiTable[];
  /** How many characters each partida holds (by partida id). */
  counts: Record<string, number>;
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  /** The characters a partida can hold (confirmed, not archived), with who plays each. */
  characters: { id: string; name: string; player: string; tableIds: string[] }[];
  /** The partida holds exactly these characters; their other partidas stay. */
  onSetCharacters: (tableId: string, characterIds: string[]) => Promise<void>;
  onShowToast: (type: "success" | "error", text: string) => void;
  onBack: () => void;
}

const inputClass = "w-full text-xs bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none";

export function CampaignPartidas({ lang, partidas, counts, onCreate, onRename, onRemove, characters, onSetCharacters, onShowToast, onBack }: CampaignPartidasProps) {
  const t = TRANSLATIONS[lang];
  const p = PARTIDAS_TEXT[lang];
  const [names, setNames] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [removing, setRemoving] = useState<ApiTable | null>(null);
  const [choosing, setChoosing] = useState<ApiTable | null>(null);
  /** Each character with who plays it and the other partidas it is in. */
  const detailOf = (c: CampaignPartidasProps["characters"][number], table: ApiTable) => {
    const others = partidas.filter(x => x.id !== table.id && c.tableIds.includes(x.id)).map(x => x.name);
    return others.length ? p.alsoIn.replace("{player}", c.player).replace("{partidas}", others.join(", ")) : c.player;
  };
  const [busy, setBusy] = useState(false);

  const countText = (n: number) => (n === 0 ? p.noCharacters : n === 1 ? p.oneCharacter : p.characters.replace("{n}", String(n)));
  /** Runs a change; a refusal is said plainly and the typed name goes back to the saved one. */
  const run = async (change: () => Promise<void>, onFail?: () => void) => {
    setBusy(true);
    try { await change(); }
    catch (e) {
      const code = e instanceof ApiFailure ? e.code : "";
      onShowToast("error", code === "duplicate_table" ? p.duplicate : code === "too_many_items" ? p.full : p.failed);
      onFail?.();
    } finally { setBusy(false); }
  };
  const rename = (table: ApiTable) => {
    const typed = names[table.id];
    if (typed === undefined) return;
    const clear = () => setNames(({ [table.id]: _, ...rest }) => rest);
    if (!typed.trim() || typed.trim() === table.name) { clear(); return; }
    void run(async () => { await onRename(table.id, typed.trim()); clear(); }, clear);
  };
  const add = () => {
    const name = newName.trim();
    if (name) void run(async () => { await onCreate(name); setNewName(""); });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 pb-16" id="campaign-partidas-screen">
      <div className="flex justify-between items-center mb-6 border-b border-violet-500/15 pb-4 gap-3">
        <button id="btn-campaign-partidas-back" onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-amber-400 bg-neutral-900/60 hover:bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/40 transition-all font-mono cursor-pointer">
          <ArrowLeft className="w-4 h-4" />{t.back}
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <Dices className="w-5 h-5 text-amber-500 shrink-0" />
          <h1 className="font-magic text-base md:text-2xl text-neutral-100 uppercase tracking-widest glow-amber text-right">{p.title}</h1>
        </div>
      </div>
      <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-6">{p.intro}</p>

      <div className="glass-panel p-5 rounded-xl border border-violet-500/15" id="partidas-list">
        {partidas.length ? (
          <ul className="space-y-2">
            {partidas.map(table => (
              <li key={table.id} id={`partida-${table.id}`} className="flex items-center gap-3 bg-neutral-950/30 border border-neutral-900 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <input
                    id={`input-partida-name-${table.id}`}
                    type="text"
                    maxLength={60}
                    aria-label={p.name}
                    value={names[table.id] ?? table.name}
                    disabled={busy}
                    onChange={e => setNames(prev => ({ ...prev, [table.id]: e.target.value }))}
                    onBlur={() => rename(table)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
                    className={inputClass}
                  />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-[10px] font-mono text-neutral-500">{countText(counts[table.id] ?? 0)}</span>
                    <button type="button" id={`btn-partida-characters-${table.id}`} disabled={busy} aria-haspopup="dialog" onClick={() => setChoosing(table)}
                      className="inline-flex items-center gap-1.5 min-h-8 px-2.5 rounded-lg border border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-amber-300 text-[11px] font-semibold cursor-pointer hover:border-[#f3d88c] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50">
                      <Users className="w-3.5 h-3.5 shrink-0" />{p.choose}
                    </button>
                  </div>
                </div>
                <button type="button" id={`btn-remove-partida-${table.id}`} disabled={busy} title={p.remove} aria-label={`${p.remove}: ${table.name}`}
                  onClick={() => setRemoving(table)}
                  className={`${HIT} w-7 h-7 shrink-0 flex items-center justify-center rounded text-neutral-500 hover:text-rose-400 cursor-pointer disabled:opacity-50`}>
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-neutral-500 italic">{p.empty}</p>}

        <form className="flex gap-2 mt-4 max-w-md" onSubmit={e => { e.preventDefault(); add(); }}>
          <input id="input-new-partida" type="text" maxLength={60} placeholder={p.newPartida} aria-label={p.newPartida}
            value={newName} onChange={e => setNewName(e.target.value)} className={inputClass} />
          <button id="btn-add-partida" type="submit" disabled={busy || !newName.trim()}
            className="px-3 py-1.5 bg-violet-900 border border-violet-500/35 hover:bg-violet-800 text-violet-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <Plus className="w-3 h-3" /><span className="text-[10px]">{p.add}</span>
          </button>
        </form>
      </div>

      {choosing && (
        <Picker
          id="partida-characters"
          title={choosing.name}
          intro={<p className="text-xs text-neutral-400 leading-relaxed">{p.chooseIntro}</p>}
          multiple
          items={characters.map(c => ({ id: c.id, label: c.name, detail: detailOf(c, choosing) }))}
          selected={characters.filter(c => c.tableIds.includes(choosing.id)).map(c => c.id)}
          onDone={ids => { const table = choosing; setChoosing(null); void run(() => onSetCharacters(table.id, ids)); }}
          onClose={() => setChoosing(null)}
          texts={pickerTexts(t)}
        />
      )}

      {removing && (
        <ConfirmDialog
          id="remove-partida"
          title={p.remove}
          message={(counts[removing.id] ? p.removeText : p.removeEmpty).replace("{name}", removing.name).replace("{count}", countText(counts[removing.id] ?? 0))}
          confirmLabel={p.removeConfirm}
          cancelLabel={p.cancel}
          onConfirm={() => { const table = removing; setRemoving(null); void run(() => onRemove(table.id)); }}
          onCancel={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
