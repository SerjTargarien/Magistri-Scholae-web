/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "hechizos" tab, moved verbatim out of CharacterDetail.tsx (R3.4).
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

export function SpellsTab({ ctx }: { ctx: SheetContext }) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" id="detail-tab-hechizos">

            {/* Spells Panel */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6">
              <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                ⚡ {t.grimoireOfSpells}
              </h3>

              {/* Spells list display */}
              <div className="space-y-2">
                {character.conjuros && character.conjuros.length > 0 ? (
                  character.conjuros.map((sp) => (
                    <div
                      key={sp.id}
                      className="flex justify-between items-center bg-neutral-950/20 px-3 py-2 border border-neutral-900 rounded-lg"
                    >
                      <div>
                        <span className="text-xs font-semibold text-neutral-200">{sp.nombre}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-mono uppercase bg-neutral-800 text-neutral-400 px-1 py-0.5 rounded">
                            {t.labelDificultad} {sp.valor}
                          </span>
                          {sp.specialized && (
                            <span className="text-[9px] font-mono uppercase bg-violet-950 text-violet-300 font-bold px-1 py-0.5 rounded border border-violet-500/10">
                              {t.specialized}
                            </span>
                          )}
                        </div>
                      </div>
                      {isQuickEditing && (
                        <button
                          id={`btn-del-spell-${sp.id}`}
                          onClick={() => removeSpell(sp.id)}
                          className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-mono text-neutral-600 text-center select-none py-6">
                    {t.labelSpellsEmpty}
                  </p>
                )}
              </div>

              {/* Add form */}
              {isQuickEditing && (
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3 animate-fade-in">
                  <h4 className="text-[10px] font-mono text-neutral-400 uppercase font-black tracking-wide flex items-center gap-1.5">
                    <span>✨</span> {t.registerNewSpell}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      id="input-spell-name"
                      type="text"
                      placeholder={t.placeholderConjuroName}
                      value={newSpellName}
                      onChange={(e) => setNewSpellName(e.target.value)}
                      className="text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    />
                    <select
                      id="select-spell-val"
                      value={newSpellVal}
                      onChange={(e) => setNewSpellVal(parseInt(e.target.value) || 1)}
                      className="text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    >
                      <option value="1">{t.labelDificultad} I</option>
                      <option value="2">{t.labelDificultad} II</option>
                      <option value="3">{t.labelDificultad} III</option>
                      <option value="4">{t.labelDificultad} IV</option>
                      <option value="5">{t.labelDificultad} V</option>
                    </select>
                    <label className="flex items-center gap-2 hover:text-neutral-200 text-xs text-neutral-400 ml-1 select-none">
                      <input
                        id="checkbox-spell-spec"
                        type="checkbox"
                        checked={newSpellSpec}
                        onChange={(e) => setNewSpellSpec(e.target.checked)}
                        className="rounded text-violet-600 bg-neutral-900 focus:ring-violet-500/50"
                      />
                      {t.specialized}?
                    </label>
                  </div>
                  <button
                    id="btn-add-spell"
                    onClick={addSpell}
                    className="w-full py-1.5 bg-violet-900 hover:bg-violet-800 border border-violet-600 text-violet-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                  >
                    {t.register}
                  </button>
                </div>
              )}
            </div>

            {/* Potions Panel */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6">
              <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                🧪 {t.catalogOfPotions}
              </h3>

              {/* Potions list display */}
              <div className="space-y-2">
                {character.pociones && character.pociones.length > 0 ? (
                  character.pociones.map((po) => (
                    <div
                      key={po.id}
                      className="flex justify-between items-center bg-neutral-950/20 px-3 py-2 border border-neutral-900 rounded-lg"
                    >
                      <div>
                        <span className="text-xs font-semibold text-neutral-200">{po.nombre}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-mono uppercase bg-neutral-800 text-neutral-400 px-1 py-0.5 rounded">
                            {t.labelDificultad} {po.valor}
                          </span>
                          {po.specialized && (
                            <span className="text-[9px] font-mono uppercase bg-violet-950 text-violet-300 font-bold px-1 py-0.5 rounded border border-violet-500/10">
                              {t.specialized}
                            </span>
                          )}
                        </div>
                      </div>
                      {isQuickEditing && (
                        <button
                          id={`btn-del-potion-${po.id}`}
                          onClick={() => removePotion(po.id)}
                          className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-mono text-neutral-600 text-center select-none py-6">
                    {t.labelPotionsEmpty}
                  </p>
                )}
              </div>

              {/* Add form */}
              {isQuickEditing && (
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3 animate-fade-in">
                  <h4 className="text-[10px] font-mono text-neutral-400 uppercase font-black tracking-wide flex items-center gap-1.5">
                    <span>🧪</span> {t.registerNewPotion}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      id="input-potion-name"
                      type="text"
                      placeholder={t.placeholderPocionName}
                      value={newPotionName}
                      onChange={(e) => setNewPotionName(e.target.value)}
                      className="text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    />
                    <select
                      id="select-potion-val"
                      value={newPotionVal}
                      onChange={(e) => setNewPotionVal(parseInt(e.target.value) || 1)}
                      className="text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    >
                      <option value="1">{t.labelDificultad} I</option>
                      <option value="2">{t.labelDificultad} II</option>
                      <option value="3">{t.labelDificultad} III</option>
                      <option value="4">{t.labelDificultad} IV</option>
                      <option value="5">{t.labelDificultad} V</option>
                    </select>
                    <label className="flex items-center gap-2 hover:text-neutral-200 text-xs text-neutral-400 ml-1 select-none">
                      <input
                        id="checkbox-potion-spec"
                        type="checkbox"
                        checked={newPotionSpec}
                        onChange={(e) => setNewPotionSpec(e.target.checked)}
                        className="rounded text-violet-600 bg-neutral-900 focus:ring-violet-500/50"
                      />
                      {t.specialized}?
                    </label>
                  </div>
                  <button
                    id="btn-add-potion"
                    onClick={addPotion}
                    className="w-full py-1.5 bg-violet-900 hover:bg-violet-800 border border-violet-600 text-violet-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                  >
                    {t.register}
                  </button>
                </div>
              )}
            </div>

          </div>
  );
}
