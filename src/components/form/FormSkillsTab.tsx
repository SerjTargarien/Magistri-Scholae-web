/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The creation form's "habilidades" tab, moved verbatim out of CharacterForm.tsx (R3.4).
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

export function FormSkillsTab({ ctx }: { ctx: FormContext }) {
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
            <div className="space-y-6 animate-fade-in" id="form-tabpanel-habilidades">
              <div className="flex items-center justify-between border-b border-violet-500/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <BookOpen className={`w-5 h-5 ${houseIconColor}`} />
                  <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                    {t.titleSkillsExpedient}
                  </h3>
                </div>
                <div className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
                  {t.labelCreationRange}
                </div>
              </div>

              {/* Grouped sections vertically */}
              {["Físicas", "Mentales", "Sociales", "Asignaturas Troncales", "Asignaturas Optativas"].map((category) => {
                const skillsInCategory = characterState.habilidades.filter(s => s.categoria === category);
                return (
                  <div key={category} className="space-y-3 bg-neutral-950/30 p-4 border border-violet-500/5 rounded-xl">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-extrabold border-b border-neutral-800 pb-1">
                      {category === "Físicas" ? "🛡️ " + t.catFisicas :
                       category === "Mentales" ? "🧠 " + t.catMentales :
                       category === "Sociales" ? "🗣️ " + t.catSociales :
                       category === "Asignaturas Troncales" ? "📐 " + t.catTroncales :
                       "🔮 " + t.catOptativas}
                    </h4>

                    {skillsInCategory.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {skillsInCategory.map((sk) => {
                          const displaySkillName = translateSkillName(sk.nombre, lang);
                          return (
                            <div
                              key={sk.nombre}
                              className="flex items-center justify-between bg-neutral-900/40 border border-neutral-800 px-3 py-1.5 rounded-lg hover:border-violet-500/10 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(sk.nombre)}
                                  className="text-neutral-500 hover:text-rose-400 p-0.5 transition-colors shrink-0 cursor-pointer"
                                  title={t.removeSkill}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[11px] font-sans text-neutral-300 font-bold truncate pr-1" title={displaySkillName}>
                                  {displaySkillName}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Decrement */}
                                <button
                                  type="button"
                                  onClick={() => adjustSkillValue(sk.nombre, -1)}
                                  disabled={sk.valor <= 0}
                                  className="w-5 h-5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-800 text-[10px] font-mono text-neutral-400 flex items-center justify-center rounded cursor-pointer select-none"
                                >
                                  -
                                </button>
                                
                                {/* Score displaying filled points */}
                                <span className="text-[11px] min-w-[28px] font-mono font-bold text-center text-amber-400 bg-neutral-950 px-1 py-0.5 rounded border border-neutral-800">
                                  {sk.valor}
                                </span>

                                {/* Increment */}
                                <button
                                  type="button"
                                  onClick={() => adjustSkillValue(sk.nombre, 1)}
                                  disabled={sk.valor >= 5}
                                  className="w-5 h-5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-800 text-[10px] font-mono text-neutral-400 flex items-center justify-center rounded cursor-pointer select-none"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-500 italic">
                        {t.noSkillsInCategory}
                      </p>
                    )}

                    {/* Inline instant adding input */}
                    <div className="mt-4 pt-3 border-t border-neutral-900/40 flex flex-col sm:flex-row sm:items-center gap-2 max-w-md">
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder={t.placeholderNewSkillCategory}
                          value={inlineSkillNames[category] || ""}
                          onChange={(e) => {
                            setInlineSkillNames(prev => ({ ...prev, [category]: e.target.value }));
                            if (skillError) setSkillError(null);
                          }}
                          className="flex-1 text-[11px] font-sans py-1 px-2.5 bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddInlineSkill(category);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddInlineSkill(category)}
                          className="p-1 px-3 bg-violet-900/60 hover:bg-violet-800 border border-violet-600/30 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-95"
                          title={t.addSkill}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Unique skill input active error display */}
              {skillError && (
                <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-rose-400 text-[10.5px] font-mono animate-fade-in">
                  ⚠️ {skillError}
                </div>
              )}

              {/* Plantilla Predeterminada / Defaults panel at bottom */}
              <div className="p-4 bg-neutral-950/40 border border-violet-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-inner mt-6">
                <div className="space-y-1">
                  <h4 className="text-xs font-magic text-amber-400 uppercase tracking-widest">
                    {"🔧 " + t.btnSaveSkillPreset}
                  </h4>
                  <p className="text-[10.5px]/relaxed text-neutral-400 font-sans">
                    {t.descSaveSkillPreset}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveDefaultSkills}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {t.btnSetDefaultPreset}
                  </button>
                  {skillsSavedFeedback && (
                    <span className="text-[10px] text-emerald-400 font-mono animate-pulse">
                      {"✓ " + t.savedPreset}
                    </span>
                  )}
                </div>
              </div>

            </div>
  );
}
