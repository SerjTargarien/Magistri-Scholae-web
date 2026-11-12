/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// One private note (product-design.md, Notes): reading view with «Editar», «Mover a la
// bitácora» and a bin; while editing, the title and text save as you type (like the
// sheet), always for their author, with no edit mode. Its date is when it was written.
import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { NOTES_TEXT, type Language } from "../../localization";
import type { NotesApi, PrivateNote } from "../../account/notes";
import { ApiFailure } from "../../remote/client";

const SAVE_DELAY = 600;
const locale = (lang: Language) => (lang === "es" ? "es-ES" : "en-GB");

/** «Nota del 12 nov» when the note has no title. */
export const noteTitle = (note: Pick<PrivateNote, "title" | "createdAt">, lang: Language) =>
  note.title.trim() || NOTES_TEXT[lang].noteOf.replace("{date}", new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short" }).format(note.createdAt));

/** «12 nov 2026, 18:40»: when a note was written. */
export const noteWhen = (ms: number, lang: Language) =>
  new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(ms);

const ACTION = "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400";

export function NoteCard({ note, lang, notes, editing, highlight, canMove, onEdit, onDone, onChanged, onConflict, onMove, onDelete }: {
  note: PrivateNote;
  lang: Language;
  notes: NotesApi;
  editing: boolean;
  highlight?: boolean;
  /** «Mover a la bitácora» is offered (the note is about a sheet whose journal the viewer can add to, or about none). */
  canMove: boolean;
  onEdit: () => void;
  /** Editing ends; `empty` when the note has neither title nor text (the list then drops it). */
  onDone: (latest: PrivateNote, empty: boolean) => void;
  onChanged: (note: PrivateNote) => void;
  /** The note changed on another device: the list reloads it. */
  onConflict: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const t = NOTES_TEXT[lang];
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(note);
  const draft = useRef({ title: note.title, content: note.content });
  const timer = useRef<number | undefined>(undefined);
  const saving = useRef<Promise<void> | null>(null);
  const again = useRef(false);

  useEffect(() => { if (!editing) { latest.current = note; setTitle(note.title); setContent(note.content); draft.current = { title: note.title, content: note.content }; } }, [note, editing]);

  /** Sends what changed since the last save; one save at a time, the latest text wins. */
  const save = async (): Promise<void> => {
    if (saving.current) { again.current = true; return saving.current; }
    const base = latest.current;
    const fields: { title?: string; content?: string } = {};
    if (draft.current.title !== base.title) fields.title = draft.current.title;
    if (draft.current.content !== base.content) fields.content = draft.current.content;
    if (!Object.keys(fields).length) return;
    saving.current = (async () => {
      try {
        const updated = await notes.update(base, fields);
        latest.current = updated;
        setError(null);
        onChanged(updated);
      } catch (e) {
        if (e instanceof ApiFailure && e.code === "revision_conflict") { setError(t.changedElsewhere); onConflict(); }
        else setError(t.saveFailed);
      }
    })();
    await saving.current;
    saving.current = null;
    if (again.current) { again.current = false; await save(); }
  };
  const schedule = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => void save(), SAVE_DELAY); };
  // Leaving the note (or the screen) saves what is left.
  useEffect(() => () => { window.clearTimeout(timer.current); void save(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const done = async () => {
    window.clearTimeout(timer.current);
    await save();
    onDone(latest.current, !draft.current.title.trim() && !draft.current.content.trim());
  };

  const frame = `rounded-xl border p-3 space-y-2 bg-neutral-950/50 ${highlight ? "border-violet-400 ring-2 ring-violet-500/40" : "border-violet-500/15"}`;
  if (editing) {
    return (
      <div className={frame} id={`private-note-${note.id}`}>
        <input
          id={`private-note-title-${note.id}`}
          type="text"
          maxLength={200}
          value={title}
          placeholder={t.titlePlaceholder}
          onChange={(e) => { setTitle(e.target.value); draft.current.title = e.target.value; schedule(); }}
          className="w-full text-sm bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-100 focus:outline-none"
        />
        <textarea
          id={`private-note-text-${note.id}`}
          maxLength={64000}
          rows={4}
          value={content}
          placeholder={t.textPlaceholder}
          onChange={(e) => { setContent(e.target.value); draft.current.content = e.target.value; schedule(); }}
          className="w-full text-sm bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-100 focus:outline-none min-h-[96px]"
        />
        {error && <p className="text-xs text-rose-300">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-neutral-500">{noteWhen(note.createdAt, lang)} · {t.savedAsYouType}</span>
          <button type="button" id={`btn-private-note-done-${note.id}`} onClick={() => void done()}
            className={`${ACTION} border-violet-500/40 bg-violet-950/60 text-violet-100 hover:bg-violet-900/70`}>{t.done}</button>
        </div>
      </div>
    );
  }
  return (
    <div className={frame} id={`private-note-${note.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="text-sm font-semibold text-neutral-100 break-words min-w-0">{noteTitle(note, lang)}</h4>
        <span className="text-[11px] font-mono text-neutral-500">{noteWhen(note.createdAt, lang)}</span>
      </div>
      <p className={`text-sm whitespace-pre-wrap break-words ${note.content ? "text-neutral-300" : "text-neutral-500 italic"}`}>{note.content || t.noText}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" id={`btn-private-note-edit-${note.id}`} onClick={onEdit}
          className={`${ACTION} border-neutral-700 text-neutral-300 hover:text-violet-200 hover:border-violet-500/50`}><Pencil className="w-3.5 h-3.5" />{t.edit}</button>
        {canMove && (
          <button type="button" id={`btn-private-note-move-${note.id}`} onClick={onMove}
            className={`${ACTION} border-amber-500/40 text-amber-200 hover:bg-amber-950/40`}><ArrowRight className="w-3.5 h-3.5" />{note.sheetId ? t.move : t.moveToAJournal}</button>
        )}
        <button type="button" id={`btn-private-note-delete-${note.id}`} onClick={onDelete} aria-label={t.delete} title={t.delete}
          className={`${ACTION} border-rose-500/30 text-rose-300 hover:bg-rose-950/40`}><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}
