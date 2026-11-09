/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import type { FamiliarDetailProps } from "../account/screens";
import type { CharacterSheet } from "../model/sheet";
import { imageSrc } from "../remote/assets";
import { FiligreeCorner } from "./AcademyOrnaments";
import { CropDialog } from "./CropDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  PawPrint,
  FileText,
  Image as ImageIcon,
  X,
  Check,
  User,
  Link as LinkIcon,
} from "lucide-react";

import { useFamiliarDetail } from "./familiar/useFamiliarDetail";
import { FamiliarProfileTab } from "./familiar/FamiliarProfileTab";
import { FamiliarNotesTab } from "./familiar/FamiliarNotesTab";
import { FamiliarGalleryTab } from "./familiar/FamiliarGalleryTab";
import { Picker, pickerTexts } from "./Picker";
import { HOUSES } from "../data/gameData";

/** The picker's «no character» row. */
const NO_MASTER = "__none";

export type { FamiliarDetailProps };

export const FamiliarDetail: React.FC<FamiliarDetailProps> = (screenProps) => {
  const ctx = useFamiliarDetail(screenProps);
  const {
    store, familiar, notes, gallery, characters, onBack, onArchive, t, archiveText, asking,
    canEditProfile, canAddNote, canAddGalleryImage, canBond, activeTab, setActiveTab, isQuickEditing, setIsQuickEditing,
    lightboxImage, setLightboxImage,
    cropImageSrc, setCropImageSrc, isCropperOpen, setIsCropperOpen, crop, setCrop, zoom, setZoom, setCroppedAreaPixels,
    isDeleteOpen, setIsDeleteOpen, isSelectMasterOpen, setIsSelectMasterOpen, linkedMaster, isBondedTo,
    handleConfirmCrop, handleBondMaster,
  } = ctx;
  // As on the character sheet: the edit button shows when the viewer can change anything.
  const canEditSheet = canEditProfile || canAddNote || canAddGalleryImage || canBond;

  return (
    <div
      className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 font-sans select-none animate-fade-in"
      id="familiar-detail-container"
    >
      {/* Top Banner Navigation & Actions */}
      <div
        className={`p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/85 to-[#120924] border border-amber-500/30 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-2xl`}
      >
        <>
          <FiligreeCorner position="tl" className="w-6 h-6 text-amber-500/40" />
          <FiligreeCorner position="tr" className="w-6 h-6 text-amber-500/40" />
          <FiligreeCorner position="bl" className="w-6 h-6 text-amber-500/40" />
          <FiligreeCorner position="br" className="w-6 h-6 text-amber-500/40" />
        </>
        

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
                {linkedMaster ? linkedMaster.fields.nombre : store.sheet.bondId ? "—" : t.familiarUnbound}
              </span>
            </div>
            <h1 className="font-magic text-2xl sm:text-3xl font-bold text-neutral-100 uppercase tracking-wider glow-amber break-words max-w-md">
              {familiar.nombre || t.noName}
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="z-10 flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Edit toggle, as on the character sheet: changes save as they are made */}
          {canEditSheet && (
          <button
            type="button"
            id="btn-familiar-edit"
            onClick={() => setIsQuickEditing(!isQuickEditing)}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg focus:outline-none min-h-[40px] transition-all cursor-pointer select-none ${
              isQuickEditing
                ? "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400"
                : "text-[#1a1105] bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] hover:brightness-110 border border-[#fce8a6] shadow-md"
            }`}
          >
            {isQuickEditing ? (
              <>
                <Check className="w-4 h-4 shrink-0" />
                <span>{t.btnFinish}</span>
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t.edit}</span>
              </>
            )}
          </button>
          )}

          {/* Archive Button (GM only; no one deletes) */}
          {onArchive && (
          <button
            type="button"
            id="btn-familiar-delete"
            onClick={() => setIsDeleteOpen(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-800 transition-colors cursor-pointer"
            title={archiveText.button}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          )}
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
          {notes.length > 0 && (
            <span className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-300">
              {notes.length}
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
          {gallery.length > 0 && (
            <span className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-300">
              {gallery.length}
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
      {/* Linking a character: the shared picker (Controls, control 9) */}
      {isSelectMasterOpen && (
        <Picker
          id="master-picker"
          title={t.familiarBondStudent}
          intro={t.selectFamiliarToBond}
          selected={store.sheet.bondId ?? NO_MASTER}
          items={[
            { id: NO_MASTER, label: t.familiarBondNone, icon: <span className="w-9 h-9 rounded-full grid place-items-center shrink-0 bg-neutral-900 border border-neutral-700 text-neutral-400"><X className="w-4 h-4" /></span> },
            ...characters.map((charProjection) => {
              const char = charProjection.fields as CharacterSheet;
              return {
                id: charProjection.id,
                label: char.nombre ?? "",
                detail: char.characterType === "adult_wizard" ? t.characterTypeAdultWizardShort : HOUSES[char.casa ?? ""]?.nombre ?? char.casa,
                icon: char.avatarImage
                  ? <img src={imageSrc(char.avatarImage)} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#d4af37]" />
                  : <span className="w-9 h-9 rounded-full grid place-items-center shrink-0 bg-neutral-900 border border-[#d4af37] text-neutral-400"><User className="w-4 h-4" /></span>,
              };
            }),
          ]}
          onPick={(id) => { handleBondMaster(id === NO_MASTER ? null : id); setIsSelectMasterOpen(false); }}
          onClose={() => setIsSelectMasterOpen(false)}
          texts={pickerTexts(t)}
        />
      )}

      {/* Archiving (GM only): the shared dialog, with its tick box, as a character's */}
      {isDeleteOpen && onArchive && (
        <ConfirmDialog
          id="archive"
          title={archiveText.title}
          message={archiveText.prompt}
          understood={archiveText.checkbox}
          confirmLabel={archiveText.confirm}
          cancelLabel={t.cancel}
          onConfirm={() => { setIsDeleteOpen(false); onArchive(); }}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}

      {/* Removing anything from the sheet asks first */}
      {asking.request && (
        <ConfirmDialog
          id="remove"
          title={t.confirmDeleteTitle}
          message={asking.request.message}
          confirmLabel={asking.request.confirmLabel ?? t.delete}
          cancelLabel={t.cancel}
          onConfirm={() => { asking.request?.run(); asking.close(); }}
          onCancel={asking.close}
        />
      )}

      {/* Avatar Cropper Modal */}
      {isCropperOpen && cropImageSrc && (
        <CropDialog
          t={t}
          image={cropImageSrc}
          crop={crop}
          zoom={zoom}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
          onCancel={() => { setIsCropperOpen(false); setCropImageSrc(null); }}
          onConfirm={handleConfirmCrop}
        />
      )}
    </div>
  );
};
