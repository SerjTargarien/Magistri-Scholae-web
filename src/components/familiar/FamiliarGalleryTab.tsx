/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The familiar sheet's "galeria" tab, moved verbatim out of FamiliarDetail.tsx (R3.4).
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

export function FamiliarGalleryTab({ ctx }: { ctx: FamiliarContext }) {
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
          {/* Gallery upload header */}
          <div
            className={`glass-panel p-5 sm:p-6 rounded-2xl ${
              isAcademy ? "border border-amber-500/25" : "border border-emerald-500/20"
            }`}
          >
            <h2 className="font-magic text-sm uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              {t.uploadGallery}
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Subir Imagen Local</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAddGalleryImage}
                />
              </label>

              <div className="w-full flex-1 flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://... o pegar URL de imagen"
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  disabled={!pastedUrl.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl text-xs font-mono uppercase cursor-pointer transition-colors"
                >
                  {t.add}
                </button>
              </div>
            </div>

            {galleryError && (
              <div className="mt-2 text-xs text-rose-400 font-mono">{galleryError}</div>
            )}
          </div>

          {/* Gallery grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(familiar.galleryImages || []).length === 0 ? (
              <div className="col-span-full glass-panel p-12 text-center text-neutral-500 font-serif italic text-xs rounded-2xl border border-neutral-800">
                {t.labelGalleryEmpty}
              </div>
            ) : (
              (familiar.galleryImages || []).map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden group bg-neutral-950 border border-neutral-800 shadow-lg"
                >
                  <img
                    src={imgUrl}
                    alt={`Recuerdo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(imgUrl)}
                      className="p-2 rounded-full bg-neutral-900/90 text-neutral-200 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryImage(idx)}
                      className="p-2 rounded-full bg-rose-950/90 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
  );
}
