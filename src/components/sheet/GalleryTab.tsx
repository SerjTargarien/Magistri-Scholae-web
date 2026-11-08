/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "galeria" tab, moved verbatim out of CharacterDetail.tsx (R3.4).
import React, { useState, useEffect, useRef } from "react";
import { Character, Familiar, Spell, Potion, Skill, Club, InventoryItem, getCharacterType, VisualStyle } from "../../types";
import { HOUSES, HOUSE_ICONS } from "../../data/gameData";
import { getCharacterVisualTheme } from "../../utils/characterVisualTheme";
import {
  Language,
  TRANSLATIONS,
  translateSkillName,
  translateHouseMotto,
  getLocalizedHouseLore,
  areSameSkill
} from "../../localization";
import { FiligreeCorner, CompassStarDivider } from "../AcademyOrnaments";
import { HouseCrest, hasRecognizedCrest } from "../HouseCrest";
import { storage } from "../../storage";
import Cropper from "react-easy-crop";
import { compressImage, getCroppedImg } from "../../utils/imageCompressor";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  User,
  Flame,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Plus,
  Minus,
  Sparkles,
  Award,
  Coins,
  Activity,
  Trash,
  X,
  Maximize2,
  Gem,
  Check,
  Upload,
  Save,
  PawPrint,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
} from "lucide-react";

import type { SheetContext } from "./useCharacterSheet";

export function GalleryTab({ ctx }: { ctx: SheetContext }) {
  const {
    lang, character, familiars, onBack, onDelete, onUpdateCharacter, onSelectFamiliar, onBondFamiliar, onOpenCreateFamiliar,
    visualStyle, t, hInfo, localizedLore, characterType, theme, isAcademy, profile, updateProfileField, activeTab,
    setActiveTab, newSpellName, setNewSpellName, newSpellVal, setNewSpellVal, newSpellSpec, setNewSpellSpec,
    newPotionName, setNewPotionName, newPotionVal, setNewPotionVal, newPotionSpec, setNewPotionSpec, newClubName,
    setNewClubName, newItemName, setNewItemName, newItemQty, setNewItemQty, newNoteTitle, setNewNoteTitle,
    newNoteContent, setNewNoteContent, lightboxImage, setLightboxImage, galleryError, setGalleryError, newTempAspect,
    setNewTempAspect, newPhysicalConsequence, setNewPhysicalConsequence, newMentalConsequence, setNewMentalConsequence,
    newSocialConsequence, setNewSocialConsequence, isQuickEditing, setIsQuickEditing, newPersonalAspectInput,
    setNewPersonalAspectInput, newComplicationInput, setNewComplicationInput, newCustomFieldName, setNewCustomFieldName,
    newCustomFieldValue, setNewCustomFieldValue, avatarInputRef, editingNoteId, setEditingNoteId, editingNoteTitle,
    setEditingNoteTitle, editingNoteContent, setEditingNoteContent, cropImageSrc, setCropImageSrc, isCropperOpen,
    setIsCropperOpen, crop, setCrop, zoom, setZoom, croppedAreaPixels, setCroppedAreaPixels, newSkillNames,
    setNewSkillNames, skillErrorCat, setSkillErrorCat, presetSavedSuccess, setPresetSavedSuccess, isDeleteStudentOpen,
    setIsDeleteStudentOpen, deleteStudentUnderstood, setDeleteStudentUnderstood, minorDeleteTarget, setMinorDeleteTarget,
    isSelectFamiliarModalOpen, setIsSelectFamiliarModalOpen, linkedFamiliar, saveStateToDB, changeStat, setDestinyPoints,
    changeMaxStress, handleAvatarChange, onCropComplete, handleConfirmCrop, handleDeleteAspect, handleAddNewAspect,
    handleDeleteComplication, handleAddNewComplication, handleAddCustomField, handleUpdateCustomField, handleRemoveCustomField,
    handleAddTempAspect, handleRemoveTempAspect, handleAddPhysicalConsequence, handleRemovePhysicalConsequence,
    handleAddMentalConsequence, handleRemoveMentalConsequence, handleAddSocialConsequence, handleRemoveSocialConsequence,
    changeSkillValue, handleNewSkillNameChange, handleAddSkill, handleRemoveSkill, handleSaveDefaultSkillPreset,
    addSpell, removeSpell, confirmRemoveSpell, addPotion, removePotion, confirmRemovePotion, handleGalleryAdd,
    removeGalleryImage, confirmRemoveGalleryImage, handleAddClub, handleRemoveClub, confirmRemoveClub, handleAddInventoryItem,
    handleChangeInventoryQty, handleRemoveInventoryItem, confirmRemoveInventoryItem, handleAddNote, handleStartEditNote,
    handleSaveEditedNote, newNoteNoteTitle, handleRemoveNote, confirmRemoveNote, handleDeleteCharacterClick,
    confirmDeleteCharacter, handleExportCharacter, getCategoryTitle,
  } = ctx;
  return (
          <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6 animate-fade-in" id="detail-tab-galeria">

            {/* Top Info with file picker */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-violet-500/10 pb-3">
              <div>
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-violet-400" />
                  {t.galeria}
                </h3>
                <p className="text-[10px] text-neutral-400 mt-1 font-mono">{t.galleryInstructions}</p>
              </div>

              {isQuickEditing && (
                <div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-violet-950 hover:bg-violet-900 border border-violet-500/35 rounded-xl text-xs font-bold transition-all cursor-pointer text-violet-100">
                    <Plus className="w-4 h-4" />
                    {t.uploadGallery}
                    <input
                      id="input-gallery-picker"
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryAdd}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Gallery Error Alert */}
            {galleryError && (
              <div className="bg-rose-950/40 border border-rose-500/20 rounded-xl p-3.5 flex items-center justify-between text-rose-300 text-xs font-mono animate-fade-in" id="gallery-error-banner">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{galleryError}</span>
                </div>
                <button
                  id="btn-close-gallery-err"
                  onClick={() => setGalleryError(null)}
                  className="text-rose-400 hover:text-rose-200 cursor-pointer p-1 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Gallery images GRID / CSS columns Masonry */}
            {character.galleryImages && character.galleryImages.length > 0 ? (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4" id="gallery-pics-view">
                {character.galleryImages.map((pic, idx) => (
                  <div
                    id={`gallery-item-${idx}`}
                    key={idx}
                    onClick={() => setLightboxImage(pic)}
                    className="break-inside-avoid bg-neutral-950 border border-violet-500/10 rounded-xl overflow-hidden cursor-pointer shadow hover:border-amber-500/40 hover:-translate-y-0.5 transition-all mb-4 relative group"
                  >
                    <img
                      src={pic}
                      alt={`Relato ${idx}`}
                      className="w-full h-auto object-contain block transition-transform group-hover:scale-[1.02] duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Delete action indicator hover */}
                    {isQuickEditing && (
                      <button
                        id={`btn-del-gal-pic-${idx}`}
                        onClick={(e) => removeGalleryImage(idx, e)}
                        className="absolute top-2 right-2 bg-rose-950/90 border border-rose-500/30 p-1.5 rounded-lg text-rose-300 hover:text-rose-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                        title="Delete picture"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="absolute bottom-2 left-2 bg-neutral-900/80 px-1.5 py-0.5 text-[8px] font-mono rounded text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-600 font-mono text-[10px] select-none" id="gallery-empty-notif">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30 text-violet-400" />
                {t.labelGalleryEmpty}
              </div>
            )}
          </div>
  );
}
