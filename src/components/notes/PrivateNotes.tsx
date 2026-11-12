/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Notas privadas» on a sheet's notes tab, below the Bitácora (product-design.md, Notes):
// the viewer's own notes about this sheet, newest written first. Only their author
// ever reads them; they are not part of the sheet, so they need no edit mode.
import React, { useCallback, useEffect, useState } from "react";
import { Lock, Plus } from "lucide-react";
import { NOTES_TEXT, TRANSLATIONS, type Language } from "../../localization";
import type { NotesApi, PrivateNote } from "../../account/notes";
import type { SheetStore } from "../../store/sheetStore";
import { ConfirmDialog } from "../ConfirmDialog";
import { NoteCard } from "./NoteCard";
import { MoveNoteDialog } from "./MoveNoteDialog";

const byWritten = (a: PrivateNote, b: PrivateNote) => b.createdAt - a.createdAt;

export function PrivateNotes({ lang, notes, store }: { lang: Language; notes: NotesApi; store: SheetStore }) {
  const t = NOTES_TEXT[lang];
  const sheetId = store.sheet.id;
  const [list, setList] = useState<PrivateNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PrivateNote | null>(null);
  const [moving, setMoving] = useState<PrivateNote | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canMove = store.sheet.capabilities.collectionPaths.includes("notasList");

  const load = useCallback(() => {
    notes.list(sheetId).then(items => { setList(items); setError(null); }).catch(() => setError(t.loadFailed));
  }, [notes, sheetId, t.loadFailed]);
  useEffect(load, [load]);

  const replace = (note: PrivateNote) => setList(old => (old ?? []).map(n => (n.id === note.id ? note : n)));
  const drop = (id: string) => setList(old => (old ?? []).filter(n => n.id !== id));

  const add = async () => {
    try {
      const note = await notes.create(sheetId);
      setList(old => [note, ...(old ?? [])].sort(byWritten));
      setEditing(note.id);
      setMessage(null);
    } catch { setError(t.saveFailed); }
  };

  return (
    <section id="private-notes" className="mt-6 rounded-2xl border border-violet-500/35 bg-gradient-to-b from-violet-950/30 to-neutral-950/70 p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-magic text-xs text-violet-200 uppercase tracking-widest flex items-center gap-2">
          <Lock className="w-4 h-4 text-violet-300" />{t.privateTitle}
        </h3>
        <span className="text-xs text-violet-300/90 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />{store.sheet.capabilities.isGM ? t.onlyYouGM : t.onlyYou}
        </span>
      </div>

      {message && <p id="private-notes-message" role="status" className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {list && list.length === 0 && <p className="text-sm text-neutral-500 italic text-center py-2">{t.empty}</p>}
      {list?.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          lang={lang}
          notes={notes}
          editing={editing === note.id}
          canMove={canMove}
          onEdit={() => { setEditing(note.id); setMessage(null); }}
          onDone={(latest, empty) => {
            setEditing(null);
            // A note left with nothing in it goes away without asking: nothing is lost.
            if (empty) { drop(latest.id); void notes.remove(latest).catch(() => load()); } else replace(latest);
          }}
          onChanged={replace}
          onConflict={load}
          onMove={() => setMoving(note)}
          onDelete={() => setDeleting(note)}
        />
      ))}

      <button type="button" id="btn-new-private-note" onClick={() => void add()}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-violet-500/45 bg-violet-950/60 text-violet-100 text-xs font-bold hover:bg-violet-900/70 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
        <Plus className="w-4 h-4" />{t.newNote}
      </button>

      {deleting && (
        <ConfirmDialog
          id="delete-private-note"
          title={TRANSLATIONS[lang].confirmDeleteTitle}
          message={t.confirmDelete}
          confirmLabel={TRANSLATIONS[lang].delete}
          cancelLabel={TRANSLATIONS[lang].cancel}
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
          note={moving}
          store={store}
          notes={notes}
          lang={lang}
          onClose={() => setMoving(null)}
          onMoved={text => { drop(moving.id); setMoving(null); setMessage(text); }}
        />
      )}
    </section>
  );
}
