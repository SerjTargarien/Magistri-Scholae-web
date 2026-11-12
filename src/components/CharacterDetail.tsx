/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { FiligreeCorner } from "./AcademyOrnaments";
import { HouseCrest } from "./HouseCrest";
import { CropDialog } from "./CropDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImageViewer } from "./ImageViewer";
import { PrivateNotes } from "./notes/PrivateNotes";
import { imageSrc } from "../remote/assets";
import type { FamiliarSheet } from "../model/sheet";
import type { CharacterDetailProps } from "../account/screens";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  User,
  Flame,
  FileText,
  Image as ImageIcon,
  Plus,
  Activity,
  X,
  Check,
  PawPrint,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";

import { useCharacterSheet } from "./sheet/useCharacterSheet";
import { ProfileTab } from "./sheet/ProfileTab";
import { SessionTab } from "./sheet/SessionTab";
import { SkillsTab } from "./sheet/SkillsTab";
import { SpellsTab } from "./sheet/SpellsTab";
import { NotesTab } from "./sheet/NotesTab";
import { GalleryTab } from "./sheet/GalleryTab";
import { RequiredTextInput } from "./RequiredTextInput";
import { limitAttrs, maxLengthOf } from "./LimitHint";
import { Segmented } from "./Segmented";
import { Picker, pickerTexts } from "./Picker";

/** The picker's «no familiar» row. */
const NO_FAMILIAR = "__none";

export type { CharacterDetailProps } from "../account/screens";

