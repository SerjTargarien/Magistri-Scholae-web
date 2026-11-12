/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Mis notas» (product-design.md, Notes, rule 2): all of the viewer's private notes,
// newest written first, grouped by sheet, including notes about no sheet. Only their
// author sees them. A note about no sheet is moved by first choosing the sheet.
import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Lock, Plus } from "lucide-react";
import { NOTES_TEXT, TRANSLATIONS, type Language } from "../../localization";
import type { ApiSheetProjection } from "../../contracts/api-v1";
import type { NotesApi, PrivateNote } from "../../account/notes";
import type { SheetStore } from "../../store/sheetStore";
import { ConfirmDialog } from "../ConfirmDialog";
import { Picker, pickerTexts } from "../Picker";
import { NoteCard } from "./NoteCard";
import { MoveNoteDialog, journalName } from "./MoveNoteDialog";

const nameOf = (sheet: ApiSheetProjection) => String((sheet.fields as { nombre?: string }).nombre ?? "");
const canAddToJournal = (sheet: ApiSheetProjection) => sheet.capabilities.collectionPaths.includes("notasList");

export function MyNotes({ lang, notes, sheets, storeFor, onOpenSheet, onBack }: {
  lang: Language;
  notes: NotesApi;
  /** The characters and familiars the viewer can open. */
  sheets: ApiSheetProjection[];
  /** The store of a sheet, to move a note into its journal. */
  storeFor: (sheet: ApiSheetProjection) => SheetStore;
  onOpenSheet: (sheet: ApiSheetProjection) => void;
  onBack: () => void;
}) {
  const t = NOTES_TEXT[lang];
  const tt = TRANSLATIONS[lang];
  const [list, setList] = useState<PrivateNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PrivateNote | null>(null);
  const [choosing, setChoosing] = useState<PrivateNote | null>(null);
  const [moving, setMoving] = useState<{ note: PrivateNote; store: SheetStore } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    notes.list().then(items => { setList(items); setError(null); }).catch(() => setError(t.loadFailed));
  }, [notes, t.loadFailed]);
  useEffect(load, [load]);

  const replace = (note: PrivateNote) => setList(old => (old ?? []).map(n => (n.id === note.id ? note : n)));
  const drop = (id: string) => setList(old => (old ?? []).filter(n => n.id !== id));
  const sheetById = (id: string | null) => (id ? sheets.find(s => s.id === id) : undefined);

  const add = async () => {
    try {
      const note = await notes.create(null);
      setList(old => [note, ...(old ?? [])]);
      setEditing(note.id);
      setMessage(null);
    } catch { setError(t.saveFailed); }
  };
  const startMove = (note: PrivateNote) => {
    const sheet = sheetById(note.sheetId);
    if (sheet) setMoving({ note, store: storeFor(sheet) });
    else setChoosing(note);
  };

  // Groups in the order of their newest note; notes about no sheet first, then by sheet.
  const groups: { key: string; title: string; sheet?: ApiSheetProjection; items: PrivateNote[] }[] = [];
  for (const note of list ?? []) {
    const key = note.sheetId ?? "";
    let group = groups.find(g => g.key === key);
    if (!group) {
      const sheet = sheetById(note.sheetId);
      group = { key, title: note.sheetId ? (sheet ? nameOf(sheet) || tt.noName : t.noSheet) : t.noSheet, sheet, items: [] };
      groups.push(group);
    }
    group.items.push(note);
  }
  const writable = sheets.filter(canAddToJournal);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 space-y-5" id="my-notes-screen">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#120e1c]/90 border border-[#c8a248]/35 p-2.5 rounded-xl">
        <button type="button" id="btn-my-notes-back" onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-[#f3e5c0] bg-gradient-to-b from-[#231c35] to-[#130f1e] border border-[#c8a248]/50 rounded-lg hover:border-[#f3d88c] min-h-[40px] cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-amber-400" />{t.back}
        </button>
        <button type="button" id="btn-new-unattached-note" onClick={() => void add()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-violet-500/45 bg-violet-950/60 text-violet-100 text-xs font-bold hover:bg-violet-900/70 min-h-[40px] cursor-pointer">
          <Plus className="w-4 h-4" />{t.newNoSheet}
        </button>
      </div>

      <section className="rounded-2xl border border-violet-500/35 bg-gradient-to-b from-violet-950/30 to-neutral-950/70 p-4 sm:p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="font-magic text-lg text-violet-100 tracking-wider flex items-center gap-2"><Lock className="w-5 h-5 text-violet-300" />{t.myNotes}</h2>
          <p className="text-xs text-violet-300/90">{t.myNotesIntro}</p>
        </div>
        {message && <p id="my-notes-message" role="status" className="text-sm text-emerald-300">{message}</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {list && list.length === 0 && <p className="text-sm text-neutral-500 italic text-center py-3">{t.noNotes}</p>}
        {groups.map(group => (
          <div key={group.key} className="space-y-2" id={`my-notes-group-${group.key || "none"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-amber-400 break-words">{group.title}</h3>
              {group.sheet && (
                <button type="button" onClick={() => onOpenSheet(group.sheet!)}
                  className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-100 underline cursor-pointer">
                  <ExternalLink className="w-3.5 h-3.5" />{t.openSheet}
                </button>
              )}
            </div>
            {group.items.map(note => {
              const sheet = sheetById(note.sheetId);
              return (
                <NoteCard
                  key={note.id}
                  note={note}
                  lang={lang}
                  notes={notes}
                  editing={editing === note.id}
                  canMove={note.sheetId ? !!sheet && canAddToJournal(sheet) : writable.length > 0}
                  onEdit={() => { setEditing(note.id); setMessage(null); }}
                  onDone={(latest, empty) => {
                    setEditing(null);
                    if (empty) { drop(latest.id); void notes.remove(latest).catch(() => load()); } else replace(latest);
                  }}
                  onChanged={replace}
                  onConflict={load}
                  onMove={() => startMove(note)}
                  onDelete={() => setDeleting(note)}
                />
              );
            })}
          </div>
        ))}
      </section>

      {choosing && (
        <Picker
          id="note-sheet-picker"
          title={t.whichSheet}
          intro={t.notTied}
          items={writable.map(sheet => ({ id: sheet.id, label: nameOf(sheet) || tt.noName, detail: journalName(sheet, lang) }))}
          onPick={id => { const sheet = sheets.find(s => s.id === id); const note = choosing; setChoosing(null); if (sheet) setMoving({ note, store: storeFor(sheet) }); }}
          onClose={() => setChoosing(null)}
          texts={pickerTexts(tt)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          id="delete-private-note"
          title={tt.confirmDeleteTitle}
          message={t.confirmDelete}
          confirmLabel={tt.delete}
          cancelLabel={tt.cancel}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const note = deleting;
            setDeleting(null);
            drop(note.id);
            notes.remove(note).catch(() => { setError(t.saveFailed); load(); });
          }}
        />
      )}
      {moving && (
        <MoveNoteDialog
          note={moving.note}
          store={moving.store}
          notes={notes}
          lang={lang}
          onClose={() => setMoving(null)}
          onMoved={text => { drop(moving.note.id); setMoving(null); setMessage(text); }}
        />
      )}
    </div>
  );
}
