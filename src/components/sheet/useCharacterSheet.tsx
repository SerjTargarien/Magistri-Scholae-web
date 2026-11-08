/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The character sheet's state and handlers (R3.4). The sheet is the server's
// model (src/model/sheet.ts), read from the store; every change is a single
// path edit through store.edit, list entries are addressed by their ID, and a
// field the viewer may not see is absent (never blank).
import React, { useState, useRef } from "react";
import { HOUSES } from "../../data/gameData";
import { getCharacterVisualTheme } from "../../utils/characterVisualTheme";
import { TRANSLATIONS, getLocalizedHouseLore } from "../../localization";
import { compressImage, getCroppedImg } from "../../utils/imageCompressor";
import { newItemId, type CharacterSheet, type FamiliarSheet, type JournalEntry } from "../../model/sheet";
import { saveSkillPreset } from "../../model/defaults";
import type { CharacterDetailProps } from "../../account/screens";

type TextList = "aspectosPersonales" | "complicaciones" | "aspectoTemporal";
type ConsequenceList = "consecuenciasFisicas" | "consecuenciasMentales" | "consecuenciasSociales";
type StressField = "estresFisico" | "estresMental" | "estresSocial";
type StressMaxField = "estresFisicoMax" | "estresMentalMax" | "estresSocialMax";

const MAX_PXS = 1_000_000;
const MAX_QUANTITY = 9999;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const sameName = (a: string | undefined, b: string) => !!a && a.trim().toLocaleLowerCase() === b.toLocaleLowerCase();

/** Archiving replaces deleting (owner decision); local texts so the shared localization stays untouched. */
const ARCHIVE_TEXT = {
  es: {
    button: "Archivar",
    title: "Archivar personaje",
    text: "¿Seguro que quieres archivar a este personaje? Dejará de aparecer en la campaña; su ficha, bitácora, galería, conjuros, pociones y equipo se conservan.",
    checkbox: "Entiendo que el personaje dejará de estar visible en la campaña.",
    confirm: "Archivar",
  },
  en: {
    button: "Archive",
    title: "Archive character",
    text: "Are you sure you want to archive this character? It will no longer appear in the campaign; its sheet, journal, gallery, spells, potions and belongings are kept.",
    checkbox: "I understand the character will no longer be visible in the campaign.",
    confirm: "Archive",
  },
} as const;

