/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "notas" tab («Bitácora»): the journal. Moved out of CharacterDetail.tsx in R3.4.
import React from "react";
import { Edit, Plus, Trash, Check } from "lucide-react";

import type { SheetContext } from "./useCharacterSheet";
import { journalTitle } from "../../model/journal";
import { limitAttrs } from "../LimitHint";

export function NotesTab({ ctx }: { ctx: SheetContext }) {
  const {
    lang, character, t, writable, canAdd, canRemove, newNoteTitle, setNewNoteTitle, newNoteContent, setNewNoteContent, isQuickEditing,
    editingNoteId, setEditingNoteId, editingNoteTitle, setEditingNoteTitle, editingNoteContent, setEditingNoteContent,
    handleAddNote, handleStartEditNote, handleSaveEditedNote, handleRemoveNote,
  } = ctx;
  return (
          <div className="grid grid-cols-1 gap-6 animate-fade-in" id="detail-tab-notas">

            {/* The Bitácora (glossary, product-design.md Words); clubs moved to Perfil, equipment to «Magia y equipo» */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 flex flex-col space-y-4">
              <div className="flex justify-between items-center border-b border-violet-950/10 pb-2">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span>📖</span> {t.labelNotesChronicleTitle}
                </h3>
                <span className="text-[9px] font-mono text-neutral-500 select-none bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                  {(character.notasList || []).length} {t.notesLabel}
                </span>
              </div>

              {/* List of custom notes - Order is consultation first, we render them neatly. Newest notes are at the top. */}
              <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1 flex-1">
                {character.notasList && character.notasList.length > 0 ? (
                  [...character.notasList].sort((a, b) => (b.fecha ?? 0) - (a.fecha ?? 0)).map((note) => {
                    const isEditingThisNote = editingNoteId === note.id;
                    const canEditNote = writable(`notasList/${note.id}/titulo`) || writable(`notasList/${note.id}/contenido`);
                    return (
                      <div
                        key={note.id}
                        className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-4 space-y-2 hover:border-violet-500/10 transition-all shadow-inner"
                      >
                        {isEditingThisNote ? (
                          <div className="space-y-2">
                            <input
                              {...limitAttrs("character", "notasList/x/titulo")}
                              type="text"
                              value={editingNoteTitle}
                              onChange={(e) => setEditingNoteTitle(e.target.value)}
                              placeholder={journalTitle({ fecha: note.fecha }, t.entryFrom, lang)}
                              className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                            />
                            <textarea
                              {...limitAttrs("character", "notasList/x/contenido")}
                              rows={4}
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              placeholder={t.placeholderNoteContent}
                              className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-200 rounded-lg text-[11px] font-mono font-bold cursor-pointer"
                              >
                                {t.cancel}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedNote(note.id)}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {t.saveNote}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <h4 className="text-xs font-semibold text-neutral-200 font-sans tracking-wide">
                                  {journalTitle(note, t.entryFrom, lang)}
                                </h4>
                                <span className="text-[9px] font-mono text-neutral-500">
                                  {new Date(note.fecha ?? 0).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {canEditNote && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditNote(note)}
                                  className="text-neutral-500 hover:text-amber-400 p-1 cursor-pointer hover:bg-neutral-900 rounded transition-colors"
                                  title={t.editNote}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                )}
                                {isQuickEditing && canRemove("notasList", note.id) && (
                                  <button
                                    id={`btn-del-note-${note.id}`}
                                    onClick={() => handleRemoveNote(note.id)}
                                    className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer hover:bg-neutral-900 rounded transition-colors"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-neutral-300 font-sans leading-relaxed whitespace-pre-wrap select-text selection:bg-violet-900 selection:text-white pt-1">
                              {note.contenido}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 text-center select-none">
                    <span className="text-xl mb-1.5">📝</span>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">
                      {t.emptyNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Form to Add New Note at the bottom */}
              {canAdd("notasList") && (
              <div className="bg-neutral-950/30 p-4 border border-violet-500/5 rounded-xl space-y-3 mt-auto">
                <h4 className="text-[10px] font-mono text-neutral-400 uppercase font-black tracking-wide flex items-center gap-1.5">
                  <span>🖋️</span> {t.addNote}
                </h4>
                <div className="space-y-2">
                  <input
                    {...limitAttrs("character", "notasList/x/titulo", { path: "notasList", count: (character.notasList ?? []).length })}
                    id="input-new-note-title"
                    type="text"
                    placeholder={t.placeholderNoteTitle}
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2.5 text-neutral-200 focus:outline-none"
                  />
                  <textarea
                    {...limitAttrs("character", "notasList/x/contenido", { path: "notasList", count: (character.notasList ?? []).length })}
                    id="input-new-note-content"
                    rows={4}
                    placeholder={t.placeholderNoteContent}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2.5 text-neutral-200 focus:outline-none min-h-[80px]"
                  />
                  <button
                    id="btn-add-note"
                    onClick={handleAddNote}
                    className="w-full py-2 bg-violet-900 hover:bg-violet-800 border border-violet-600 text-violet-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {t.registerNote}
                  </button>
                </div>
              </div>
              )}
            </div>

          </div>
  );
}
