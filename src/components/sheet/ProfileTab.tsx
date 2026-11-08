/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "perfil" tab, moved verbatim out of CharacterDetail.tsx (R3.4).
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

export function ProfileTab({ ctx }: { ctx: SheetContext }) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch" id="detail-tab-perfil">

            {/* Personal Data Panel (Row 1 Left on Desktop; Position 1 on Mobile) */}
            <div className={`glass-panel p-6 rounded-xl border border-violet-500/15 space-y-4 relative overflow-hidden h-full flex flex-col ${characterType === "adult_wizard" ? "md:col-span-2" : ""}`} id="detail-panel-datos-personales">
              {isAcademy && (
                <>
                  <FiligreeCorner position="tl" className="w-6 h-6" />
                  <FiligreeCorner position="tr" className="w-6 h-6" />
                  <FiligreeCorner position="bl" className="w-6 h-6" />
                  <FiligreeCorner position="br" className="w-6 h-6" />
                </>
              )}
              <h3 className={`font-magic text-xs text-amber-400 uppercase tracking-widest ${isAcademy ? "pb-1" : "border-b border-violet-500/10 pb-2"} flex items-center gap-2`}>
                <User className={`w-4 h-4 ${isAcademy ? "text-amber-400" : "text-violet-400"}`} />
                {characterType === "adult_wizard" ? t.characterTypeAdultWizard : t.secDatosAlumno}
              </h3>
              {isAcademy && <CompassStarDivider className="-mt-2 mb-3" />}

              {isQuickEditing ? (
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.jugador}</label>
                    <input
                      type="text"
                      value={character.jugador || ""}
                      onChange={(e) => {
                        const clone = { ...character, jugador: e.target.value };
                        saveStateToDB(clone);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.edad}</label>
                    <input
                      type="text"
                      value={character.edad || ""}
                      onChange={(e) => {
                        const clone = { ...character, edad: e.target.value };
                        saveStateToDB(clone);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {characterType !== "adult_wizard" && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.curso}</label>
                        <input
                          type="text"
                          value={character.curso || ""}
                          onChange={(e) => {
                            const clone = { ...character, curso: e.target.value };
                            saveStateToDB(clone);
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.puestoClase}</label>
                        <input
                          type="text"
                          value={character.puestoClase || ""}
                          onChange={(e) => {
                            const clone = { ...character, puestoClase: e.target.value };
                            saveStateToDB(clone);
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.linaje}</label>
                    <input
                      type="text"
                      value={character.linaje || ""}
                      onChange={(e) => {
                        const clone = { ...character, linaje: e.target.value };
                        saveStateToDB(clone);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.economia}</label>
                    <input
                      type="text"
                      value={character.economia || ""}
                      onChange={(e) => {
                        const clone = { ...character, economia: e.target.value };
                        saveStateToDB(clone);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {characterType === "adult_wizard" && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardRole}</label>
                        <input
                          type="text"
                          value={profile.role || ""}
                          onChange={(e) => updateProfileField("role", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardInstitution}</label>
                        <input
                          type="text"
                          value={profile.institution || ""}
                          onChange={(e) => updateProfileField("institution", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardFormerHouse}</label>
                        <input
                          type="text"
                          value={profile.formerHouse || ""}
                          onChange={(e) => updateProfileField("formerHouse", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardMagicalFocus}</label>
                        <input
                          type="text"
                          value={profile.magicalFocus || ""}
                          onChange={(e) => updateProfileField("magicalFocus", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1 col-span-2">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardReputation}</label>
                        <input
                          type="text"
                          value={profile.reputation || ""}
                          onChange={(e) => updateProfileField("reputation", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 col-span-2 py-1">
                        <input
                          id="edit-aw-is-teacher"
                          type="checkbox"
                          checked={profile.isTeacher || false}
                          onChange={(e) => updateProfileField("isTeacher", e.target.checked)}
                          className="rounded border-violet-500/20 text-amber-500 focus:ring-amber-500 bg-neutral-950 cursor-pointer"
                        />
                        <label htmlFor="edit-aw-is-teacher" className="text-[10px] text-neutral-300 font-sans cursor-pointer select-none font-bold uppercase tracking-wider">
                          {t.adultWizardIsTeacher}
                        </label>
                      </div>

                      {profile.isTeacher && (
                        <div className="flex flex-col gap-1 col-span-2">
                          <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider flex justify-between">
                            <span>{t.adultWizardTeachingSubjects}</span>
                            <span className="text-[8px] text-neutral-500 normal-case font-normal">{t.commaSeparatedHint}</span>
                          </label>
                          <input
                            type="text"
                            placeholder={t.adultWizardTeachingSubjectsPlaceholder}
                            value={(profile.teachingSubjects || []).join(", ")}
                            onChange={(e) => {
                              const arr = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                              updateProfileField("teachingSubjects", arr);
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.jugador}</div>
                    <div className="text-neutral-200 mt-0.5">{character.jugador || "—"}</div>
                  </div>

                  <div>
                    <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.edad}</div>
                    <div className="text-neutral-200 mt-0.5">{character.edad || "—"}</div>
                  </div>

                  {characterType !== "adult_wizard" && (
                    <>
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.curso}</div>
                        <div className="text-neutral-200 mt-0.5">{character.curso || "—"}</div>
                      </div>

                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.puestoClase}</div>
                        <div className="text-neutral-200 mt-0.5">{character.puestoClase || "—"}</div>
                      </div>
                    </>
                  )}

                  <div>
                    <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.linaje}</div>
                    <div className="text-neutral-200 mt-0.5">{character.linaje || "—"}</div>
                  </div>

                  <div>
                    <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.economia}</div>
                    <div className="text-neutral-200 mt-0.5">{character.economia || "—"}</div>
                  </div>

                  {characterType === "adult_wizard" && (
                    <>
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardRole}</div>
                        <div className="text-neutral-200 mt-0.5">{profile.role || "—"}</div>
                      </div>

                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardInstitution}</div>
                        <div className="text-neutral-200 mt-0.5">{profile.institution || "—"}</div>
                      </div>

                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardFormerHouse}</div>
                        <div className="text-neutral-200 mt-0.5">{profile.formerHouse || "—"}</div>
                      </div>

                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardMagicalFocus}</div>
                        <div className="text-neutral-200 mt-0.5">{profile.magicalFocus || "—"}</div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardReputation}</div>
                        <div className="text-neutral-200 mt-0.5">{profile.reputation || "—"}</div>
                      </div>

                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardIsTeacher}</div>
                        <div className="text-neutral-200 mt-0.5">{profile.isTeacher ? t.yes : t.no}</div>
                      </div>

                      {profile.isTeacher && (
                        <div className="col-span-2">
                          <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardTeachingSubjects}</div>
                          <div className="text-neutral-200 mt-0.5">{(profile.teachingSubjects || []).join(", ") || "—"}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Varita */}
              <div className={isAcademy ? "pt-2" : "border-t border-violet-500/10 pt-3"}>
                {isAcademy && <CompassStarDivider className="mb-3" />}
                {isQuickEditing ? (
                  <div className="grid grid-cols-1 gap-3 text-xs font-mono">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.varitaSintonia}</label>
                      <input
                        type="text"
                        value={character.varitaSintonia || ""}
                        onChange={(e) => {
                          const clone = { ...character, varitaSintonia: e.target.value };
                          saveStateToDB(clone);
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 text-xs font-mono">
                    <div>
                      <div className="text-[9px] text-neutral-500 uppercase tracking-wider">
                        {t.varitaSintonia}
                      </div>
                      <div className="text-neutral-200 mt-0.5">
                        {character.varitaSintonia || t.labelVaritaEmpty}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* House Affiliation & Heraldry Panel (Row 1 Right on Desktop; Position 2 on Mobile) */}
            {characterType !== "adult_wizard" && (
              <div className="glass-panel p-6 rounded-xl border border-violet-500/15 relative overflow-hidden h-full flex flex-col justify-between" id="detail-panel-filiacion">
                {isAcademy && (
                  <>
                    <FiligreeCorner position="tl" className="w-6 h-6" />
                    <FiligreeCorner position="tr" className="w-6 h-6" />
                    <FiligreeCorner position="bl" className="w-6 h-6" />
                    <FiligreeCorner position="br" className="w-6 h-6" />
                  </>
                )}

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className={`font-magic text-xs text-amber-400 uppercase tracking-widest ${isAcademy ? "pb-1" : "border-b border-violet-500/10 pb-2 mb-3"} flex items-center gap-2`}>
                      <Shield className={`w-4 h-4 ${isAcademy ? "text-amber-400" : "text-violet-400"}`} />
                      {t.titleHouseHeraldry}
                    </h3>
                    {isAcademy && <CompassStarDivider className="-mt-1 mb-3" />}

                    {/* Upper Area: Crest on upper-left with name underneath, Lema to its right in bigger font */}
                    <div className={`flex flex-row items-center gap-4 sm:gap-6 my-2 pb-4 ${isAcademy ? "border-b border-amber-500/15" : "border-b border-violet-500/15"}`}>
                      {/* Left: House Crest with House Name Under It */}
                      <div className="flex flex-col items-center justify-center shrink-0 min-w-[90px] sm:min-w-[105px]">
                        <HouseCrest
                          house={character.casa}
                          isAdultWizard={false}
                          className="w-20 h-20 sm:w-22 sm:h-22 filter drop-shadow-[0_4px_16px_rgba(212,175,55,0.3)] transition-transform hover:scale-105"
                          variant="shield"
                        />
                        {isQuickEditing ? (
                          <select
                            value={character.casa.toUpperCase()}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              const hData = HOUSES[newVal];
                              const clone = {
                                ...character,
                                casa: newVal,
                                lema: hData ? translateHouseMotto(hData.lema, lang) : (character.lema || ""),
                                escudoText: hData ? hData.escudo : (character.escudoText || "")
                              };
                              saveStateToDB(clone);
                            }}
                            className="mt-2 w-full text-center text-[10px] bg-neutral-950 text-amber-300 border border-neutral-800 rounded px-1.5 py-1 font-magic uppercase tracking-wider focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          >
                            {Object.keys(HOUSES).map((hKey) => (
                              <option key={hKey} value={hKey}>
                                {HOUSES[hKey].nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className={`font-magic text-xs tracking-widest uppercase ${isAcademy ? "text-amber-300" : "text-amber-200"} font-bold mt-2 text-center drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]`}>
                            {hInfo.nombre}
                          </div>
                        )}
                      </div>

                      {/* Right: Lema in a bigger font (read-only, linked to the house/organization) */}
                      <div className="flex-1 flex flex-col justify-center min-w-0 pl-1 sm:pl-3">
                        <div className="text-[9px] text-neutral-400 uppercase tracking-widest font-mono mb-1.5 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isAcademy ? "bg-amber-400/80" : "bg-violet-400/80"} inline-block`}></span>
                          {t.labelMotto}
                        </div>
                        <blockquote className={`font-serif italic text-base sm:text-lg md:text-xl font-medium ${isAcademy ? "text-amber-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]" : "text-neutral-100"} leading-snug`}>
                          « {translateHouseMotto(HOUSES[character.casa.toUpperCase()] ? hInfo.lema : (character.lema || hInfo.lema), lang)} »
                        </blockquote>
                      </div>
                    </div>

                    {/* Data grid: Casa Fundadora & Lema conditionally hidden when the house has a recognized crest */}
                    <div className="relative grid grid-cols-2 gap-3 text-xs font-mono mt-4">
                      {!hasRecognizedCrest(character.casa) && (
                        <>
                          <div>
                            <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.casa}</div>
                            {isQuickEditing ? (
                              <select
                                value={character.casa.toUpperCase()}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  const hData = HOUSES[newVal];
                                  const clone = {
                                    ...character,
                                    casa: newVal,
                                    lema: hData ? translateHouseMotto(hData.lema, lang) : (character.lema || ""),
                                    escudoText: hData ? hData.escudo : (character.escudoText || "")
                                  };
                                  saveStateToDB(clone);
                                }}
                                className="mt-1 w-full text-xs bg-neutral-950 text-amber-300 border border-neutral-800 rounded px-2 py-1 font-magic uppercase tracking-wider focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              >
                                {Object.keys(HOUSES).map((hKey) => (
                                  <option key={hKey} value={hKey}>
                                    {HOUSES[hKey].nombre}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="font-magic text-sm font-bold text-amber-300 uppercase tracking-wider mt-0.5">
                                {hInfo.nombre}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelMotto}</div>
                            <div className="text-amber-300 font-serif italic text-sm mt-0.5">
                              « {translateHouseMotto(HOUSES[character.casa.toUpperCase()] ? hInfo.lema : (character.lema || hInfo.lema), lang)} »
                            </div>
                          </div>
                        </>
                      )}

                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelProvenance}</div>
                        <div className="text-neutral-200 mt-0.5">{localizedLore.procedencia}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelColors}</div>
                        <div className="text-neutral-200 mt-0.5">{localizedLore.colores}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelElement}</div>
                        <div className="text-neutral-200 mt-0.5">{localizedLore.elemento}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelTotem}</div>
                        <div className="text-neutral-200 mt-0.5">{localizedLore.totem}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Row 2 on Desktop: Full-width container (md:col-span-2) with Aspectos Personales & Complicaciones side-by-side */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch" id="detail-aspectos-complicaciones-row">
              {/* Personal Aspects Panel (Left on Desktop; Position 3 on Mobile) */}
              <div className="glass-panel p-6 rounded-xl border border-violet-500/15 relative overflow-hidden h-full flex flex-col justify-between" id="detail-panel-aspectos">
                {isAcademy && (
                  <>
                    <FiligreeCorner position="tl" className="w-6 h-6" />
                    <FiligreeCorner position="tr" className="w-6 h-6" />
                    <FiligreeCorner position="bl" className="w-6 h-6" />
                    <FiligreeCorner position="br" className="w-6 h-6" />
                  </>
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <h3 className={`font-magic text-xs text-amber-400 uppercase tracking-widest ${isAcademy ? "pb-1" : "border-b border-violet-500/10 pb-2 mb-3"} flex items-center gap-2`}>
                    <span>🌟</span> {t.aspectosPersonales}
                  </h3>
                  {isAcademy && <CompassStarDivider className="-mt-1 mb-3" />}

                  {(() => {
                    const aspectList = Array.isArray(character.aspectosPersonales)
                      ? character.aspectosPersonales
                      : character.aspectosPersonales
                        ? [character.aspectosPersonales]
                        : [];

                    return (
                      <div className="space-y-3">
                        {aspectList.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {aspectList.map((aspect, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300 flex items-center justify-between gap-2"
                              >
                                <span>“ {aspect} ”</span>
                                {isQuickEditing && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAspect(idx)}
                                    className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                                    title={t.deleteAspect}
                                  >
                                    <X className="w-3.5 h-3.5 shrink-0" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-500 italic block text-center py-4 bg-neutral-950/10 border border-neutral-900 rounded-lg">
                            {t.labelAspectsEmpty}
                          </span>
                        )}

                        {isQuickEditing && (
                          <div className="flex gap-2 items-center bg-neutral-950/40 p-2 border border-violet-500/10 rounded-lg mt-2">
                            <input
                              type="text"
                              placeholder={t.placeholderAddAspect}
                              value={newPersonalAspectInput}
                              onChange={(e) => setNewPersonalAspectInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddNewAspect(newPersonalAspectInput);
                                  setNewPersonalAspectInput("");
                                }
                              }}
                              className="bg-neutral-900 text-xs text-neutral-200 px-2 py-1.5 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleAddNewAspect(newPersonalAspectInput);
                                setNewPersonalAspectInput("");
                              }}
                              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Complications Panel (Right on Desktop; Position 4 on Mobile) */}
              <div className="glass-panel p-6 rounded-xl border border-violet-500/15 relative overflow-hidden h-full flex flex-col justify-between" id="detail-panel-complicaciones">
                {isAcademy && (
                  <>
                    <FiligreeCorner position="tl" className="w-6 h-6" />
                    <FiligreeCorner position="tr" className="w-6 h-6" />
                    <FiligreeCorner position="bl" className="w-6 h-6" />
                    <FiligreeCorner position="br" className="w-6 h-6" />
                  </>
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <h3 className={`font-magic text-xs text-amber-400 uppercase tracking-widest ${isAcademy ? "pb-1" : "border-b border-violet-500/10 pb-2 mb-3"} flex items-center gap-2`}>
                    <span>⚠️</span> {t.complicaciones}
                  </h3>
                  {isAcademy && <CompassStarDivider className="-mt-1 mb-3" />}

                  {(() => {
                    const compList = Array.isArray(character.complicaciones)
                      ? character.complicaciones
                      : character.complicaciones
                        ? [character.complicaciones]
                        : [];

                    return (
                      <div className="space-y-3">
                        {compList.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {compList.map((comp, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-rose-300 flex items-center justify-between gap-2"
                              >
                                <span>“ {comp} ”</span>
                                {isQuickEditing && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComplication(idx)}
                                    className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                                    title={t.deleteComplication}
                                  >
                                    <X className="w-3.5 h-3.5 shrink-0" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-500 italic block text-center py-4 bg-neutral-950/10 border border-neutral-900 rounded-lg">
                            {t.labelComplicacionesEmpty}
                          </span>
                        )}

                        {isQuickEditing && (
                          <div className="flex gap-2 items-center bg-neutral-950/40 p-2 border border-violet-500/10 rounded-lg mt-2">
                            <input
                              type="text"
                              placeholder={t.placeholderAddComplication}
                              value={newComplicationInput}
                              onChange={(e) => setNewComplicationInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddNewComplication(newComplicationInput);
                                  setNewComplicationInput("");
                                }
                              }}
                              className="bg-neutral-900 text-xs text-neutral-200 px-2 py-1.5 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleAddNewComplication(newComplicationInput);
                                setNewComplicationInput("");
                              }}
                              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Full-width Custom Fields Panel in both styles */}
            {(isQuickEditing || (character.camposPersonalizados && character.camposPersonalizados.length > 0)) && (
              <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2 relative overflow-hidden" id="detail-panel-custom-fields">
                {isAcademy && (
                  <>
                    <FiligreeCorner position="tl" className="w-6 h-6" />
                    <FiligreeCorner position="tr" className="w-6 h-6" />
                    <FiligreeCorner position="bl" className="w-6 h-6" />
                    <FiligreeCorner position="br" className="w-6 h-6" />
                  </>
                )}
                <h3 className={`font-magic text-xs text-amber-400 uppercase tracking-widest ${isAcademy ? "pb-1" : "border-b border-violet-500/10 pb-2 mb-3"} flex items-center gap-2`}>
                  <span>🔮</span> {t.customFields}
                </h3>
                {isAcademy && <CompassStarDivider className="-mt-1 mb-3" />}
                {character.camposPersonalizados && character.camposPersonalizados.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {character.camposPersonalizados.map((fd, idx) => (
                      <div
                        key={idx}
                        className={
                          isAcademy
                            ? "p-3 bg-[#110c1c]/80 border border-[#c8a248]/35 rounded-lg text-xs flex items-center justify-between gap-2"
                            : "p-3 bg-neutral-950/50 border border-neutral-800 rounded-lg text-xs flex items-center justify-between gap-2"
                        }
                      >
                        {isQuickEditing ? (
                          <>
                            <input
                              type="text"
                              value={fd.nombre}
                              onChange={(e) => handleUpdateCustomField(idx, "nombre", e.target.value)}
                              placeholder={t.fieldName}
                              className="w-1/3 bg-neutral-900 text-amber-400 font-mono text-[10px] uppercase px-2 py-1 rounded border border-neutral-800 focus:outline-none focus:border-amber-500"
                            />
                            <input
                              type="text"
                              value={fd.valor}
                              onChange={(e) => handleUpdateCustomField(idx, "valor", e.target.value)}
                              placeholder={t.fieldValue}
                              className="flex-1 bg-neutral-900 text-neutral-200 text-xs px-2 py-1 rounded border border-neutral-800 focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(idx)}
                              className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                              title={t.deleteCustomField}
                            >
                              <X className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className={`font-mono text-[11px] ${isAcademy ? "text-[#f3d88c]" : "text-amber-400"} font-bold uppercase tracking-wider`}>
                              {fd.nombre}:
                            </span>
                            <span className="text-neutral-100 text-right font-sans">{fd.valor}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-500 italic block text-center py-3 bg-neutral-950/10 border border-neutral-900 rounded-lg">
                    {t.emptyCustomFields}
                  </span>
                )}

                {isQuickEditing && (
                  <div className={`flex flex-col sm:flex-row gap-2 items-center bg-neutral-950/40 p-2.5 border ${isAcademy ? "border-[#c8a248]/25" : "border-violet-500/10"} rounded-lg mt-3`}>
                    <input
                      type="text"
                      placeholder={t.fieldName}
                      value={newCustomFieldName}
                      onChange={(e) => setNewCustomFieldName(e.target.value)}
                      className="bg-neutral-900 text-xs text-neutral-200 px-2.5 py-1.5 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-5/12"
                    />
                    <div className="flex gap-2 w-full sm:flex-1">
                      <input
                        type="text"
                        placeholder={t.fieldValue}
                        value={newCustomFieldValue}
                        onChange={(e) => setNewCustomFieldValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomField();
                          }
                        }}
                        className="bg-neutral-900 text-xs text-neutral-200 px-2.5 py-1.5 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="p-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded cursor-pointer shrink-0"
                        title={t.addCustomField}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
  );
}
