/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The familiar sheet's "notas" tab (R3.4).
import React from "react";
import { Edit, FileText, Plus, Trash } from "lucide-react";

import type { FamiliarContext } from "./useFamiliarDetail";
import { journalTitle } from "../../model/journal";
import { limitAttrs } from "../LimitHint";

export function FamiliarNotesTab({ ctx }: { ctx: FamiliarContext }) {
  const {
    lang, notes, t, newNoteTitle, setNewNoteTitle, newNoteContent, setNewNoteContent, editingNoteId,
    setEditingNoteId, editingNoteTitle, setEditingNoteTitle, editingNoteContent, setEditingNoteContent, handleAddNote,
    handleSaveEditedNote, handleDeleteNote, canAddNote, canEditNote, canDeleteNote, isQuickEditing,
  } = ctx;
  return (
        <div className="space-y-6 animate-fade-in">
          {/* New note form */}
          {canAddNote && (
          <form
            onSubmit={handleAddNote}
            className={`glass-panel p-5 sm:p-6 rounded-2xl border border-amber-500/25`}
          >
            <h2 className="font-magic text-sm uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t.addNote}
            </h2>

            <div className="space-y-3">
              <input
                {...limitAttrs("familiar", "notasList/x/titulo", { path: "notasList", count: notes.length })}
                id="input-familiar-note-title"
                type="text"
                placeholder={t.placeholderNoteTitle}
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
              <textarea
                {...limitAttrs("familiar", "notasList/x/contenido", { path: "notasList", count: notes.length })}
                id="input-familiar-note-content"
                rows={3}
                placeholder={t.familiarNotePlaceholder}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none font-sans"
              />
              <div className="flex justify-end">
                <button
                  id="btn-familiar-add-note"
                  type="submit"
                  disabled={!newNoteTitle.trim() && !newNoteContent.trim()}
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-emerald-100 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.registerNote}</span>
                </button>
              </div>
            </div>
          </form>
          )}

          {/* Notes List */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="glass-panel p-8 text-center text-neutral-400 font-serif italic text-xs rounded-2xl border border-neutral-800">
                {t.familiarNotesEmpty}
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="glass-panel p-4 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors space-y-2"
                >
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <input
                        {...limitAttrs("familiar", "notasList/x/titulo")}
                        type="text"
                        value={editingNoteTitle}
                        placeholder={journalTitle({ fecha: note.fecha }, t.entryFrom, lang)}
                        onChange={(e) => setEditingNoteTitle(e.target.value)}
                        className="w-full bg-neutral-950 border border-amber-500/50 rounded p-2 text-xs font-mono text-neutral-100"
                      />
                      <textarea
                        {...limitAttrs("familiar", "notasList/x/contenido")}
                        rows={3}
                        value={editingNoteContent}
                        onChange={(e) => setEditingNoteContent(e.target.value)}
                        className="w-full bg-neutral-950 border border-amber-500/50 rounded p-2 text-xs text-neutral-100 font-sans"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded text-xs font-mono cursor-pointer"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditedNote(note.id)}
                          className="px-3 py-1 bg-amber-500 text-neutral-950 font-bold rounded text-xs font-mono cursor-pointer"
                        >
                          {t.save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-magic text-sm font-bold text-amber-300 uppercase tracking-wide">
                          {journalTitle(note, t.entryFrom, lang)}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-neutral-500">
                            {note.fecha !== undefined ? new Date(note.fecha).toLocaleDateString() : ""}
                          </span>
                          {canEditNote(note.id) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteTitle(note.titulo ?? "");
                              setEditingNoteContent(note.contenido ?? "");
                            }}
                            className="p-1 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          )}
                          {isQuickEditing && canDeleteNote(note.id) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 font-sans whitespace-pre-wrap leading-relaxed">
                        {note.contenido}
                      </p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
  );
}
