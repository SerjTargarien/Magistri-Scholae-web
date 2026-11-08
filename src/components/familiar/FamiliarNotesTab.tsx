/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The familiar sheet's "notas" tab, moved verbatim out of FamiliarDetail.tsx (R3.4).
import React, { useState, useRef } from "react";
import { Familiar, Character, VisualStyle, JournalNote } from "../../types";
import { Language, TRANSLATIONS } from "../../localization";
import { storage } from "../../storage";
import { referencesCharacter } from "../../storage/backup";
import { FiligreeCorner, CompassStarDivider } from "../AcademyOrnaments";
import { HouseCrest } from "../HouseCrest";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../utils/imageCompressor";
import {
  ArrowLeft,
  Edit,
  Trash2,
  PawPrint,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash,
  X,
  Maximize2,
  Check,
  Upload,
  User,
  Sparkles,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
} from "lucide-react";

import type { FamiliarContext } from "./useFamiliarDetail";

export function FamiliarNotesTab({ ctx }: { ctx: FamiliarContext }) {
  const {
    lang, visualStyle, familiar, characters, onBack, onEditInEditor, onDelete, onUpdateFamiliar, onSelectCharacter,
    onBondMaster, onShowToast, t, isAcademy, activeTab, setActiveTab, isQuickEditing, setIsQuickEditing, editNombre,
    setEditNombre, editEspecie, setEditEspecie, editDescripcion, setEditDescripcion, editImageFit, setEditImageFit,
    newNoteTitle, setNewNoteTitle, newNoteContent, setNewNoteContent, editingNoteId, setEditingNoteId, editingNoteTitle,
    setEditingNoteTitle, editingNoteContent, setEditingNoteContent, lightboxImage, setLightboxImage, galleryError,
    setGalleryError, pastedUrl, setPastedUrl, avatarInputRef, cropImageSrc, setCropImageSrc, isCropperOpen,
    setIsCropperOpen, crop, setCrop, zoom, setZoom, croppedAreaPixels, setCroppedAreaPixels, isDeleteOpen,
    setIsDeleteOpen, isSelectMasterOpen, setIsSelectMasterOpen, linkedMaster, saveFamiliarToDB, handleSaveQuickEdit,
    handleAvatarChange, handleConfirmCrop, handleAddNote, handleSaveEditedNote, handleDeleteNote, handleAddGalleryImage,
    handleAddUrlImage, handleDeleteGalleryImage,
  } = ctx;
  return (
        <div className="space-y-6 animate-fade-in">
          {/* New note form */}
          <form
            onSubmit={handleAddNote}
            className={`glass-panel p-5 sm:p-6 rounded-2xl ${
              isAcademy ? "border border-amber-500/25" : "border border-emerald-500/20"
            }`}
          >
            <h2 className="font-magic text-sm uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t.addNote}
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder={t.placeholderNoteTitle}
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
              <textarea
                rows={3}
                placeholder={t.placeholderNoteContent}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none font-sans"
              />
              <div className="flex justify-end">
                <button
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

          {/* Notes List */}
          <div className="space-y-3">
            {(familiar.notasList || []).length === 0 ? (
              <div className="glass-panel p-8 text-center text-neutral-400 font-serif italic text-xs rounded-2xl border border-neutral-800">
                {t.emptyNotes}
              </div>
            ) : (
              (familiar.notasList || []).map((note) => (
                <div
                  key={note.id}
                  className="glass-panel p-4 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors space-y-2"
                >
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingNoteTitle}
                        onChange={(e) => setEditingNoteTitle(e.target.value)}
                        className="w-full bg-neutral-950 border border-amber-500/50 rounded p-2 text-xs font-mono text-neutral-100"
                      />
                      <textarea
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
                          {note.titulo}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-neutral-500">
                            {new Date(note.fecha).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteTitle(note.titulo);
                              setEditingNoteContent(note.contenido);
                            }}
                            className="p-1 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
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
