/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "habilidades" tab, moved verbatim out of CharacterDetail.tsx (R3.4).
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

export function SkillsTab({ ctx }: { ctx: SheetContext }) {
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
          <div className="space-y-6 animate-fade-in" id="detail-tab-habilidades">
            {/* Save Default Skill Preset Banner in Quick Edit */}
            {isQuickEditing && (
              <div className="bg-violet-950/40 border border-violet-500/20 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-xs text-neutral-300 font-mono">
                  {t.descSaveSkillPreset}
                </span>
                <button
                  type="button"
                  onClick={handleSaveDefaultSkillPreset}
                  className="px-4 py-2 bg-violet-900 hover:bg-violet-800 border border-violet-500/40 text-violet-100 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>{presetSavedSuccess ? t.savedPreset : t.btnSaveSkillPreset}</span>
                </button>
              </div>
            )}

            {/* Split Skills by structural headings */}
            {["Físicas", "Mentales", "Sociales", "Asignaturas Troncales", "Asignaturas Optativas"].map((catKey) => {
              const matchedSkills = character.habilidades.filter(sk => sk.categoria === catKey);

              return (
                <div key={catKey} className="glass-panel p-6 rounded-xl border border-violet-500/15" id={`skill-block-${catKey}`}>
                  <div className="flex justify-between items-center border-b border-violet-500/10 pb-2 mb-4">
                    <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest flex items-center gap-2">
                      🛡️ {getCategoryTitle(catKey)}
                    </h3>
                  </div>

                  {/* Inline insertion form */}
                  {isQuickEditing && (
                    <div className="mb-4 space-y-1.5">
                      <div className="bg-neutral-950/40 p-3 rounded-xl border border-violet-500/10 flex gap-2 items-center" id={`add-skill-form-${catKey}`}>
                        <input
                          id={`input-new-skill-name-${catKey}`}
                          type="text"
                          placeholder={t.placeholderNewSkillName}
                          value={newSkillNames[catKey] || ""}
                          onChange={(e) => handleNewSkillNameChange(catKey, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill(catKey);
                            }
                          }}
                          className="flex-1 text-xs bg-neutral-900 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200"
                        />
                        <button
                          id={`btn-add-skill-${catKey}`}
                          type="button"
                          onClick={() => handleAddSkill(catKey)}
                          className="px-3 py-1.5 bg-violet-900 border border-violet-500/35 hover:bg-violet-800 text-violet-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="text-[10px]">{t.add}</span>
                        </button>
                      </div>
                      {skillErrorCat === catKey && (
                        <p className="text-[10px] font-mono text-rose-400 px-1">
                          {t.errSkillExists.replace("{name}", newSkillNames[catKey] || "")}
                        </p>
                      )}
                    </div>
                  )}

                  {matchedSkills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {character.habilidades.map((sk, index) => {
                        if (sk.categoria !== catKey) return null;
                        const displaySkillName = translateSkillName(sk.nombre, lang);
                        return (
                          <div
                            id={`skill-row-${sk.nombre}`}
                            key={sk.nombre}
                            className="bg-neutral-950/30 border border-neutral-900 px-3 py-2.5 rounded-xl flex items-center justify-between shadow-inner"
                          >
                            <div className="max-w-[130px] sm:max-w-[180px] flex items-center gap-1.5">
                              {/* Removal button shown when edit mode is toggled */}
                              {isQuickEditing && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(index)}
                                  className="w-6 h-6 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer border border-rose-500/10 p-0 mr-1"
                                  title={`${t.delete} ${displaySkillName}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <div className="truncate flex-1">
                                <span className="text-xs font-semibold text-neutral-200 block truncate" title={displaySkillName}>{displaySkillName}</span>
                                <div className="flex gap-1 mt-1">
                                  {/* Small glowing pips indicating score weights */}
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${i < sk.valor ? "bg-amber-500 shadow-sm shadow-amber-500/50" : "bg-neutral-800"}`}
                                    ></span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Decrement Key */}
                              {isQuickEditing && (
                                <button
                                  id={`btn-skill-${sk.nombre}-minus`}
                                  onClick={() => changeSkillValue(index, -1)}
                                  disabled={sk.valor === 0}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center border font-mono font-black text-xs transition-colors cursor-pointer ${sk.valor === 0
                                      ? "bg-neutral-900 border-neutral-950 text-neutral-700 cursor-not-allowed"
                                      : "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-rose-400"
                                    }`}
                                >
                                  -
                                </button>
                              )}
                              <span className="w-4 text-center font-mono font-bold text-amber-300 text-sm">
                                +{sk.valor}
                              </span>
                              {/* Increment key */}
                              {isQuickEditing && (
                                <button
                                  id={`btn-skill-${sk.nombre}-plus`}
                                  onClick={() => changeSkillValue(index, 1)}
                                  disabled={sk.valor === 5}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center border font-mono font-black text-xs transition-colors cursor-pointer ${sk.valor === 5
                                      ? "bg-neutral-900 border-neutral-950 text-neutral-700 cursor-not-allowed"
                                      : "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-emerald-400"
                                    }`}
                                >
                                  +
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] font-mono text-neutral-500 text-center py-4 italic select-none">
                      {t.noSkillsInCategory}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
  );
}
