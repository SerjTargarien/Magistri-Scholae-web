/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Mover a la bitácora» (product-design.md, Notes, rules 5–7): which journal, who will
// read the note there (by name, and a warning when the GM reveals it to the player),
// the entry's date and time (suggested: when the note was written; changeable with the
// app's own control), the note, and that the private note disappears. A note that does
// not fit the journal is refused by the server's preview before anything moves.
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight } from "lucide-react";
import { NOTES_TEXT, TRANSLATIONS, type Language } from "../../localization";
import type { ApiSheetProjection, NotePromotionPreview } from "../../contracts/api-v1";
import type { NotesApi, PrivateNote } from "../../account/notes";
import type { SheetStore } from "../../store/sheetStore";
import { ApiFailure } from "../../remote/client";
import { errorText } from "../../account/saveMessages";
import { DateTimeField } from "../DateTimeField";
import { noteTitle, noteWhen } from "./NoteCard";

/** The journal's name on a sheet: «Bitácora Celestial» or «Notas del Familiar». */
export const journalName = (sheet: ApiSheetProjection, lang: Language) =>
  sheet.entityType === "character" ? TRANSLATIONS[lang].labelNotesChronicleTitle : TRANSLATIONS[lang].tabFamiliarNotes;

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");

export function MoveNoteDialog({ note, store, notes, lang, onClose, onMoved }: {
  note: PrivateNote;
  store: SheetStore;
  notes: NotesApi;
  lang: Language;
  onClose: () => void;
  /** The note is now an entry of the sheet's journal; the message says where. */
  onMoved: (message: string) => void;
}) {
  const t = NOTES_TEXT[lang];
  const tt = TRANSLATIONS[lang];
  const kind = store.sheet.entityType;
  const sheetName = String((store.sheet.fields as { nombre?: string }).nombre ?? "") || tt.noName;
  const journal = journalName(store.sheet, lang);
  const [preview, setPreview] = useState<NotePromotionPreview | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [fecha, setFecha] = useState(note.createdAt);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    notes.preview(note, store)
      .then(p => { if (live) { setPreview(p); setFecha(p.fecha); } })
      .catch(e => { if (live) setRefusal(e instanceof ApiFailure ? errorText({ code: e.code, ...e.details }, kind, lang) : t.moveFailed); });
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  // Who reads the new entry: the GM always; the assigned player unless the journal is GM-only;
  // readers of a shared sheet when it is shared.
  const tier = preview?.audiences.contenido;
  const isGM = store.sheet.capabilities.isGM;
  const player = String((store.sheet.fields as { jugador?: string }).jugador ?? "").trim();
  const readers: string[] = [];
  if (tier) {
    readers.push(isGM ? t.readerYouGM : t.readerGM);
    if (tier !== "gm") readers.push(isGM ? (player ? fill(t.readerAssigned, { name: player }) : t.readerAssignedUnnamed) : t.readerYouPlayer);
    if (tier === "shared") readers.push(t.readerShared);
  }

  const move = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      // The chosen date is checked again by the server; a changed sheet or note needs a new preview.
      await notes.move(note, store, preview, fecha);
      onMoved(fill(t.moved, { journal, sheet: sheetName }));
    } catch (e) {
      setBusy(false);
      setRefusal(e instanceof ApiFailure && !["invalid_preview", "revision_conflict"].includes(e.code) ? errorText({ code: e.code, ...e.details }, kind, lang) : t.moveFailed);
      setPreview(null);
    }
  };

  const button = "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
  return createPortal(
    <div id="modal-move-note" role="dialog" aria-modal="true" aria-labelledby="modal-move-note-title"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="glass-panel w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6 rounded-2xl border border-amber-500/30 bg-[#0e0a16] shadow-2xl space-y-4">
        <h3 id="modal-move-note-title" className="font-magic text-base text-amber-300 font-bold border-b border-amber-500/10 pb-2 break-words">
          {fill(t.moveTitle, { journal, sheet: sheetName })}
        </h3>

        {!preview && !refusal && <p className="text-sm text-neutral-400">{t.checking}</p>}
        {refusal && <p id="move-note-refusal" className="text-sm text-rose-200">{refusal}</p>}

        {preview && <>
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-sm text-neutral-200 space-y-1" id="move-note-readers">
            <p>{t.readersIntro}</p>
            <ul className="space-y-0.5">{readers.map(r => <li key={r}>· {r}</li>)}</ul>
          </div>
          {isGM && tier !== "gm" && <p className="text-sm text-rose-200">{player ? fill(t.gmReveal, { name: player }) : t.gmRevealUnnamed}</p>}

          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400">{t.dateLabel}</p>
            <DateTimeField id="move-note-date" value={fecha} onChange={setFecha} lang={lang}
              texts={{ day: t.day, hour: t.hour, minute: t.minute, prevMonth: t.prevMonth, nextMonth: t.nextMonth }} />
            {fecha !== note.createdAt && (
              <button type="button" id="btn-move-note-written" onClick={() => setFecha(note.createdAt)}
                className="text-xs text-violet-300 underline cursor-pointer text-left">{fill(t.useWritten, { when: noteWhen(note.createdAt, lang) })}</button>
            )}
          </div>

          <div className="border-l-2 border-violet-400 pl-3 text-sm text-neutral-300 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
            <p className="font-semibold text-neutral-100">{noteTitle(note, lang)}</p>
            {note.content && <p>{note.content}</p>}
          </div>
          <p className="text-sm text-rose-200">{t.disappears}</p>
        </>}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          <button type="button" id="btn-move-note-cancel" disabled={busy} onClick={onClose}
            className={`${button} border border-neutral-700/60 text-neutral-300 hover:bg-neutral-800`}>{tt.cancel}</button>
          {preview && (
            <button type="button" id="btn-move-note-confirm" disabled={busy} onClick={() => void move()}
              className={`${button} text-[#1a1105] bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] border border-[#fce8a6] hover:brightness-110 disabled:opacity-60`}>
              <ArrowRight className="w-4 h-4" />{t.moveBtn}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
