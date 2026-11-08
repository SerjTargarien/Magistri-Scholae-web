/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Familiar, Character, VisualStyle, JournalNote } from "../types";
import { Language, TRANSLATIONS } from "../localization";
import { storage } from "../storage";
import { referencesCharacter } from "../storage/backup";
import { FiligreeCorner, CompassStarDivider } from "./AcademyOrnaments";
import { HouseCrest } from "./HouseCrest";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/imageCompressor";
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

import { useFamiliarDetail } from "./familiar/useFamiliarDetail";
import { FamiliarProfileTab } from "./familiar/FamiliarProfileTab";
import { FamiliarNotesTab } from "./familiar/FamiliarNotesTab";
import { FamiliarGalleryTab } from "./familiar/FamiliarGalleryTab";

export interface FamiliarDetailProps {
  lang: Language;
  visualStyle?: VisualStyle;
  familiar: Familiar;
  characters: Character[];
  onBack: () => void;
  onEditInEditor: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateFamiliar: (updated: Familiar) => void;
  onSelectCharacter: (charId: number) => void;
  onBondMaster: (familiarId: string, charId: number | null) => void;
  onShowToast?: (type: "success" | "error", text: string) => void;
}

export const FamiliarDetail: React.FC<FamiliarDetailProps> = (screenProps) => {
  const ctx = useFamiliarDetail(screenProps);
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
    <div
      className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 font-sans select-none animate-fade-in"
      id="familiar-detail-container"
    >
      {/* Top Banner Navigation & Actions */}
      <div
        className={`p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/85 to-[#120924] ${
          isAcademy ? "border border-amber-500/30" : "border border-emerald-500/25"
        } mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-2xl`}
      >
        {isAcademy && (
          <>
            <FiligreeCorner position="tl" className="w-6 h-6 text-amber-500/40" />
            <FiligreeCorner position="tr" className="w-6 h-6 text-amber-500/40" />
            <FiligreeCorner position="bl" className="w-6 h-6 text-amber-500/40" />
            <FiligreeCorner position="br" className="w-6 h-6 text-amber-500/40" />
          </>
        )}

        <div className="z-10 flex items-center gap-3">
          <button
            type="button"
            id="btn-familiar-back"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-700/60 transition-colors flex items-center gap-1.5 text-xs font-mono uppercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.familiarBackToList}</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
                <PawPrint className="w-3.5 h-3.5" />
                {familiar.especie || t.familiarSpeciesShort}
              </span>
              <span className="text-neutral-500">·</span>
              <span className="text-xs font-mono text-neutral-400">
                {linkedMaster ? linkedMaster.nombre : t.familiarUnbound}
              </span>
            </div>
            <h1 className="font-magic text-2xl sm:text-3xl font-bold text-neutral-100 uppercase tracking-wider glow-amber truncate max-w-md">
              {familiar.nombre || t.noName}
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="z-10 flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Quick Edit Toggle */}
          <button
            type="button"
            id="btn-familiar-quick-edit"
            onClick={() => {
              if (isQuickEditing) {
                handleSaveQuickEdit();
              } else {
                setEditNombre(familiar.nombre);
                setEditEspecie(familiar.especie);
                setEditDescripcion(familiar.descripcion || "");
                setEditImageFit(familiar.imageFit || "cover");
                setIsQuickEditing(true);
              }
            }}
            className={`px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
              isQuickEditing
                ? "bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 border-neutral-700/60"
            }`}
          >
            {isQuickEditing ? <Check className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
            <span>{isQuickEditing ? t.save : t.familiarQuickEdit}</span>
          </button>

          {/* Full Editor */}
          <button
            type="button"
            id="btn-familiar-full-editor"
            onClick={() => onEditInEditor(familiar.id)}
            className="px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">{t.familiarEditInEditor}</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            id="btn-familiar-delete"
            onClick={() => setIsDeleteOpen(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-800 transition-colors cursor-pointer"
            title={t.delete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Modular tabs inherited from archetype registry) */}
      <div className="flex items-center gap-2 border-b border-neutral-800/80 mb-6 overflow-x-auto pb-1">
        <button
          id="familiar-tab-perfil"
          type="button"
          onClick={() => setActiveTab("perfil")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === "perfil"
              ? "border-emerald-400 text-emerald-300 bg-emerald-950/20 font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
          }`}
        >
          <PawPrint className="w-4 h-4 text-emerald-400" />
          {t.tabFamiliarProfile}
        </button>

        <button
          id="familiar-tab-notas"
          type="button"
          onClick={() => setActiveTab("notas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === "notas"
              ? "border-emerald-400 text-emerald-300 bg-emerald-950/20 font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          {t.tabFamiliarNotes}
          {(familiar.notasList?.length || 0) > 0 && (
            <span className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-300">
              {familiar.notasList?.length}
            </span>
          )}
        </button>

        <button
          id="familiar-tab-galeria"
          type="button"
          onClick={() => setActiveTab("galeria")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === "galeria"
              ? "border-emerald-400 text-emerald-300 bg-emerald-950/20 font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
          }`}
        >
          <ImageIcon className="w-4 h-4 text-violet-400" />
          {t.tabFamiliarGallery}
          {(familiar.galleryImages?.length || 0) > 0 && (
            <span className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-300">
              {familiar.galleryImages?.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Perfil y Vínculo Mágico */}
      {activeTab === "perfil" && <FamiliarProfileTab ctx={ctx} />}

      {/* Tab 2: Diario / Crónicas del Familiar (Inherited Notes) */}
      {activeTab === "notas" && <FamiliarNotesTab ctx={ctx} />}

      {/* Tab 3: Galería de Recuerdos (Inherited Gallery) */}
      {activeTab === "galeria" && <FamiliarGalleryTab ctx={ctx} />}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-neutral-800"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-neutral-900 text-neutral-200 hover:text-amber-400 border border-neutral-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Select Master / Bonding Modal */}
      {isSelectMasterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-magic text-sm font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                {t.familiarBondStudent}
              </h3>
              <button
                type="button"
                onClick={() => setIsSelectMasterOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 font-sans">
              {t.selectFamiliarToBond}
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {/* Option: Unbind */}
              <button
                type="button"
                onClick={() => {
                  onBondMaster(familiar.id, null);
                  setIsSelectMasterOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                  !familiar.studentId
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                    : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <span>{t.familiarBondNone}</span>
                {!familiar.studentId && <Check className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Characters list */}
              {characters.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => {
                    if (char.id) {
                      onBondMaster(familiar.id, char.id);
                      setIsSelectMasterOpen(false);
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                    referencesCharacter(familiar.studentId, char.id!)
                      ? "bg-amber-950/60 border-amber-500 text-amber-200"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {char.avatarImage ? (
                      <img
                        src={char.avatarImage}
                        alt={char.nombre}
                        className="w-7 h-7 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                    )}
                    <span className="truncate font-semibold">{char.nombre}</span>
                    <span className="text-[10px] text-neutral-500">
                      ({char.characterType === "adult_wizard" ? t.characterTypeAdultWizardShort : char.casa})
                    </span>
                  </div>
                  {referencesCharacter(familiar.studentId, char.id!) && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsSelectMasterOpen(false)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-xs font-mono uppercase cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (no window.confirm) */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border-2 border-rose-600/40 shadow-2xl space-y-4">
            <h3 className="font-magic text-base font-bold text-rose-400 uppercase tracking-wide">
              {t.familiarDeleteTitle}
            </h3>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              {t.familiarDeletePrompt}
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-xs font-mono uppercase cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  onDelete(familiar.id);
                }}
                className="px-4 py-2 bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold rounded-xl text-xs font-mono uppercase cursor-pointer"
              >
                {t.familiarDeleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Cropper Modal */}
      {isCropperOpen && cropImageSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg aspect-square bg-neutral-950 rounded-2xl overflow-hidden border border-amber-500/40">
            <Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setIsCropperOpen(false);
                setCropImageSrc(null);
              }}
              className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-xs font-mono uppercase cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleConfirmCrop}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs font-mono uppercase cursor-pointer"
            >
              {t.cropConfirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
