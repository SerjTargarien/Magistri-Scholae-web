/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The character sheet's state and handlers, moved verbatim out of
// CharacterDetail.tsx (R3.4) so each tab can live in its own file.
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

import type { CharacterDetailProps } from "../CharacterDetail";

export function useCharacterSheet(sheetProps: CharacterDetailProps) {
  const {
  lang,
  character,
  familiars = [],
  onBack,
  onDelete,
  onUpdateCharacter,
  onSelectFamiliar,
  onBondFamiliar,
  onOpenCreateFamiliar,
  visualStyle = "academy",
  } = sheetProps;
  const t = TRANSLATIONS[lang];
  const hInfo = HOUSES[character.casa.toUpperCase()] || HOUSES.IRATI;
  const localizedLore = getLocalizedHouseLore(character.casa, lang);
  const characterType = getCharacterType(character);
  const theme = getCharacterVisualTheme(character);
  const isAcademy = visualStyle === "academy";

  const profile = character.adultWizardProfile || {
    role: "",
    institution: "",
    isTeacher: false,
    teachingSubjects: [],
    formerHouse: "",
    magicalFocus: "",
    reputation: "",
  };

  const updateProfileField = (field: string, value: any) => {
    const clone = {
      ...character,
      adultWizardProfile: {
        role: character.adultWizardProfile?.role || "",
        institution: character.adultWizardProfile?.institution || "",
        isTeacher: typeof character.adultWizardProfile?.isTeacher === "boolean" ? character.adultWizardProfile.isTeacher : false,
        teachingSubjects: character.adultWizardProfile?.teachingSubjects || [],
        formerHouse: character.adultWizardProfile?.formerHouse || "",
        magicalFocus: character.adultWizardProfile?.magicalFocus || "",
        reputation: character.adultWizardProfile?.reputation || "",
        [field]: value
      }
    };
    saveStateToDB(clone);
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

  // Gallery view states
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // Temporary aspects local input state
  const [newTempAspect, setNewTempAspect] = useState("");
  const [newPhysicalConsequence, setNewPhysicalConsequence] = useState("");
  const [newMentalConsequence, setNewMentalConsequence] = useState("");
  const [newSocialConsequence, setNewSocialConsequence] = useState("");

  // Quick Edit Mode states
  const [isQuickEditing, setIsQuickEditing] = useState(false);
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

  // Skills dynamic customization states
  const [newSkillNames, setNewSkillNames] = useState<Record<string, string>>({});
  const [skillErrorCat, setSkillErrorCat] = useState<string | null>(null);
  const [presetSavedSuccess, setPresetSavedSuccess] = useState(false);

  // Confirmation states to avoid window.confirm (blocked/unreliable in sandboxed iframes)
  const [isDeleteStudentOpen, setIsDeleteStudentOpen] = useState(false);
  const [deleteStudentUnderstood, setDeleteStudentUnderstood] = useState(false);
  const [minorDeleteTarget, setMinorDeleteTarget] = useState<{ id: string | number; type: "spell" | "potion" | "gallery" | "club" | "item" | "note" } | null>(null);
  const [isSelectFamiliarModalOpen, setIsSelectFamiliarModalOpen] = useState(false);

  const linkedFamiliar = character.familiarId
    ? familiars.find((f) => f.id === character.familiarId)
    : undefined;

  // Safe Auto-Save to IndexedDB helper
  const saveStateToDB = async (updatedChar: Character) => {
    if (!updatedChar.id) return;
    try {
      updatedChar.updatedAt = Date.now();
      const saved = await storage.characters.save(updatedChar);
      onUpdateCharacter(saved);
    } catch (e) {
      console.error("IndexedDB auto-save failed:", e);
    }
  };

  // 1. Session Tracker / Increments
  const changeStat = (field: keyof Character, count: number, maxValueField?: keyof Character) => {
    // Make sure we clone the character properly
    const clone = { ...character };
    const currentVal = (clone[field] as number) || 0;
    const maxVal = maxValueField ? (clone[maxValueField] as number) || 5 : 99;

    const newVal = Math.max(0, Math.min(maxVal, currentVal + count));
    (clone[field] as any) = newVal;

    saveStateToDB(clone);
  };

  const setDestinyPoints = (val: number) => {
    const clone = { ...character };
    clone.puntosDestino = Math.max(0, Math.min(5, val));
    saveStateToDB(clone);
  };

  const changeMaxStress = (
    maxField: "estresFisicoMax" | "estresMentalMax" | "estresSocialMax",
    currentField: "estresFisico" | "estresMental" | "estresSocial",
    delta: number
  ) => {
    const clone = { ...character };
    const currentMax = (clone[maxField] as number) || 3;
    const nextMax = Math.max(1, Math.min(10, currentMax + delta));
    clone[maxField] = nextMax;
    if ((clone[currentField] as number) > nextMax) {
      clone[currentField] = nextMax;
    }
    saveStateToDB(clone);
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
      const clone = { ...character, avatarImage: croppedBase64 };
      saveStateToDB(clone);
      setIsCropperOpen(false);
      setCropImageSrc(null);
    } catch (err: any) {
      console.error("Cropping confirm error:", err);
    }
  };

  const handleDeleteAspect = (idx: number) => {
    const list = Array.isArray(character.aspectosPersonales)
      ? character.aspectosPersonales
      : (character.aspectosPersonales ? [character.aspectosPersonales] : []);
    const clone = {
      ...character,
      aspectosPersonales: list.filter((_, i) => i !== idx)
    };
    saveStateToDB(clone);
  };

  const handleAddNewAspect = (name: string) => {
    if (!name.trim()) return;
    const list = Array.isArray(character.aspectosPersonales)
      ? character.aspectosPersonales
      : (character.aspectosPersonales ? [character.aspectosPersonales] : []);
    const clone = {
      ...character,
      aspectosPersonales: [...list, name.trim()]
    };
    saveStateToDB(clone);
  };

  const handleDeleteComplication = (idx: number) => {
    const list = Array.isArray(character.complicaciones)
      ? character.complicaciones
      : (character.complicaciones ? [character.complicaciones] : []);
    const clone = {
      ...character,
      complicaciones: list.filter((_, i) => i !== idx)
    };
    saveStateToDB(clone);
  };

  const handleAddNewComplication = (name: string) => {
    if (!name.trim()) return;
    const list = Array.isArray(character.complicaciones)
      ? character.complicaciones
      : (character.complicaciones ? [character.complicaciones] : []);
    const clone = {
      ...character,
      complicaciones: [...list, name.trim()]
    };
    saveStateToDB(clone);
  };

  const handleAddCustomField = () => {
    if (!newCustomFieldName.trim()) return;
    const list = Array.isArray(character.camposPersonalizados)
      ? character.camposPersonalizados
      : [];
    const clone = {
      ...character,
      camposPersonalizados: [
        ...list,
        { nombre: newCustomFieldName.trim(), valor: newCustomFieldValue.trim() }
      ]
    };
    saveStateToDB(clone);
    setNewCustomFieldName("");
    setNewCustomFieldValue("");
  };

  const handleUpdateCustomField = (idx: number, field: "nombre" | "valor", val: string) => {
    const list = Array.isArray(character.camposPersonalizados)
      ? [...character.camposPersonalizados]
      : [];
    if (!list[idx]) return;
    list[idx] = { ...list[idx], [field]: val };
    const clone = {
      ...character,
      camposPersonalizados: list
    };
    saveStateToDB(clone);
  };

  const handleRemoveCustomField = (idx: number) => {
    const list = Array.isArray(character.camposPersonalizados)
      ? character.camposPersonalizados
      : [];
    const clone = {
      ...character,
      camposPersonalizados: list.filter((_, i) => i !== idx)
    };
    saveStateToDB(clone);
  };

  const handleAddTempAspect = (aspectName: string) => {
    if (!aspectName.trim()) return;
    const list = Array.isArray(character.aspectoTemporal)
      ? character.aspectoTemporal
      : (character.aspectoTemporal ? [character.aspectoTemporal] : []);
    const clone = {
      ...character,
      aspectoTemporal: [...list, aspectName.trim()]
    };
    saveStateToDB(clone);
  };

  const handleRemoveTempAspect = (idx: number) => {
    const list = Array.isArray(character.aspectoTemporal)
      ? character.aspectoTemporal
      : (character.aspectoTemporal ? [character.aspectoTemporal] : []);
    const clone = {
      ...character,
      aspectoTemporal: list.filter((_, i) => i !== idx)
    };
    saveStateToDB(clone);
  };

  const handleAddPhysicalConsequence = (name: string) => {
    if (!name.trim()) return;
    const list = Array.isArray(character.consecuenciasFisicas)
      ? character.consecuenciasFisicas
      : [];
    const clone = {
      ...character,
      consecuenciasFisicas: [...list, name.trim()]
    };
    saveStateToDB(clone);
  };

  const handleRemovePhysicalConsequence = (idx: number) => {
    const list = Array.isArray(character.consecuenciasFisicas)
      ? character.consecuenciasFisicas
      : [];
    const clone = {
      ...character,
      consecuenciasFisicas: list.filter((_, i) => i !== idx)
    };
    saveStateToDB(clone);
  };

  const handleAddMentalConsequence = (name: string) => {
    if (!name.trim()) return;
    const list = Array.isArray(character.consecuenciasMentales)
      ? character.consecuenciasMentales
      : [];
    const clone = {
      ...character,
      consecuenciasMentales: [...list, name.trim()]
    };
    saveStateToDB(clone);
  };

  const handleRemoveMentalConsequence = (idx: number) => {
    const list = Array.isArray(character.consecuenciasMentales)
      ? character.consecuenciasMentales
      : [];
    const clone = {
      ...character,
      consecuenciasMentales: list.filter((_, i) => i !== idx)
    };
    saveStateToDB(clone);
  };

  const handleAddSocialConsequence = (name: string) => {
    if (!name.trim()) return;
    const list = Array.isArray(character.consecuenciasSociales)
      ? character.consecuenciasSociales
      : [];
    const clone = {
      ...character,
      consecuenciasSociales: [...list, name.trim()]
    };
    saveStateToDB(clone);
  };

  const handleRemoveSocialConsequence = (idx: number) => {
    const list = Array.isArray(character.consecuenciasSociales)
      ? character.consecuenciasSociales
      : [];
    const clone = {
      ...character,
      consecuenciasSociales: list.filter((_, i) => i !== idx)
    };
    saveStateToDB(clone);
  };

  // 2. Skill Modifiers
  const changeSkillValue = (skillIdx: number, val: number) => {
    const clone = { ...character };
    const skills = [...clone.habilidades];
    const originalSkill = skills[skillIdx];

    // Ensure base level from 0 to 5 for standard play
    const newVal = Math.max(0, Math.min(5, originalSkill.valor + val));
    skills[skillIdx] = { ...originalSkill, valor: newVal };
    clone.habilidades = skills;

    saveStateToDB(clone);
  };

  const handleNewSkillNameChange = (catKey: string, val: string) => {
    setNewSkillNames(prev => ({ ...prev, [catKey]: val }));
    if (skillErrorCat === catKey) {
      setSkillErrorCat(null);
    }
  };

  const handleAddSkill = (catKey: string) => {
    const name = newSkillNames[catKey]?.trim();
    if (!name) return;

    // Check if skill already exists (including canonical translations)
    const exists = character.habilidades.some(sk => areSameSkill(sk.nombre, name));
    if (exists) {
      setSkillErrorCat(catKey);
      return;
    }

    const newSkill: Skill = {
      nombre: name,
      categoria: catKey,
      valor: 0
    };

    const clone = {
      ...character,
      habilidades: [...character.habilidades, newSkill]
    };
    saveStateToDB(clone);
    setNewSkillNames(prev => ({ ...prev, [catKey]: "" }));
    setSkillErrorCat(null);
  };

  const handleRemoveSkill = (skillIdx: number) => {
    const clone = {
      ...character,
      habilidades: character.habilidades.filter((_, i) => i !== skillIdx)
    };
    saveStateToDB(clone);
  };

  const handleSaveDefaultSkillPreset = () => {
    try {
      localStorage.setItem("magistri_default_skills_preset", JSON.stringify(character.habilidades));
      setPresetSavedSuccess(true);
      setTimeout(() => setPresetSavedSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to save skill preset:", e);
    }
  };

  // 3. Spells (Hechizos) Actions
  const addSpell = () => {
    if (!newSpellName.trim()) return;
    const newSpell: Spell = {
      id: "spell_" + Date.now(),
      nombre: newSpellName.trim(),
      valor: newSpellVal,
      specialized: newSpellSpec,
    };
    const clone = {
      ...character,
      conjuros: [...(character.conjuros || []), newSpell]
    };
    saveStateToDB(clone);

    // Reset controls
    setNewSpellName("");
    setNewSpellVal(1);
    setNewSpellSpec(false);
  };

  const removeSpell = (id: string) => {
    setMinorDeleteTarget({ id, type: "spell" });
  };

  const confirmRemoveSpell = (id: string) => {
    const clone = {
      ...character,
      conjuros: (character.conjuros || []).filter(sp => sp.id !== id)
    };
    saveStateToDB(clone);
    setMinorDeleteTarget(null);
  };

  // 4. Potions ACTIONS
  const addPotion = () => {
    if (!newPotionName.trim()) return;
    const newPotion: Potion = {
      id: "potion_" + Date.now(),
      nombre: newPotionName.trim(),
      valor: newPotionVal,
      specialized: newPotionSpec,
    };
    const clone = {
      ...character,
      pociones: [...(character.pociones || []), newPotion]
    };
    saveStateToDB(clone);

    // Reset controls
    setNewPotionName("");
    setNewPotionVal(1);
    setNewPotionSpec(false);
  };

  const removePotion = (id: string) => {
    setMinorDeleteTarget({ id, type: "potion" });
  };

  const confirmRemovePotion = (id: string) => {
    const clone = {
      ...character,
      pociones: (character.pociones || []).filter(po => po.id !== id)
    };
    saveStateToDB(clone);
    setMinorDeleteTarget(null);
  };

  // 6. Gallery base64 attachment with automatic compression & state errors (no blocking alert)
  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGalleryError(null);

    try {
      // Auto compress to under ~200-400KB so it never fails or crashes the client state
      const base64Str = await compressImage(file, 1600, 1600, 0.75);

      const clone = {
        ...character,
        galleryImages: [...(character.galleryImages || []), base64Str]
      };
      saveStateToDB(clone);
    } catch (err: any) {
      console.error("Gallery compress error:", err);
      setGalleryError(t.imageUploadError);
    } finally {
      e.target.value = ""; // refresh list
    }
  };

  const removeGalleryImage = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering click expansion
    setMinorDeleteTarget({ id: idx, type: "gallery" });
  };

  const confirmRemoveGalleryImage = (idx: number) => {
    const clone = {
      ...character,
      galleryImages: (character.galleryImages || []).filter((_, i) => i !== idx)
    };
    saveStateToDB(clone);
    setMinorDeleteTarget(null);
  };

  // 5b. Clubs Actions
  const handleAddClub = () => {
    if (!newClubName.trim()) return;
    const newClub: Club = {
      id: "club_" + Date.now(),
      nombre: newClubName.trim()
    };
    const clone = {
      ...character,
      clubesList: [...(character.clubesList || []), newClub]
    };
    saveStateToDB(clone);
    setNewClubName("");
  };

  const handleRemoveClub = (id: string) => {
    setMinorDeleteTarget({ id, type: "club" });
  };

  const confirmRemoveClub = (id: string) => {
    const clone = {
      ...character,
      clubesList: (character.clubesList || []).filter(cl => cl.id !== id)
    };
    saveStateToDB(clone);
    setMinorDeleteTarget(null);
  };

  // 5c. Equipment / Inventory Actions
  const handleAddInventoryItem = () => {
    if (!newItemName.trim()) return;
    const newItem: InventoryItem = {
      id: "item_" + Date.now(),
      nombre: newItemName.trim(),
      cantidad: Math.max(1, newItemQty)
    };
    const clone = {
      ...character,
      equipoList: [...(character.equipoList || []), newItem]
    };
    saveStateToDB(clone);
    setNewItemName("");
    setNewItemQty(1);
  };

  const handleChangeInventoryQty = (id: string, delta: number) => {
    const list = (character.equipoList || []).map(eq => {
      if (eq.id === id) {
        return { ...eq, cantidad: Math.max(1, eq.cantidad + delta) };
      }
      return eq;
    });
    const clone = {
      ...character,
      equipoList: list
    };
    saveStateToDB(clone);
  };

  const handleRemoveInventoryItem = (id: string) => {
    setMinorDeleteTarget({ id, type: "item" });
  };

  const confirmRemoveInventoryItem = (id: string) => {
    const clone = {
      ...character,
      equipoList: (character.equipoList || []).filter(eq => eq.id !== id)
    };
    saveStateToDB(clone);
    setMinorDeleteTarget(null);
  };

  // 5d. Individual Diary Notes Actions
  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    const noteTitle = newNoteNoteTitle();
    const newNote = {
      id: "note_" + Date.now(),
      titulo: noteTitle,
      contenido: newNoteContent.trim(),
      fecha: Date.now()
    };
    const clone = {
      ...character,
      notasList: [...(character.notasList || []), newNote]
    };
    saveStateToDB(clone);
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const handleStartEditNote = (note: { id: string; titulo: string; contenido: string }) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.titulo);
    setEditingNoteContent(note.contenido);
  };

  const handleSaveEditedNote = (id: string) => {
    if (!editingNoteContent.trim()) return;
    const updatedNotes = (character.notasList || []).map(n => {
      if (n.id === id) {
        return {
          ...n,
          titulo: editingNoteTitle.trim() || n.titulo,
          contenido: editingNoteContent.trim(),
        };
      }
      return n;
    });
    const clone = {
      ...character,
      notasList: updatedNotes
    };
    saveStateToDB(clone);
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
    const clone = {
      ...character,
      notasList: (character.notasList || []).filter(n => n.id !== id)
    };
    saveStateToDB(clone);
    setMinorDeleteTarget(null);
  };

  // Automated legacy compatibility migration useEffect
  useEffect(() => {
    let changed = false;
    const clone = { ...character };

    if (
      character.estresMentalConsecuencia &&
      character.estresMentalConsecuencia.trim() &&
      (!character.consecuenciasMentales || character.consecuenciasMentales.length === 0)
    ) {
      clone.consecuenciasMentales = [character.estresMentalConsecuencia.trim()];
      clone.estresMentalConsecuencia = "";
      changed = true;
    }

    if (character.notas && character.notas.trim() && (!character.notasList || character.notasList.length === 0)) {
      const legacyNote = {
        id: "note_mig_" + Date.now(),
        titulo: t.consolidatedJournal,
        contenido: character.notas,
        fecha: Date.now()
      };
      clone.notasList = [legacyNote];
      clone.notas = ""; // clear so we don't migrate again
      changed = true;
    }

    if (character.clubes && (!character.clubesList || character.clubesList.length === 0)) {
      const splitClubs = character.clubes
        .split(/[,\n;]/)
        .map(c => c.trim())
        .filter(Boolean);
      if (splitClubs.length > 0) {
        clone.clubesList = splitClubs.map((clubStr, idx) => ({
          id: `club_mig_${idx}_${Date.now() + idx}`,
          nombre: clubStr
        }));
        clone.clubes = ""; // clear so we don't migrate again
        changed = true;
      }
    }

    if (character.equipo && (!character.equipoList || character.equipoList.length === 0)) {
      const splitEquips = character.equipo
        .split(/[,\n;]/)
        .map(e => e.trim())
        .filter(Boolean);
      if (splitEquips.length > 0) {
        clone.equipoList = splitEquips.map((eqStr, idx) => {
          let cantidad = 1;
          let nombre = eqStr;
          const qtyRegexStart = /^(\d+)\s*[xX*]\s*(.+)$/;
          const qtyRegexEnd = /^(.+)\s*\((\d+)\)$/;
          if (qtyRegexStart.test(eqStr)) {
            const match = eqStr.match(qtyRegexStart);
            if (match) {
              cantidad = parseInt(match[1]) || 1;
              nombre = match[2].trim();
            }
          } else if (qtyRegexEnd.test(eqStr)) {
            const match = eqStr.match(qtyRegexEnd);
            if (match) {
              cantidad = parseInt(match[2]) || 1;
              nombre = match[1].trim();
            }
          }
          return {
            id: `item_mig_${idx}_${Date.now() + idx}`,
            nombre,
            cantidad
          };
        });
        clone.equipo = ""; // clear so we don't migrate again
        changed = true;
      }
    }

    if (changed) {
      saveStateToDB(clone);
    }
  }, [character]);

  // Destructive character purge with strong check
  const handleDeleteCharacterClick = () => {
    setDeleteStudentUnderstood(false);
    setIsDeleteStudentOpen(true);
  };

  const confirmDeleteCharacter = () => {
    if (deleteStudentUnderstood && character.id) {
      setIsDeleteStudentOpen(false);
      onDelete(character.id);
    }
  };

  const handleExportCharacter = async () => {
    try {
      const backupData = await storage.backups.export([character.id!]);
      
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const cleanName = (character.nombre || "student")
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toUpperCase();
        
      const getExportTimestamp = () => {
        const now = new Date();
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      };

      const filename = `${getExportTimestamp()}_magistri_scholae_${cleanName}.json`;
      
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export individual student character:", err);
    }
  };

  // Category Translation Helpers
  const getCategoryTitle = (catKey: string) => {
    switch (catKey) {
      case "Físicas": return t.catFisicas;
      case "Mentales": return t.catMentales;
      case "Sociales": return t.catSociales;
      case "Asignaturas Troncales": return t.catTroncales;
      case "Asignaturas Optativas": return t.catOptativas;
      default: return catKey;
    }
  };

  return {
    lang,
    character,
    familiars,
    onBack,
    onDelete,
    onUpdateCharacter,
    onSelectFamiliar,
    onBondFamiliar,
    onOpenCreateFamiliar,
    visualStyle,
    t,
    hInfo,
    localizedLore,
    characterType,
    theme,
    isAcademy,
    profile,
    updateProfileField,
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
    croppedAreaPixels,
    setCroppedAreaPixels,
    newSkillNames,
    setNewSkillNames,
    skillErrorCat,
    setSkillErrorCat,
    presetSavedSuccess,
    setPresetSavedSuccess,
    isDeleteStudentOpen,
    setIsDeleteStudentOpen,
    deleteStudentUnderstood,
    setDeleteStudentUnderstood,
    minorDeleteTarget,
    setMinorDeleteTarget,
    isSelectFamiliarModalOpen,
    setIsSelectFamiliarModalOpen,
    linkedFamiliar,
    saveStateToDB,
    changeStat,
    setDestinyPoints,
    changeMaxStress,
    handleAvatarChange,
    onCropComplete,
    handleConfirmCrop,
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
    newNoteNoteTitle,
    handleRemoveNote,
    confirmRemoveNote,
    handleDeleteCharacterClick,
    confirmDeleteCharacter,
    handleExportCharacter,
    getCategoryTitle,
  };
}

export type SheetContext = ReturnType<typeof useCharacterSheet>;
