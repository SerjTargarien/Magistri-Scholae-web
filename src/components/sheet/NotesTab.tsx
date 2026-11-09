/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "notas" tab, moved verbatim out of CharacterDetail.tsx (R3.4).
import React from "react";
import { Edit, Plus, Minus, Trash, Check } from "lucide-react";

import type { SheetContext } from "./useCharacterSheet";
import { journalTitle } from "../../model/journal";

export function NotesTab({ ctx }: { ctx: SheetContext }) {
  const {
    lang, character, t, writable, canAdd, canRemove, newClubName, setNewClubName, newItemName, setNewItemName,
    newItemQty, setNewItemQty, newNoteTitle, setNewNoteTitle, newNoteContent, setNewNoteContent, isQuickEditing,
    editingNoteId, setEditingNoteId, editingNoteTitle, setEditingNoteTitle, editingNoteContent, setEditingNoteContent,
    handleAddClub, handleRemoveClub, handleAddInventoryItem, handleChangeInventoryQty, handleRemoveInventoryItem,
    handleAddNote, handleStartEditNote, handleSaveEditedNote, handleRemoveNote,
  } = ctx;
  return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="detail-tab-notas">
            {/* Left side: Clubs & Inventory */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6">
              {/* Clubes */}
              <div className="space-y-3">
                <h4 className="font-magic text-[10px] text-amber-400 uppercase tracking-widest border-b border-violet-900/10 pb-1.5 font-bold flex items-center justify-between">
                  <span>🛡️ {t.clubes}</span>
                  <span className="text-[9px] font-mono text-neutral-500">{(character.clubesList || []).length}</span>
                </h4>

                {/* List First: Consultation Priority */}
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {character.clubesList && character.clubesList.length > 0 ? (
                    character.clubesList.map((cl) => (
                      <div
                        key={cl.id}
                        className="flex items-center justify-between bg-neutral-950/30 px-2.5 py-1.5 border border-neutral-900 rounded-lg group hover:border-violet-500/10 transition-all"
                      >
                        <span className="text-xs text-neutral-200 font-sans break-words max-w-[80%]">{cl.nombre}</span>
                        {isQuickEditing && canRemove("clubesList", cl.id) && (
                          <button
                            id={`btn-del-club-${cl.id}`}
                            onClick={() => handleRemoveClub(cl.id)}
                            className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer opacity-80 hover:opacity-100 transition-colors"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] font-mono text-neutral-600 italic select-none py-4 text-center">
                      {t.emptyClubs}
                    </p>
                  )}
                </div>

                {/* Add Club Input Form */}
                {isQuickEditing && canAdd("clubesList") && (
                  <div className="bg-neutral-950/20 p-2.5 border border-neutral-900/50 rounded-lg space-y-2 mt-2 animate-fade-in">
                    <input
                      id="input-new-club"
                      type="text"
                      placeholder={t.placeholderClubes}
                      value={newClubName}
                      onChange={(e) => setNewClubName(e.target.value)}
                      className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    />
                    <button
                      id="btn-add-club"
                      onClick={handleAddClub}
                      className="w-full py-1.5 bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/10 text-violet-300 hover:text-neutral-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.addClub}
                    </button>
                  </div>
                )}
              </div>

              {/* Equipo / Grimorio / Inventario */}
              <div className="space-y-3">
                <h4 className="font-magic text-[10px] text-amber-400 uppercase tracking-widest border-b border-violet-900/10 pb-1.5 font-bold flex items-center justify-between">
                  <span>🎒 {t.equipo}</span>
                  <span className="text-[9px] font-mono text-neutral-500">{(character.equipoList || []).length}</span>
                </h4>

                {/* List First: Consultation Priority */}
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {character.equipoList && character.equipoList.length > 0 ? (
                    character.equipoList.map((eq) => {
                      const cantidad = eq.cantidad ?? 1;
                      const canChangeQty = writable(`equipoList/${eq.id}/cantidad`);
                      return (
                      <div
                        key={eq.id}
                        className="flex items-center justify-between bg-neutral-950/30 px-2.5 py-1.5 border border-neutral-900 rounded-lg group hover:border-violet-500/10 transition-all gap-2"
                      >
                        <span className="text-xs text-neutral-200 font-mono break-all flex-1">{eq.nombre}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleChangeInventoryQty(eq.id, -1)}
                              disabled={!canChangeQty || cantidad <= 1}
                              className={`px-1.5 py-0.5 text-[10px] font-mono font-bold transition-colors ${
                                cantidad <= 1
                                  ? "text-neutral-700 cursor-not-allowed"
                                  : "text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 cursor-pointer"
                              }`}
                            >
                              -
                            </button>
                            <span className="text-[10px] px-1.5 text-amber-400 font-mono font-bold tabular-nums">
                              x{cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleChangeInventoryQty(eq.id, 1)}
                              disabled={!canChangeQty}
                              className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          {isQuickEditing && canRemove("equipoList", eq.id) && (
                            <button
                              id={`btn-del-item-${eq.id}`}
                              onClick={() => handleRemoveInventoryItem(eq.id)}
                              className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer opacity-80 hover:opacity-100 transition-colors"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      );
                    })
                  ) : (
                    <p className="text-[10px] font-mono text-neutral-600 italic select-none py-4 text-center">
                      {t.emptyInventory}
                    </p>
                  )}
                </div>

                {/* Add Inventory Item Input Form */}
                {isQuickEditing && canAdd("equipoList") && (
                  <div className="bg-neutral-950/20 p-2.5 border border-neutral-900/50 rounded-lg space-y-2 mt-2 animate-fade-in">
                    <input
                      id="input-new-item"
                      type="text"
                      placeholder={t.placeholderEquipo}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      {/* Quantity Input */}
                      <div className="flex items-center border border-neutral-800 bg-neutral-900 rounded-lg overflow-hidden h-8">
                        <button
                          id="btn-qty-minus"
                          onClick={() => setNewItemQty(q => Math.max(1, q - 1))}
                          className="px-2 h-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          id="input-new-item-qty"
                          type="number"
                          min="1"
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 text-center bg-transparent text-xs text-neutral-200 focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                        />
                        <button
                          id="btn-qty-plus"
                          onClick={() => setNewItemQty(q => q + 1)}
                          className="px-2 h-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        id="btn-add-inventory-item"
                        onClick={handleAddInventoryItem}
                        className="flex-1 py-1.5 h-8 bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/10 text-violet-300 hover:text-neutral-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t.addItem}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Student Notepad overhaul */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2 flex flex-col space-y-4">
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
                              type="text"
                              value={editingNoteTitle}
                              onChange={(e) => setEditingNoteTitle(e.target.value)}
                              placeholder={journalTitle({ fecha: note.fecha }, t.entryFrom, lang)}
                              className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                            />
                            <textarea
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
                    id="input-new-note-title"
                    type="text"
                    placeholder={t.placeholderNoteTitle}
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2.5 text-neutral-200 focus:outline-none"
                  />
                  <textarea
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