export function useCharacterSheet(sheetProps: CharacterDetailProps) {
  const {
    lang,
    store,
    catalogue,
    familiars,
    onBack,
    onArchive,
    onSelectFamiliar,
    onBondFamiliar,
    onOpenCreateFamiliar,
    onUploadImage,
    visualStyle = "academy",
  } = sheetProps;
  const character = store.fields as CharacterSheet;
  const capabilities = store.sheet.capabilities;
  const t = TRANSLATIONS[lang];
  const archiveText = ARCHIVE_TEXT[lang];
  const casa = character.casa ?? "";
  const hInfo = HOUSES[casa.toUpperCase()] || HOUSES.IRATI;
  const localizedLore = getLocalizedHouseLore(casa, lang);
  const characterType = character.characterType ?? "student";
  const theme = getCharacterVisualTheme({ characterType, casa });
  const isAcademy = visualStyle === "academy";

  // What this viewer may see and change.
  const writable = (path: string) => store.allowed(path);
  const readable = (path: string) => capabilities.readablePaths.some(p => p === path || p.startsWith(path + "/"));
  /** A scalar field is rendered only when the viewer may read or write it. */
  const shown = (path: string) => readable(path) || writable(path);
  const canAdd = (list: string) => capabilities.collectionPaths.includes(list);
  const canRemove = (list: string, id: string) => store.allowed(`${list}/${id}`);
  const canEditSheet = capabilities.writablePaths.length > 0 || capabilities.collectionPaths.length > 0 || capabilities.removablePaths.length > 0;
  const canBond = !!onBondFamiliar && capabilities.bondWritable;

  const profile = character.adultWizardProfile ?? {};
  const teachingSubjectsText = (profile.teachingSubjects ?? []).map(s => s.value).join(", ");

  const edit = (path: string, value: unknown) => store.edit(path, value);
  const addEntry = (list: string, entry: Record<string, unknown>) => store.edit(`${list}/${newItemId()}`, entry);
  const removeEntry = (list: string, id: string) => store.edit(`${list}/${id}`, null);

  const updateProfileField = (field: "role" | "institution" | "formerHouse" | "reputation" | "isTeacher", value: string | boolean) => {
    edit(`adultWizardProfile/${field}`, value);
  };

  // The subjects stay one comma-separated box for now; each change becomes
  // per-entry edits: unchanged subjects keep their entry, changed ones are
  // rewritten in place, new ones added and dropped ones removed.
  const updateTeachingSubjects = (text: string) => {
    const next = text.split(",").map(s => s.trim()).filter(Boolean);
    const current = profile.teachingSubjects ?? [];
    const unused = [...current];
    const unmatched: string[] = [];
    for (const value of next) {
      const index = unused.findIndex(entry => entry.value === value);
      if (index >= 0) unused.splice(index, 1);
      else unmatched.push(value);
    }
    const base = "adultWizardProfile/teachingSubjects";
    unmatched.forEach((value, i) => {
      const entry = unused[i];
      if (entry) edit(`${base}/${entry.id}/value`, value);
      else addEntry(base, { value });
    });
    unused.slice(unmatched.length).forEach(entry => removeEntry(base, entry.id));
  };

  // Tabs: perfil, sesion, habilidades, hechizos, notas, galeria
  const [activeTab, setActiveTab] = useState<"perfil" | "sesion" | "habilidades" | "hechizos" | "notas" | "galeria">("perfil");

  // Local/Temporary form states for spells & potions
  const [newSpellName, setNewSpellName] = useState("");
  const [newSpellVal, setNewSpellVal] = useState(1);
  const [newSpellSpec, setNewSpellSpec] = useState(false);

  const [newPotionName, setNewPotionName] = useState("");
  const [newPotionVal, setNewPotionVal] = useState(1);
  const [newPotionSpec, setNewPotionSpec] = useState(false);

  // Local/Temporary states for clubs and inventory items
  const [newClubName, setNewClubName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);

  // Local/Temporary states for individual journal notes
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Gallery view states (the lightbox holds a gallery entry's ID)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // Temporary aspects local input state
  const [newTempAspect, setNewTempAspect] = useState("");
  const [newPhysicalConsequence, setNewPhysicalConsequence] = useState("");
  const [newMentalConsequence, setNewMentalConsequence] = useState("");
  const [newSocialConsequence, setNewSocialConsequence] = useState("");

  // Quick Edit Mode states (a viewer who can change nothing never enters it)
  const [quickEditing, setIsQuickEditing] = useState(false);
  const isQuickEditing = canEditSheet && quickEditing;
  const [newPersonalAspectInput, setNewPersonalAspectInput] = useState("");
  const [newComplicationInput, setNewComplicationInput] = useState("");
  const [newCustomFieldName, setNewCustomFieldName] = useState("");
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Inline Note editing states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteContent, setEditingNoteContent] = useState("");

  // Cropper states for Portrait inside Quick Edit Mode
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Skills dynamic customization states, keyed by catalogue category ID
  const [newSkillNames, setNewSkillNames] = useState<Record<string, string>>({});
  const [skillErrorCat, setSkillErrorCat] = useState<string | null>(null);
  const [presetSavedSuccess, setPresetSavedSuccess] = useState(false);

  // Confirmation states to avoid window.confirm (blocked/unreliable in sandboxed iframes)
  const [isDeleteStudentOpen, setIsDeleteStudentOpen] = useState(false);
  const [deleteStudentUnderstood, setDeleteStudentUnderstood] = useState(false);
  const [minorDeleteTarget, setMinorDeleteTarget] = useState<{ id: string; type: "spell" | "potion" | "gallery" | "club" | "item" | "note" } | null>(null);
  const [isSelectFamiliarModalOpen, setIsSelectFamiliarModalOpen] = useState(false);

  // The bonded familiar, as this viewer sees it.
  const bondId = store.sheet.bondId;
  const bonded = bondId ? familiars.find((f) => f.id === bondId) : undefined;
  const linkedFamiliar = bonded ? { id: bonded.id, ...(bonded.fields as FamiliarSheet) } : undefined;

  const bondFamiliar = (familiarId: string | null) => {
    if (!onBondFamiliar) return;
    onBondFamiliar(familiarId).catch((err) => console.error("Familiar bond failed:", err));
  };

  // 1. Session Tracker / Increments
  const changeStat = (field: "pxs", count: number) => {
    edit(field, clamp((character[field] ?? 0) + count, 0, MAX_PXS));
  };

  const setDestinyPoints = (val: number) => {
    edit("puntosDestino", clamp(val, 0, 5));
  };

  const setStress = (field: StressField, value: number) => edit(field, value);

  const changeMaxStress = (maxField: StressMaxField, currentField: StressField, delta: number) => {
    const nextMax = clamp((character[maxField] || 3) + delta, 1, 10);
    // Lowering the maximum below the current value lowers the value first, so neither edit breaks the rule.
    if ((character[currentField] ?? 0) > nextMax) edit(currentField, nextMax);
    edit(maxField, nextMax);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawBase64 = event.target?.result as string;
        setCropImageSrc(rawBase64);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error reading file for avatar crop:", err);
    } finally {
      e.target.value = ""; // refresh picker
    }
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      setIsCropperOpen(false);
      setCropImageSrc(null);
      await onUploadImage("avatarImage", croppedBase64);
    } catch (err: any) {
      console.error("Portrait upload error:", err);
    }
  };

  const setAvatarFit = (fit: "cover" | "contain") => edit("avatarFit", fit);
  const removeAvatar = () => edit("avatarImage", "");

  // Aspects, complications and temporary aspects: one text per entry.
  const addText = (list: TextList, text: string) => {
    if (!text.trim()) return;
    addEntry(list, { value: text.trim() });
  };

  const handleDeleteAspect = (id: string) => removeEntry("aspectosPersonales", id);
  const handleAddNewAspect = (name: string) => addText("aspectosPersonales", name);
  const handleDeleteComplication = (id: string) => removeEntry("complicaciones", id);
  const handleAddNewComplication = (name: string) => addText("complicaciones", name);
  const handleAddTempAspect = (aspectName: string) => addText("aspectoTemporal", aspectName);
  const handleRemoveTempAspect = (id: string) => removeEntry("aspectoTemporal", id);

  const handleAddCustomField = () => {
    if (!newCustomFieldName.trim()) return;
    addEntry("camposPersonalizados", { nombre: newCustomFieldName.trim(), valor: newCustomFieldValue.trim() });
    setNewCustomFieldName("");
    setNewCustomFieldValue("");
  };

  const handleUpdateCustomField = (id: string, field: "nombre" | "valor", val: string) => {
    edit(`camposPersonalizados/${id}/${field}`, val);
  };

  const handleRemoveCustomField = (id: string) => removeEntry("camposPersonalizados", id);

  // Consequences: a description (the severity selector comes later).
  const addConsequence = (list: ConsequenceList, text: string) => {
    if (!text.trim()) return;
    addEntry(list, { descripcion: text.trim() });
  };

  const handleAddPhysicalConsequence = (name: string) => addConsequence("consecuenciasFisicas", name);
  const handleRemovePhysicalConsequence = (id: string) => removeEntry("consecuenciasFisicas", id);
  const handleAddMentalConsequence = (name: string) => addConsequence("consecuenciasMentales", name);
  const handleRemoveMentalConsequence = (id: string) => removeEntry("consecuenciasMentales", id);
  const handleAddSocialConsequence = (name: string) => addConsequence("consecuenciasSociales", name);
  const handleRemoveSocialConsequence = (id: string) => removeEntry("consecuenciasSociales", id);

  // 2. Skill Modifiers
  const changeSkillValue = (skillId: string, val: number) => {
    const skill = (character.habilidades ?? []).find(sk => sk.id === skillId);
    if (!skill) return;
    edit(`habilidades/${skillId}/valor`, clamp((skill.valor ?? 0) + val, 0, 5));
  };

  const handleNewSkillNameChange = (categoryId: string, val: string) => {
    setNewSkillNames(prev => ({ ...prev, [categoryId]: val }));
    if (skillErrorCat === categoryId) {
      setSkillErrorCat(null);
    }
  };

  /** Adds the player's own skill to a catalogue category; a name already in the catalogue (either language) or on the sheet is refused. */
  const handleAddSkill = (categoryId: string) => {
    const name = newSkillNames[categoryId]?.trim();
    if (!name) return;

    const exists = catalogue.habilidades.some(sk => Object.values(sk.nombre).some(n => sameName(n, name)))
      || (character.habilidades ?? []).some(sk => !sk.catalogo && sameName(sk.nombre, name));
    if (exists) {
      setSkillErrorCat(categoryId);
      return;
    }

    if (addEntry("habilidades", { nombre: name, categoria: categoryId, valor: 0 }).length) return;
    setNewSkillNames(prev => ({ ...prev, [categoryId]: "" }));
    setSkillErrorCat(null);
  };

  const handleRemoveSkill = (skillId: string) => removeEntry("habilidades", skillId);

  const handleSaveDefaultSkillPreset = () => {
    try {
      saveSkillPreset(character.habilidades ?? []);
      setPresetSavedSuccess(true);
      setTimeout(() => setPresetSavedSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to save skill preset:", e);
    }
  };

  // 3. Spells (Hechizos) Actions
  const addSpell = () => {
    if (!newSpellName.trim()) return;
    addEntry("conjuros", { nombre: newSpellName.trim(), valor: newSpellVal, specialized: newSpellSpec });

    // Reset controls
    setNewSpellName("");
    setNewSpellVal(1);
    setNewSpellSpec(false);
  };

  const removeSpell = (id: string) => {
    setMinorDeleteTarget({ id, type: "spell" });
  };

  const confirmRemoveSpell = (id: string) => {
    removeEntry("conjuros", id);
    setMinorDeleteTarget(null);
  };

  // 4. Potions ACTIONS
  const addPotion = () => {
    if (!newPotionName.trim()) return;
    addEntry("pociones", { nombre: newPotionName.trim(), valor: newPotionVal, specialized: newPotionSpec });

    // Reset controls
    setNewPotionName("");
    setNewPotionVal(1);
    setNewPotionSpec(false);
  };

  const removePotion = (id: string) => {
    setMinorDeleteTarget({ id, type: "potion" });
  };

  const confirmRemovePotion = (id: string) => {
    removeEntry("pociones", id);
    setMinorDeleteTarget(null);
  };

  // 6. Gallery: compressed on the device, then uploaded into a new entry.
  const galleryImages = (character.galleryImages ?? []).filter(pic => !!pic.value);

  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGalleryError(null);

    try {
      // Auto compress to under ~200-400KB so it never fails or crashes the client state
      const dataUrl = await compressImage(file, 1600, 1600, 0.75);
      const id = newItemId();
      if (store.edit(`galleryImages/${id}`, { value: "" }).length) throw new Error("gallery entry refused");
      try {
        await onUploadImage(`galleryImages/${id}/value`, dataUrl);
      } catch (err) {
        removeEntry("galleryImages", id); // no empty entry is left behind
        throw err;
      }
    } catch (err: any) {
      console.error("Gallery upload error:", err);
      setGalleryError(t.imageUploadError);
    } finally {
      e.target.value = ""; // refresh list
    }
  };

  const removeGalleryImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering click expansion
    setMinorDeleteTarget({ id, type: "gallery" });
  };

  const confirmRemoveGalleryImage = (id: string) => {
    removeEntry("galleryImages", id);
    setMinorDeleteTarget(null);
  };

  // 5b. Clubs Actions
  const handleAddClub = () => {
    if (!newClubName.trim()) return;
    addEntry("clubesList", { nombre: newClubName.trim() });
    setNewClubName("");
  };

  const handleRemoveClub = (id: string) => {
    setMinorDeleteTarget({ id, type: "club" });
  };

  const confirmRemoveClub = (id: string) => {
    removeEntry("clubesList", id);
    setMinorDeleteTarget(null);
  };

  // 5c. Equipment / Inventory Actions
  const handleAddInventoryItem = () => {
    if (!newItemName.trim()) return;
    addEntry("equipoList", { nombre: newItemName.trim(), cantidad: clamp(newItemQty, 1, MAX_QUANTITY) });
    setNewItemName("");
    setNewItemQty(1);
  };

  const handleChangeInventoryQty = (id: string, delta: number) => {
    const item = (character.equipoList ?? []).find(eq => eq.id === id);
    if (!item) return;
    edit(`equipoList/${id}/cantidad`, clamp((item.cantidad ?? 1) + delta, 1, MAX_QUANTITY));
  };

  const handleRemoveInventoryItem = (id: string) => {
    setMinorDeleteTarget({ id, type: "item" });
  };

  const confirmRemoveInventoryItem = (id: string) => {
    removeEntry("equipoList", id);
    setMinorDeleteTarget(null);
  };

  // 5d. Individual Diary Notes Actions
  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    addEntry("notasList", { titulo: newNoteNoteTitle(), contenido: newNoteContent.trim(), fecha: Date.now() });
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const handleStartEditNote = (note: JournalEntry) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.titulo ?? "");
    setEditingNoteContent(note.contenido ?? "");
  };

  /** Saves only the parts of the note that changed. */
  const handleSaveEditedNote = (id: string) => {
    if (!editingNoteContent.trim()) return;
    const note = (character.notasList ?? []).find(n => n.id === id);
    if (!note) return;
    const titulo = editingNoteTitle.trim() || note.titulo;
    const contenido = editingNoteContent.trim();
    if (titulo !== note.titulo) edit(`notasList/${id}/titulo`, titulo);
    if (contenido !== note.contenido) edit(`notasList/${id}/contenido`, contenido);
    setEditingNoteId(null);
    setEditingNoteTitle("");
    setEditingNoteContent("");
  };

  const newNoteNoteTitle = () => {
    if (newNoteTitle.trim()) return newNoteTitle.trim();
    // Default fallback name
    const timestamp = new Date().toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
    return t.entryFrom + timestamp;
  };

  const handleRemoveNote = (id: string) => {
    setMinorDeleteTarget({ id, type: "note" });
  };

  const confirmRemoveNote = (id: string) => {
    removeEntry("notasList", id);
    setMinorDeleteTarget(null);
  };

  // Archiving (GM only) with the strong double check
  const handleDeleteCharacterClick = () => {
    setDeleteStudentUnderstood(false);
    setIsDeleteStudentOpen(true);
  };

  const confirmDeleteCharacter = () => {
    if (deleteStudentUnderstood && onArchive) {
      setIsDeleteStudentOpen(false);
      onArchive();
    }
  };

  return {
    lang,
    store,
    catalogue,
    character,
    familiars,
    onBack,
    onArchive,
    onSelectFamiliar,
    onOpenCreateFamiliar,
    visualStyle,
    t,
    archiveText,
    hInfo,
    localizedLore,
    characterType,
    theme,
    isAcademy,
    writable,
    shown,
    canAdd,
    canRemove,
    canEditSheet,
    canBond,
    edit,
    profile,
    teachingSubjectsText,
    updateProfileField,
    updateTeachingSubjects,
    activeTab,
    setActiveTab,
    newSpellName,
    setNewSpellName,
    newSpellVal,
    setNewSpellVal,
    newSpellSpec,
    setNewSpellSpec,
    newPotionName,
    setNewPotionName,
    newPotionVal,
    setNewPotionVal,
    newPotionSpec,
    setNewPotionSpec,
    newClubName,
    setNewClubName,
    newItemName,
    setNewItemName,
    newItemQty,
    setNewItemQty,
    newNoteTitle,
    setNewNoteTitle,
    newNoteContent,
    setNewNoteContent,
    lightboxImage,
    setLightboxImage,
    galleryError,
    setGalleryError,
    newTempAspect,
    setNewTempAspect,
    newPhysicalConsequence,
    setNewPhysicalConsequence,
    newMentalConsequence,
    setNewMentalConsequence,
    newSocialConsequence,
    setNewSocialConsequence,
    isQuickEditing,
    setIsQuickEditing,
    newPersonalAspectInput,
    setNewPersonalAspectInput,
    newComplicationInput,
    setNewComplicationInput,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    avatarInputRef,
    editingNoteId,
    setEditingNoteId,
    editingNoteTitle,
    setEditingNoteTitle,
    editingNoteContent,
    setEditingNoteContent,
    cropImageSrc,
    setCropImageSrc,
    isCropperOpen,
    setIsCropperOpen,
    crop,
    setCrop,
    zoom,
    setZoom,
    newSkillNames,
    skillErrorCat,
    presetSavedSuccess,
    isDeleteStudentOpen,
    setIsDeleteStudentOpen,
    deleteStudentUnderstood,
    setDeleteStudentUnderstood,
    minorDeleteTarget,
    setMinorDeleteTarget,
    isSelectFamiliarModalOpen,
    setIsSelectFamiliarModalOpen,
    bondId,
    linkedFamiliar,
    bondFamiliar,
    changeStat,
    setDestinyPoints,
    setStress,
    changeMaxStress,
    handleAvatarChange,
    onCropComplete,
    handleConfirmCrop,
    setAvatarFit,
    removeAvatar,
    handleDeleteAspect,
    handleAddNewAspect,
    handleDeleteComplication,
    handleAddNewComplication,
    handleAddCustomField,
    handleUpdateCustomField,
    handleRemoveCustomField,
    handleAddTempAspect,
    handleRemoveTempAspect,
    handleAddPhysicalConsequence,
    handleRemovePhysicalConsequence,
    handleAddMentalConsequence,
    handleRemoveMentalConsequence,
    handleAddSocialConsequence,
    handleRemoveSocialConsequence,
    changeSkillValue,
    handleNewSkillNameChange,
    handleAddSkill,
    handleRemoveSkill,
    handleSaveDefaultSkillPreset,
    addSpell,
    removeSpell,
    confirmRemoveSpell,
    addPotion,
    removePotion,
    confirmRemovePotion,
    galleryImages,
    handleGalleryAdd,
    removeGalleryImage,
    confirmRemoveGalleryImage,
    handleAddClub,
    handleRemoveClub,
    confirmRemoveClub,
    handleAddInventoryItem,
    handleChangeInventoryQty,
    handleRemoveInventoryItem,
    confirmRemoveInventoryItem,
    handleAddNote,
    handleStartEditNote,
    handleSaveEditedNote,
    handleRemoveNote,
    confirmRemoveNote,
    handleDeleteCharacterClick,
    confirmDeleteCharacter,
  };
}

export type SheetContext = ReturnType<typeof useCharacterSheet>;
