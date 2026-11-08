/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The creation form's "estres" tab, moved verbatim out of CharacterForm.tsx (R3.4).
import React, { useState, useEffect } from "react";
import { Character, Skill, CustomField, CharacterType } from "../../types";
import { HOUSES, HOUSE_ICONS } from "../../data/gameData";
import {
  Language,
  TRANSLATIONS,
  getLocalizedHouseLore,
  translateHouseMotto,
  translateSkillName,
  canonicalizeSkillName,
} from "../../localization";
import Cropper from "react-easy-crop";
import { compressImage, getCroppedImg } from "../../utils/imageCompressor";
import { 
  Save, 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Coins, 
  FileText,
  User,
  GraduationCap,
  Sparkle,
  Layers,
  Dumbbell,
  Shield,
  Activity,
  Award,
  BookOpen,
  Minus,
  PawPrint
} from "lucide-react";
import { createDefaultCharacter, getInitialDefaultSkills } from "../../utils/characterFactory";
import { getCharacterVisualTheme } from "../../utils/characterVisualTheme";
import { HouseCrest } from "../HouseCrest";
import { FamiliarEditor } from "../FamiliarEditor";

import type { FormContext } from "./useCharacterForm";

export function FormStressTab({ ctx }: { ctx: FormContext }) {
  const {
    lang, initialCharacter, newCharacterType, onSave, onCancel, t, activeFormTab, setActiveFormTab, characterState,
    setCharacterState, characterType, profile, updateProfileField, formError, setFormError, imageError, setImageError,
    newAspectName, setNewAspectName, newComplicationName, setNewComplicationName, newFormTempAspect, setNewFormTempAspect,
    pastedAvatarUrl, setPastedAvatarUrl, newPhysConsequence, setNewPhysConsequence, newMentConsequence, setNewMentConsequence,
    newSocConsequence, setNewSocConsequence, inlineSkillNames, setInlineSkillNames, skillsSavedFeedback, setSkillsSavedFeedback,
    newItemName, setNewItemName, newItemQty, setNewItemQty, newCustomFieldName, setNewCustomFieldName, newCustomFieldValue,
    setNewCustomFieldValue, showDiscardModal, setShowDiscardModal, showFamiliarEditorModal, setShowFamiliarEditorModal,
    cropImageSrc, setCropImageSrc, isCropperOpen, setIsCropperOpen, crop, setCrop, zoom, setZoom, croppedAreaPixels,
    setCroppedAreaPixels, handleHouseChange, handleImageUpload, handleUrlAvatarSubmit, onCropComplete, handleConfirmCrop,
    addAspect, removeAspect, addTempAspect, removeTempAspect, addComplication, removeComplication, addEquipmentItem,
    removeEquipmentItem, addCustomField, updateCustomField, removeCustomField, addPhysConsequence, removePhysConsequence,
    addMentConsequence, removeMentConsequence, addSocConsequence, removeSocConsequence, adjustSkillValue, skillError,
    setSkillError, handleAddInlineSkill, handleRemoveSkill, handleSaveDefaultSkills, handleSave, isStateDirty,
    handleCancelClick, theme, houseAccentBorder, houseTabBtnStyle, houseIconColor,
  } = ctx;
  return (
            <div className="space-y-6 animate-fade-in" id="form-tabpanel-estres">
              <div className="flex items-center gap-1.5 border-b border-violet-500/10 pb-3">
                <Activity className={`w-5 h-5 ${houseIconColor}`} />
                <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                  {t.titleMaxStress}
                </h3>
              </div>

              {/* Stress track ranges controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Physical Limit block */}
                <div className="bg-neutral-950/45 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-1">
                    <span className="text-rose-400">💪</span>
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresFisico} ({t.labelMaximo})</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCharacterState(p => ({ ...p, estresFisicoMax: Math.max(1, p.estresFisicoMax - 1) }))}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      -
                    </button>
                    <input
                      id="input-range-phys-max"
                      type="number"
                      min="1"
                      max="10"
                      value={characterState.estresFisicoMax}
                      onChange={(e) => setCharacterState(p => ({ ...p, estresFisicoMax: Math.max(1, Math.min(10, parseInt(e.target.value) || 5)) }))}
                      className="flex-1 text-center font-mono font-bold text-amber-500 bg-neutral-900 text-xs py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setCharacterState(p => ({ ...p, estresFisicoMax: Math.min(10, p.estresFisicoMax + 1) }))}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Mental Limit block */}
                <div className="bg-neutral-950/45 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-1">
                    <span className="text-violet-400">🧠</span>
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresMental} ({t.labelMaximo})</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCharacterState(p => ({ ...p, estresMentalMax: Math.max(1, p.estresMentalMax - 1) }))}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      -
                    </button>
                    <input
                      id="input-range-ment-max"
                      type="number"
                      min="1"
                      max="10"
                      value={characterState.estresMentalMax}
                      onChange={(e) => setCharacterState(p => ({ ...p, estresMentalMax: Math.max(1, Math.min(10, parseInt(e.target.value) || 5)) }))}
                      className="flex-1 text-center font-mono font-bold text-amber-500 bg-neutral-900 text-xs py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setCharacterState(p => ({ ...p, estresMentalMax: Math.min(10, p.estresMentalMax + 1) }))}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Social Limit block */}
                <div className="bg-neutral-950/45 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-1">
                    <span className="text-indigo-400">🗣️</span>
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresSocial} ({t.labelMaximo})</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCharacterState(p => ({ ...p, estresSocialMax: Math.max(1, p.estresSocialMax - 1) }))}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      -
                    </button>
                    <input
                      id="input-range-soc-max"
                      type="number"
                      min="1"
                      max="10"
                      value={characterState.estresSocialMax}
                      onChange={(e) => setCharacterState(p => ({ ...p, estresSocialMax: Math.max(1, Math.min(10, parseInt(e.target.value) || 5)) }))}
                      className="flex-1 text-center font-mono font-bold text-amber-500 bg-neutral-900 text-xs py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setCharacterState(p => ({ ...p, estresSocialMax: Math.min(10, p.estresSocialMax + 1) }))}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>

            </div>
  );
}