export const CharacterDetail: React.FC<CharacterDetailProps> = (sheetProps) => {
  const ctx = useCharacterSheet(sheetProps);
  const {
    character, familiars, onBack, onArchive, onSelectFamiliar, onOpenCreateFamiliar, t, archiveText, characterType,
    theme, writable, shown, canEditSheet, canBond, edit, activeTab, setActiveTab, viewer,
    openPortrait, isQuickEditing, setIsQuickEditing, avatarInputRef, cropImageSrc, setCropImageSrc, isCropperOpen,
    setIsCropperOpen, crop, setCrop, zoom, setZoom, isDeleteStudentOpen, setIsDeleteStudentOpen, asking,
    isSelectFamiliarModalOpen,
    setIsSelectFamiliarModalOpen, bondId, linkedFamiliar, bondFamiliar, handleAvatarChange, onCropComplete,
    handleConfirmCrop, setAvatarFit, removeAvatar,
    handleDeleteCharacterClick, confirmDeleteCharacter,
  } = ctx;
  const casa = character.casa ?? "";
  // Edit mode shows only the controls this viewer may use.
  const editAvatar = isQuickEditing && writable("avatarImage");
  const editBond = isQuickEditing && canBond;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4" id="character-detail-screen">
      <div className="academy-outer-frame rounded-2xl p-4 sm:p-6 relative">
        <>
          <FiligreeCorner position="tl" className="w-8 h-8" />
          <FiligreeCorner position="tr" className="w-8 h-8" />
          <FiligreeCorner position="bl" className="w-8 h-8" />
          <FiligreeCorner position="br" className="w-8 h-8" />
        </>
        

      {/* Top Navigation & Action Bar - Highly Visible with 44px+ touch targets */}
      <div
        className="flex flex-row justify-between items-center mb-5 bg-[#120e1c]/90 border border-[#c8a248]/35 p-2.5 rounded-xl gap-2 z-20 relative shadow-lg"
        id="detail-top-nav-bar"
      >
        <button
          id="btn-detail-back"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-[#f3e5c0] bg-gradient-to-b from-[#231c35] to-[#130f1e] border border-[#c8a248]/50 rounded-lg hover:border-[#f3d88c] focus:outline-none min-h-[40px] transition-all cursor-pointer select-none shrink-0 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t.back}</span>
        </button>

        <div className="flex gap-2">
          {/* Edit Button (only for a viewer who can change something) */}
          {canEditSheet && (
          <button
            id="btn-detail-edit"
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

          {/* Archive Button (GM only) */}
          {onArchive && (
          <button
            id="btn-detail-delete"
            onClick={handleDeleteCharacterClick}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-rose-200 bg-gradient-to-b from-[#4c1420] to-[#280910] border border-[#c8a248]/40 hover:border-rose-400 hover:text-white rounded-lg focus:outline-none min-h-[40px] transition-all cursor-pointer select-none shadow-sm"
          >
            <Trash2 className="w-4 h-4 shrink-0 text-rose-300" />
            <span className="hidden sm:inline">{archiveText.button}</span>
          </button>
          )}
        </div>
      </div>

      {/* Dynamic Profile Cover Banner */}
      <div
        className={
          `relative w-full rounded-xl overflow-hidden bg-gradient-to-r ${theme.bgClass} border-2 border-[#c8a248]/65 p-5 md:p-6 mb-5 flex flex-col md:flex-row gap-4 md:gap-6 items-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]`
        }
      >
        <>
          <FiligreeCorner position="tl" className="w-7 h-7 z-10" />
          <FiligreeCorner position="tr" className="w-7 h-7 z-10" />
          <FiligreeCorner position="bl" className="w-7 h-7 z-10" />
          <FiligreeCorner position="br" className="w-7 h-7 z-10" />
        </>
        

        {/* Left Aspect - Avatar (+ Mobile Corner Familiar & Mobile Compact Crest) */}
        <div className="shrink-0 flex flex-col items-center gap-2.5 relative z-10">
          <div className="flex items-center justify-center">
            {/* Wizard Portrait Wrapper (with Mobile Corner-Overlaid Familiar & Bottom-Left Discrete Crest) */}
            <div className="relative">
              <div
                id="character-portrait"
                // Edit mode: a tap changes the portrait. Reading mode: it opens the viewer.
                onClick={editAvatar ? () => avatarInputRef.current?.click() : character.avatarImage ? openPortrait : undefined}
                className={`w-28 aspect-[3/4] bg-neutral-950 rounded-xl border-2 border-[#c8a248] shadow-[0_0_20px_rgba(0,0,0,0.85)] overflow-hidden flex items-center justify-center relative ${
                  editAvatar ? "cursor-pointer hover:ring-2 hover:ring-amber-500 transition-all select-none" : character.avatarImage ? "cursor-zoom-in select-none" : ""
                }`}
              >
                {character.avatarImage ? (
                  <img
                    src={imageSrc(character.avatarImage)}
                    alt={character.nombre}
                    className={`w-full h-full ${character.avatarFit === "contain" ? "object-contain bg-[#11091f]" : "object-cover"}`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center text-[10px] font-mono text-neutral-400 uppercase select-none p-2 flex flex-col items-center justify-center">
                    <HouseCrest
                      house={casa}
                      isAdultWizard={characterType === "adult_wizard"}
                      className="w-16 h-20 mb-1"
                    />
                    {t.noPortrait}
                  </div>
                )}

                {/* Editing overlay */}
                {editAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-1 text-[10px] font-mono text-amber-300">
                    <ImageIcon className="w-5 h-5 mb-1 text-amber-400" />
                    <span>{t.btnChangePhoto}</span>
                  </div>
                )}
              </div>

              {/* Mobile-Only Discrete House Crest in Bottom-Left Corner of Student Photo (< md) */}
              <div className="flex md:hidden items-center justify-center absolute -bottom-1.5 -left-2 z-20 pointer-events-none">
                <HouseCrest
                  house={casa}
                  isAdultWizard={characterType === "adult_wizard"}
                  className="w-7 h-9 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] opacity-95"
                />
              </div>

              {/* Mobile-Only Corner Overlaid Familiar Portrait (< md) */}
              {(linkedFamiliar || editBond) && (
                <div className="md:hidden absolute -bottom-2.5 -right-5 z-20">
                  {linkedFamiliar ? (
                    <div
                      id="header-familiar-card-mobile"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editBond) {
                          setIsSelectFamiliarModalOpen(true);
                        } else if (onSelectFamiliar) {
                          onSelectFamiliar(linkedFamiliar.id);
                        }
                      }}
                      title={editBond ? t.familiarChangeBond : t.familiarViewDetail}
                      className={`group w-14 aspect-[3/4] bg-neutral-950 rounded-lg overflow-hidden flex items-center justify-center relative cursor-pointer select-none transition-transform active:scale-95 shadow-[0_6px_16px_rgba(0,0,0,0.95)] ring-2 ring-black/80 border-2 border-[#fce8a6]`}
                    >
                      {linkedFamiliar.imagen ? (
                        <img
                          src={imageSrc(linkedFamiliar.imagen)}
                          alt={linkedFamiliar.nombre}
                          className={`w-full h-full ${
                            linkedFamiliar.imageFit === "contain" ? "object-contain bg-[#11091f]" : "object-cover"
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-emerald-950/90 via-[#0e1f18] to-[#0a0612] flex flex-col items-center justify-center p-1 select-none">
                          <PawPrint className="w-5 h-5 text-emerald-400/80 mb-2" />
                        </div>
                      )}

                      {/* Overlaid Familiar Name Scrim */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-3 pb-0.5 px-1 text-center">
                        <div
                          className={`font-magic text-[9px] font-bold uppercase tracking-wider break-words text-center text-[#fce8a6]`}
                        >
                          {linkedFamiliar.nombre || t.noName}
                        </div>
                      </div>

                      {/* Quick Edit Mode overlay on mobile corner badge */}
                      {editBond && (
                        <div className="absolute inset-0 bg-black/65 flex items-center justify-center text-amber-300">
                          <LinkIcon className="w-4 h-4 text-amber-400" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="header-familiar-bond-btn-mobile"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSelectFamiliarModalOpen(true);
                      }}
                      title={t.bondExistingFamiliar}
                      className={`w-14 aspect-[3/4] rounded-lg flex flex-col items-center justify-center p-1 text-center transition-all cursor-pointer select-none shadow-[0_6px_16px_rgba(0,0,0,0.95)] ring-2 ring-black/80 bg-[#120d1a]/95 border-2 border-dashed border-[#c8a248] text-[#fce8a6]`}
                    >
                      <PawPrint className="w-4 h-4 mb-0.5 text-emerald-400" />
                      <span className="text-[9px] font-mono uppercase tracking-tighter leading-tight break-words">
                        {t.bondExistingFamiliar}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />

          {isQuickEditing && ((character.avatarImage && (writable("avatarFit") || writable("avatarImage"))) || (linkedFamiliar && canBond)) && (
            <div className="flex flex-col gap-1.5 w-36 mt-1">
              {character.avatarImage && (
                <>
                  {writable("avatarFit") && (
                  <Segmented label={t.lblAvatarFit} full small value={character.avatarFit || "cover"} onChange={setAvatarFit}
                    options={[{ value: "cover" as const, label: t.optAvatarCover, id: "btn-sheet-fit-cover" }, { value: "contain" as const, label: t.optAvatarContain, id: "btn-sheet-fit-contain" }]} />
                  )}
                  {writable("avatarImage") && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="w-full py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/20 text-rose-300 rounded text-[9px] font-mono transition-colors cursor-pointer"
                  >
                    {t.removeAvatar}
                  </button>
                  )}
                </>
              )}

              {/* Mobile-Only Unbind Familiar button in Quick Edit Mode */}
              {linkedFamiliar && canBond && (
                <button
                  type="button"
                  onClick={() => bondFamiliar(null)}
                  className="md:hidden w-full py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/20 text-rose-300 rounded text-[9px] font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title={t.familiarUnbind}
                >
                  <Unlink className="w-3 h-3" />
                  <span className="break-words">{t.familiarUnbind}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center Aspect - Name, House & Concept Info */}
        <div className="flex-1 text-center md:text-left self-center w-full relative z-10">
          {isQuickEditing ? (
            <div className="flex flex-col gap-2.5 max-w-md mx-auto md:mx-0">
              {/* Name field */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-500 font-bold mb-0.5">
                  {t.nombre}
                </label>
                <RequiredTextInput
                  maxLength={maxLengthOf("character", "nombre")}
                  id="input-sheet-nombre"
                  value={character.nombre || ""}
                  disabled={!writable("nombre")}
                  onSave={(text) => edit("nombre", text)}
                  emptyHint={t.requiredKeepsSaved}
                  className="w-full text-sm font-magic bg-neutral-950 text-neutral-100 border border-neutral-800 hover:border-neutral-700 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder={t.placeholderNombre}
                />
              </div>

              {/* Concept field */}
              {shown("concepto") && (
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-500 font-bold mb-0.5">
                  {t.concepto}
                </label>
                <input
                  {...limitAttrs("character", "concepto")}
                  type="text"
                  value={character.concepto || ""}
                  disabled={!writable("concepto")}
                  onChange={(e) => edit("concepto", e.target.value)}
                  className="w-full text-xs font-mono bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder={t.placeholderConceptoEdit}
                />
              </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1
                  className="font-magic text-2xl md:text-3xl font-bold text-[#fce8a6] uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(212,175,55,0.45)]"
                >
                  {character.nombre || t.noName}
                </h1>
              </div>

              {shown("concepto") && (
              <p
                className="text-sm text-[#e6d5b8] mt-1.5 md:mt-2 font-serif italic max-w-xl mx-auto md:mx-0"
              >
                {character.concepto ? `“${character.concepto}”` : `— ${t.noConceptDefined} —`}
              </p>
              )}
            </>
          )}
        </div>

        {/* Right Aspect (Tablet & Desktop md+) - Bonded Familiar Portrait (left of Crest) & Vector House Crest Shield */}
        <div className="hidden md:flex shrink-0 items-center justify-center gap-5 relative z-10 md:pr-2">
          {/* Familiar Portrait Card (Shown in Read Mode when bonded, or in Edit Mode to link/change) */}
          {(linkedFamiliar || editBond) && (
            <div className="flex flex-col items-center gap-1.5">
              {linkedFamiliar ? (
                <div
                  id="header-familiar-card"
                  onClick={() => {
                    if (editBond) {
                      setIsSelectFamiliarModalOpen(true);
                    } else if (onSelectFamiliar) {
                      onSelectFamiliar(linkedFamiliar.id);
                    }
                  }}
                  title={editBond ? t.familiarChangeBond : t.familiarViewDetail}
                  className={`group w-28 aspect-[3/4] bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center relative cursor-pointer select-none transition-all duration-300 border-2 border-[#c8a248] hover:border-[#fce8a6] shadow-[0_0_20px_rgba(0,0,0,0.85)] ${editBond ? "hover:ring-2 hover:ring-amber-500" : "hover:-translate-y-0.5"}`}
                >
                  {linkedFamiliar.imagen ? (
                    <img
                      src={imageSrc(linkedFamiliar.imagen)}
                      alt={linkedFamiliar.nombre}
                      className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                        linkedFamiliar.imageFit === "contain" ? "object-contain bg-[#11091f]" : "object-cover"
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-emerald-950/90 via-[#0e1f18] to-[#0a0612] flex flex-col items-center justify-center p-2 select-none">
                      <PawPrint className="w-8 h-8 text-emerald-400/80 mb-3 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  )}

                  {/* Bottom dark scrim with overlaid Familiar Name */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-6 pb-1.5 px-2 text-center">
                    <div
                      className={`font-magic text-[11px] font-bold uppercase tracking-wider break-words text-[#fce8a6] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]`}
                    >
                      {linkedFamiliar.nombre || t.noName}
                    </div>
                  </div>

                  {/* Quick Edit Mode overlay to change bond */}
                  {editBond && (
                    <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center text-center p-1.5 text-[10px] font-mono text-amber-300">
                      <LinkIcon className="w-5 h-5 mb-1 text-amber-400" />
                      <span>{t.familiarChangeBond}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Unbound Familiar Slot — only visible when isQuickEditing is active */
                <button
                  type="button"
                  id="header-familiar-bond-btn"
                  onClick={() => setIsSelectFamiliarModalOpen(true)}
                  className={`w-28 aspect-[3/4] rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer select-none bg-[#120d1a]/80 border-2 border-dashed border-[#c8a248]/60 hover:border-[#fce8a6] text-[#fce8a6]`}
                >
                  <PawPrint className="w-6 h-6 mb-1.5 text-emerald-400" />
                  <span className="text-[10px] font-mono uppercase tracking-wider leading-tight">
                    {t.bondExistingFamiliar}
                  </span>
                </button>
              )}

              {/* Quick Unlink button under portrait in Edit Mode when a familiar is bonded */}
              {editBond && linkedFamiliar && (
                <button
                  type="button"
                  onClick={() => bondFamiliar(null)}
                  className="w-28 py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/20 text-rose-300 rounded text-[9px] font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title={t.familiarUnbind}
                >
                  <Unlink className="w-3 h-3" />
                  <span className="break-words">{t.familiarUnbind}</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-center">
            <HouseCrest
              house={casa}
              isAdultWizard={characterType === "adult_wizard"}
              className="w-20 h-24"
            />
          </div>
        </div>
      </div>

      {/* Tabs Menu Ribbon */}
      <div
        className="flex overflow-x-auto pb-3 border-b border-[#c8a248]/25 mb-6 gap-2.5 snap-x"
        id="detail-tabs-menu"
      >
        {[
          { id: "perfil", label: t.perfil, icon: User },
          { id: "sesion", label: t.sesion, icon: Activity },
          { id: "habilidades", label: t.habilidades, icon: Shield },
          { id: "hechizos", label: t.hechizos, icon: Flame },
          { id: "notas", label: t.notas, icon: FileText },
          { id: "galeria", label: t.galeria, icon: ImageIcon },
        ].map((tb) => {
          const IsActive = activeTab === tb.id;
          const Icon = tb.icon;
          return (
            <button
              id={`tab-button-${tb.id}`}
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg border transition-all shrink-0 snap-start cursor-pointer select-none ${
                IsActive
                    ? "bg-gradient-to-b from-[#352158] to-[#1d1133] border-[#c8a248] text-[#fce8a6] shadow-[0_0_15px_rgba(200,162,72,0.3)]"
                    : "bg-[#140f21]/90 border-[#c8a248]/35 text-[#c4b79c] hover:text-[#f3e5c0] hover:border-[#c8a248]/65"
              }`}
            >
              <Icon className={`w-4 h-4 ${(IsActive ? "text-[#f3d88c]" : "text-[#c8a248]/80")}`} />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Primary Tabs Board */}
      <div className="min-h-[400px]" id="detail-active-tab-box">

        {/* TAB 1: PERFIL */}
        {activeTab === "perfil" && <ProfileTab ctx={ctx} />}

        {/* TAB 2: SESIÓN (Tracker mode) */}
        {activeTab === "sesion" && <SessionTab ctx={ctx} />}

        {/* TAB 3: HABILIDADES (Skills tracker) */}
        {activeTab === "habilidades" && <SkillsTab ctx={ctx} />}

        {/* TAB 4: HECHIZOS (Conjuros y Pociones) */}
        {activeTab === "hechizos" && <SpellsTab ctx={ctx} />}

        {/* TAB 5: NOTAS & CHRONICLES */}
        {activeTab === "notas" && <>
          <NotesTab ctx={ctx} />
          {sheetProps.notes && <PrivateNotes lang={sheetProps.lang} notes={sheetProps.notes} store={sheetProps.store} />}
        </>}

        {/* TAB 6: GALERÍA DE FOTOS (Base64 list) */}
        {activeTab === "galeria" && <GalleryTab ctx={ctx} />}

      </div>
      </div>

      {/* The image viewer: portrait and gallery (product-design.md, Image viewer) */}
      {viewer.request && <ImageViewer request={viewer.request} t={t} onClose={viewer.close} />}

      {/* Archiving (GM only): the shared dialog, with its tick box */}
      {isDeleteStudentOpen && (
        <ConfirmDialog
          id="archive"
          title={archiveText.title}
          message={archiveText.text}
          understood={archiveText.checkbox}
          confirmLabel={archiveText.confirm}
          cancelLabel={t.cancel}
          onConfirm={confirmDeleteCharacter}
          onCancel={() => setIsDeleteStudentOpen(false)}
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

      {/* Dynamic Interactive Crop Wizard Modal */}
      {isCropperOpen && cropImageSrc && (
        <CropDialog
          t={t}
          image={cropImageSrc}
          crop={crop}
          zoom={zoom}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          onCancel={() => { setIsCropperOpen(false); setCropImageSrc(null); }}
          onConfirm={handleConfirmCrop}
        />
      )}

      {/* Linking a familiar: the shared picker (Controls, control 9) */}
      {isSelectFamiliarModalOpen && (
        <Picker
          id="familiar-picker"
          title={t.familiarBondSectionTitle}
          intro={t.selectFamiliarPlaceholder}
          selected={bondId ?? NO_FAMILIAR}
          items={[
            { id: NO_FAMILIAR, label: t.familiarBondNone, icon: <span className="w-9 h-9 rounded-full grid place-items-center shrink-0 bg-neutral-900 border border-neutral-700 text-neutral-400"><X className="w-4 h-4" /></span> },
            ...familiars.map((familiar) => {
              const fam = familiar.fields as FamiliarSheet;
              return {
                id: familiar.id,
                label: fam.nombre ?? "",
                detail: fam.especie,
                icon: fam.imagen
                  ? <img src={imageSrc(fam.imagen)} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#d4af37]" />
                  : <span className="w-9 h-9 rounded-full grid place-items-center shrink-0 bg-emerald-950/60 border border-[#d4af37] text-emerald-300"><PawPrint className="w-4 h-4" /></span>,
              };
            }),
          ]}
          onPick={(id) => { bondFamiliar(id === NO_FAMILIAR ? null : id); setIsSelectFamiliarModalOpen(false); }}
          onClose={() => setIsSelectFamiliarModalOpen(false)}
          texts={pickerTexts(t)}
          footer={onOpenCreateFamiliar && (
            <button
              type="button"
              onClick={() => { setIsSelectFamiliarModalOpen(false); onOpenCreateFamiliar(); }}
              className="min-h-10 px-3 text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.createNewFamiliar}</span>
            </button>
          )}
        />
      )}
    </div>
  );
};
