/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Character, Familiar, HOUSES, Spell, Potion, Skill, Club, InventoryItem, HOUSE_ICONS, getCharacterType, VisualStyle } from "../types";
import { getCharacterVisualTheme } from "../utils/characterVisualTheme";
import {
  Language,
  TRANSLATIONS,
  translateSkillName,
  translateHouseMotto,
  getLocalizedHouseLore,
  areSameSkill
} from "../localization";
import { FiligreeCorner, CompassStarDivider } from "./AcademyOrnaments";
import { HouseCrest, hasRecognizedCrest } from "./HouseCrest";
import { db } from "../db";
import Cropper from "react-easy-crop";
import { compressImage, getCroppedImg } from "../utils/imageCompressor";
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

interface CharacterDetailProps {
  lang: Language;
  character: Character;
  familiars?: Familiar[];
  onBack: () => void;
  onDelete: (id: number) => void;
  onUpdateCharacter: (updated: Character) => void; // For immediate state updates
  onSelectFamiliar?: (familiarId: string) => void;
  onBondFamiliar?: (characterId: number, familiarId: string | null) => void;
  onOpenCreateFamiliar?: () => void;
  visualStyle?: VisualStyle;
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({
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
}) => {
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
      await db.characters.put(updatedChar);
      onUpdateCharacter(updatedChar);
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

  const handleExportCharacter = () => {
    try {
      const backupData = {
        backupVersion: "1.0",
        app: "Magistri Scholae",
        exportedAt: new Date().toISOString(),
        characters: [character],
      };
      
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4" id="character-detail-screen">
      <div className={isAcademy ? "academy-outer-frame rounded-2xl p-4 sm:p-6 relative" : ""}>
        {isAcademy && (
          <>
            <FiligreeCorner position="tl" className="w-8 h-8" />
            <FiligreeCorner position="tr" className="w-8 h-8" />
            <FiligreeCorner position="bl" className="w-8 h-8" />
            <FiligreeCorner position="br" className="w-8 h-8" />
          </>
        )}

      {/* Top Navigation & Action Bar - Highly Visible with 44px+ touch targets */}
      <div
        className={
          isAcademy
            ? "flex flex-row justify-between items-center mb-5 bg-[#120e1c]/90 border border-[#c8a248]/35 p-2.5 rounded-xl gap-2 z-20 relative shadow-lg"
            : "flex flex-row justify-between items-center mb-6 bg-white/5 border border-white/10 p-3 rounded-xl gap-2 z-20 relative shadow-sm"
        }
        id="detail-top-nav-bar"
      >
        <button
          id="btn-detail-back"
          onClick={onBack}
          className={
            isAcademy
              ? "flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-[#f3e5c0] bg-gradient-to-b from-[#231c35] to-[#130f1e] border border-[#c8a248]/50 rounded-lg hover:border-[#f3d88c] focus:outline-none min-h-[40px] transition-all cursor-pointer select-none shrink-0 shadow-sm"
              : "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-neutral-100 bg-neutral-900 border border-neutral-700 rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[44px] transition-all cursor-pointer select-none shrink-0"
          }
        >
          <ArrowLeft className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t.back}</span>
        </button>

        <div className="flex gap-2">
          {/* Direct Student Export Button */}
          <button
            id="btn-detail-export"
            onClick={handleExportCharacter}
            title={t.exportStudent}
            className={
              isAcademy
                ? "flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-[#e6d5b8] bg-gradient-to-b from-[#281c40] to-[#160f26] border border-[#c8a248]/45 hover:border-[#f3d88c] rounded-lg focus:outline-none min-h-[40px] transition-all cursor-pointer select-none shadow-sm"
                : "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-violet-100 bg-violet-950/70 border border-violet-500/35 hover:bg-violet-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px] transition-all cursor-pointer select-none"
            }
          >
            <Upload className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="hidden md:inline">{t.exportStudent}</span>
          </button>

          {/* Edit Button */}
          <button
            id="btn-detail-edit"
            onClick={() => setIsQuickEditing(!isQuickEditing)}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg focus:outline-none min-h-[40px] transition-all cursor-pointer select-none ${
              isQuickEditing 
                ? "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400" 
                : isAcademy
                  ? "text-[#1a1105] bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] hover:brightness-110 border border-[#fce8a6] shadow-md"
                  : "text-neutral-950 bg-amber-500 hover:bg-amber-400 focus:ring-amber-500/50"
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

          {/* Delete Button */}
          <button
            id="btn-detail-delete"
            onClick={handleDeleteCharacterClick}
            className={
              isAcademy
                ? "flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-rose-200 bg-gradient-to-b from-[#4c1420] to-[#280910] border border-[#c8a248]/40 hover:border-rose-400 hover:text-white rounded-lg focus:outline-none min-h-[40px] transition-all cursor-pointer select-none shadow-sm"
                : "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-300 bg-rose-950/70 border border-rose-500/30 hover:bg-rose-900 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 min-h-[44px] transition-all cursor-pointer select-none"
            }
          >
            <Trash2 className="w-4 h-4 shrink-0 text-rose-300" />
            <span className="hidden sm:inline">{t.delete}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Profile Cover Banner */}
      <div
        className={
          isAcademy
            ? `relative w-full rounded-xl overflow-hidden bg-gradient-to-r ${theme.bgClass} border-2 border-[#c8a248]/65 p-5 md:p-6 mb-5 flex flex-col md:flex-row gap-4 md:gap-6 items-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]`
            : `relative w-full rounded-2xl overflow-hidden bg-gradient-to-r ${theme.bgClass} border ${theme.borderClass} p-5 md:p-6 mb-6 flex flex-col md:flex-row gap-4 md:gap-6 items-center shadow-lg shadow-neutral-950/40`
        }
      >
        {isAcademy ? (
          <>
            <FiligreeCorner position="tl" className="w-7 h-7 z-10" />
            <FiligreeCorner position="tr" className="w-7 h-7 z-10" />
            <FiligreeCorner position="bl" className="w-7 h-7 z-10" />
            <FiligreeCorner position="br" className="w-7 h-7 z-10" />
          </>
        ) : (
          <>
            {/* Decorative corner glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none"></div>
          </>
        )}

        {/* Left Aspect - Avatar (+ Mobile Corner Familiar & Mobile Compact Crest) */}
        <div className="shrink-0 flex flex-col items-center gap-2.5 relative z-10">
          <div className="flex items-center justify-center">
            {/* Wizard Portrait Wrapper (with Mobile Corner-Overlaid Familiar & Bottom-Left Discrete Crest) */}
            <div className="relative">
              <div
                onClick={isQuickEditing ? () => avatarInputRef.current?.click() : undefined}
                className={`w-28 aspect-[3/4] bg-neutral-950 rounded-xl ${
                  isAcademy
                    ? "border-2 border-[#c8a248] shadow-[0_0_20px_rgba(0,0,0,0.85)]"
                    : "border border-violet-500/30 shadow-md"
                } overflow-hidden flex items-center justify-center relative ${
                  isQuickEditing ? "cursor-pointer hover:ring-2 hover:ring-amber-500 transition-all select-none" : ""
                }`}
              >
                {character.avatarImage ? (
                  <img
                    src={character.avatarImage}
                    alt={character.nombre}
                    className={`w-full h-full ${character.avatarFit === "contain" ? "object-contain bg-[#11091f]" : "object-cover"}`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center text-[10px] font-mono text-neutral-400 uppercase select-none p-2 flex flex-col items-center justify-center">
                    <HouseCrest
                      house={character.casa}
                      isAdultWizard={characterType === "adult_wizard"}
                      className="w-16 h-20 mb-1"
                    />
                    {t.noPortrait}
                  </div>
                )}

                {/* Editing overlay */}
                {isQuickEditing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-1 text-[10px] font-mono text-amber-300">
                    <ImageIcon className="w-5 h-5 mb-1 text-amber-400" />
                    <span>{t.btnChangePhoto}</span>
                  </div>
                )}
              </div>

              {/* Mobile-Only Discrete House Crest in Bottom-Left Corner of Student Photo (< md) */}
              <div className="flex md:hidden items-center justify-center absolute -bottom-1.5 -left-2 z-20 pointer-events-none">
                <HouseCrest
                  house={character.casa}
                  isAdultWizard={characterType === "adult_wizard"}
                  className="w-7 h-9 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] opacity-95"
                />
              </div>

              {/* Mobile-Only Corner Overlaid Familiar Portrait (< md) */}
              {(linkedFamiliar || isQuickEditing) && (
                <div className="md:hidden absolute -bottom-2.5 -right-5 z-20">
                  {linkedFamiliar ? (
                    <div
                      id="header-familiar-card-mobile"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isQuickEditing) {
                          setIsSelectFamiliarModalOpen(true);
                        } else if (onSelectFamiliar) {
                          onSelectFamiliar(linkedFamiliar.id);
                        }
                      }}
                      title={isQuickEditing ? t.familiarChangeBond : t.familiarViewDetail}
                      className={`group w-14 aspect-[3/4] bg-neutral-950 rounded-lg overflow-hidden flex items-center justify-center relative cursor-pointer select-none transition-transform active:scale-95 shadow-[0_6px_16px_rgba(0,0,0,0.95)] ring-2 ring-black/80 ${
                        isAcademy
                          ? "border-2 border-[#fce8a6]"
                          : "border-2 border-emerald-400/80"
                      }`}
                    >
                      {linkedFamiliar.imagen ? (
                        <img
                          src={linkedFamiliar.imagen}
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
                          className={`font-magic text-[8px] font-bold uppercase tracking-wider truncate ${
                            isAcademy ? "text-[#fce8a6]" : "text-emerald-200"
                          }`}
                        >
                          {linkedFamiliar.nombre || t.noName}
                        </div>
                      </div>

                      {/* Quick Edit Mode overlay on mobile corner badge */}
                      {isQuickEditing && (
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
                      className={`w-14 aspect-[3/4] rounded-lg flex flex-col items-center justify-center p-1 text-center transition-all cursor-pointer select-none shadow-[0_6px_16px_rgba(0,0,0,0.95)] ring-2 ring-black/80 ${
                        isAcademy
                          ? "bg-[#120d1a]/95 border-2 border-dashed border-[#c8a248] text-[#fce8a6]"
                          : "bg-neutral-950/95 border-2 border-dashed border-emerald-500/60 text-emerald-300"
                      }`}
                    >
                      <PawPrint className="w-4 h-4 mb-0.5 text-emerald-400" />
                      <span className="text-[7px] font-mono uppercase tracking-tighter leading-tight line-clamp-2">
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

          {isQuickEditing && (character.avatarImage || (linkedFamiliar && onBondFamiliar && character.id)) && (
            <div className="flex flex-col gap-1.5 w-36 md:w-28 mt-1">
              {character.avatarImage && (
                <>
                  <div className="grid grid-cols-2 gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => saveStateToDB({ ...character, avatarFit: "cover" })}
                      className={`py-1 px-1.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer truncate ${
                        (character.avatarFit || "cover") === "cover"
                          ? "bg-violet-900 text-amber-300 border border-amber-500/30"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                      title={t.optAvatarCover}
                    >
                      Cover
                    </button>
                    <button
                      type="button"
                      onClick={() => saveStateToDB({ ...character, avatarFit: "contain" })}
                      className={`py-1 px-1.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer truncate ${
                        character.avatarFit === "contain"
                          ? "bg-violet-900 text-amber-300 border border-amber-500/30"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                      title={t.optAvatarContain}
                    >
                      Contain
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveStateToDB({ ...character, avatarImage: "" })}
                    className="w-full py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/20 text-rose-300 rounded text-[9px] font-mono transition-colors cursor-pointer"
                  >
                    {t.removeAvatar}
                  </button>
                </>
              )}

              {/* Mobile-Only Unbind Familiar button in Quick Edit Mode */}
              {linkedFamiliar && onBondFamiliar && character.id && (
                <button
                  type="button"
                  onClick={() => onBondFamiliar(character.id!, null)}
                  className="md:hidden w-full py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/20 text-rose-300 rounded text-[9px] font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title={t.familiarUnbind}
                >
                  <Unlink className="w-3 h-3" />
                  <span className="truncate">{t.familiarUnbind}</span>
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
                <input
                  type="text"
                  value={character.nombre || ""}
                  onChange={(e) => {
                    const clone = { ...character, nombre: e.target.value };
                    saveStateToDB(clone);
                  }}
                  className="w-full text-sm font-magic bg-neutral-950 text-neutral-100 border border-neutral-800 hover:border-neutral-700 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder={t.placeholderNombre}
                />
              </div>

              {/* Concept field */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-500 font-bold mb-0.5">
                  {t.concepto}
                </label>
                <input
                  type="text"
                  value={character.concepto || ""}
                  onChange={(e) => {
                    const clone = { ...character, concepto: e.target.value };
                    saveStateToDB(clone);
                  }}
                  className="w-full text-xs font-mono bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder={t.placeholderConceptoEdit}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1
                  className={
                    isAcademy
                      ? "font-magic text-2xl md:text-3xl font-bold text-[#fce8a6] uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(212,175,55,0.45)]"
                      : "font-magic text-xl md:text-2xl font-bold text-neutral-100 uppercase tracking-widest glow-amber"
                  }
                >
                  {character.nombre || t.noName}
                </h1>
              </div>

              <p
                className={
                  isAcademy
                    ? "text-sm text-[#e6d5b8] mt-1.5 md:mt-2 font-serif italic max-w-xl mx-auto md:mx-0"
                    : "text-xs text-neutral-400 mt-1.5 md:mt-2 font-mono italic max-w-xl mx-auto md:mx-0"
                }
              >
                {character.concepto ? `“${character.concepto}”` : `— ${t.noConceptDefined} —`}
              </p>
            </>
          )}
        </div>

        {/* Right Aspect (Tablet & Desktop md+) - Bonded Familiar Portrait (left of Crest) & Vector House Crest Shield */}
        <div className="hidden md:flex shrink-0 items-center justify-center gap-5 relative z-10 md:pr-2">
          {/* Familiar Portrait Card (Shown in Read Mode when bonded, or in Edit Mode to link/change) */}
          {(linkedFamiliar || isQuickEditing) && (
            <div className="flex flex-col items-center gap-1.5">
              {linkedFamiliar ? (
                <div
                  id="header-familiar-card"
                  onClick={() => {
                    if (isQuickEditing) {
                      setIsSelectFamiliarModalOpen(true);
                    } else if (onSelectFamiliar) {
                      onSelectFamiliar(linkedFamiliar.id);
                    }
                  }}
                  title={isQuickEditing ? t.familiarChangeBond : t.familiarViewDetail}
                  className={`group w-28 aspect-[3/4] bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center relative cursor-pointer select-none transition-all duration-300 ${
                    isAcademy
                      ? "border-2 border-[#c8a248] hover:border-[#fce8a6] shadow-[0_0_20px_rgba(0,0,0,0.85)]"
                      : "border border-emerald-500/40 hover:border-amber-400/70 shadow-md"
                  } ${isQuickEditing ? "hover:ring-2 hover:ring-amber-500" : "hover:-translate-y-0.5"}`}
                >
                  {linkedFamiliar.imagen ? (
                    <img
                      src={linkedFamiliar.imagen}
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
                      className={`font-magic text-[11px] font-bold uppercase tracking-wider truncate ${
                        isAcademy
                          ? "text-[#fce8a6] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]"
                          : "text-emerald-200"
                      }`}
                    >
                      {linkedFamiliar.nombre || t.noName}
                    </div>
                  </div>

                  {/* Quick Edit Mode overlay to change bond */}
                  {isQuickEditing && (
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
                  className={`w-28 aspect-[3/4] rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer select-none ${
                    isAcademy
                      ? "bg-[#120d1a]/80 border-2 border-dashed border-[#c8a248]/60 hover:border-[#fce8a6] text-[#fce8a6]"
                      : "bg-neutral-950/70 border-2 border-dashed border-emerald-500/40 hover:border-amber-400 text-emerald-300"
                  }`}
                >
                  <PawPrint className="w-6 h-6 mb-1.5 text-emerald-400" />
                  <span className="text-[10px] font-mono uppercase tracking-wider leading-tight">
                    {t.bondExistingFamiliar}
                  </span>
                </button>
              )}

              {/* Quick Unlink button under portrait in Edit Mode when a familiar is bonded */}
              {isQuickEditing && linkedFamiliar && onBondFamiliar && character.id && (
                <button
                  type="button"
                  onClick={() => onBondFamiliar(character.id!, null)}
                  className="w-28 py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/20 text-rose-300 rounded text-[9px] font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title={t.familiarUnbind}
                >
                  <Unlink className="w-3 h-3" />
                  <span className="truncate">{t.familiarUnbind}</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-center">
            <HouseCrest
              house={character.casa}
              isAdultWizard={characterType === "adult_wizard"}
              className="w-20 h-24"
            />
          </div>
        </div>
      </div>

      {/* Tabs Menu Ribbon */}
      <div
        className={
          isAcademy
            ? "flex overflow-x-auto pb-3 border-b border-[#c8a248]/25 mb-6 gap-2.5 snap-x"
            : "flex overflow-x-auto pb-2 border-b border-violet-500/10 mb-6 gap-2 snap-x"
        }
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
                isAcademy
                  ? IsActive
                    ? "bg-gradient-to-b from-[#352158] to-[#1d1133] border-[#c8a248] text-[#fce8a6] shadow-[0_0_15px_rgba(200,162,72,0.3)]"
                    : "bg-[#140f21]/90 border-[#c8a248]/35 text-[#c4b79c] hover:text-[#f3e5c0] hover:border-[#c8a248]/65"
                  : IsActive
                    ? "bg-violet-950/70 border-amber-500/50 text-amber-300"
                    : "bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isAcademy ? (IsActive ? "text-[#f3d88c]" : "text-[#c8a248]/80") : "text-violet-400"}`} />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Primary Tabs Board */}
      <div className="min-h-[400px]" id="detail-active-tab-box">

        {/* TAB 1: PERFIL */}
        {activeTab === "perfil" && (
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
        )}

        {/* TAB 2: SESIÓN (Tracker mode) */}
        {activeTab === "sesion" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in" id="detail-tab-sesion">

            {/* Core Stats Adjustments */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-violet-400" />
                  {t.countersAndDestiny}
                </h3>

                {/* Destiny points control */}
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl flex flex-col gap-3">
                  <div>
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">
                      {t.puntosDestino}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      id="btn-dest-minus"
                      onClick={() => setDestinyPoints((character.puntosDestino || 0) - 1)}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                      title={t.decreaseDestiny}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center justify-center gap-1.5 px-1.5 min-w-0" id="destiny-gems-container">
                      {[1, 2, 3, 4, 5].map((num) => {
                        const isActive = (character.puntosDestino || 0) >= num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              const currentPoints = character.puntosDestino || 0;
                              if (currentPoints === num) {
                                setDestinyPoints(num - 1);
                              } else {
                                setDestinyPoints(num);
                              }
                            }}
                            className={`transition-all duration-300 transform hover:scale-125 focus:outline-none cursor-pointer p-0.5 shrink-0 ${isActive
                                ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)] hover:text-amber-300"
                                : "text-neutral-800 hover:text-neutral-600"
                              }`}
                            title={`${t.puntosDestino}: ${num}`}
                          >
                            <Sparkles className={`w-5 h-5 ${isActive ? "fill-amber-400/20" : "fill-transparent"} transition-all`} />
                          </button>
                        );
                      })}
                    </div>

                    <button
                      id="btn-dest-plus"
                      onClick={() => setDestinyPoints((character.puntosDestino || 0) + 1)}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                      title={t.increaseDestiny}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Experience control */}
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl flex flex-col gap-3">
                  <div>
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">
                      {t.pxs}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      id="btn-exp-minus"
                      onClick={() => changeStat("pxs", -1)}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-violet-400 cursor-pointer shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-8 text-center text-lg font-mono font-bold text-violet-400">
                      {character.pxs}
                    </span>

                    <button
                      id="btn-exp-plus"
                      onClick={() => changeStat("pxs", 1)}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-violet-400 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dynamic Temporary Aspects List */}
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{t.aspectoTemporal}</span>
                  </div>

                  {/* Aspects List */}
                  {(() => {
                    const tempAspects = Array.isArray(character.aspectoTemporal)
                      ? character.aspectoTemporal
                      : (character.aspectoTemporal ? [character.aspectoTemporal] : []);
                    return tempAspects.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {tempAspects.map((aspect, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 md:p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300"
                          >
                            <span className="break-words max-w-[85%]">“ {aspect} ”</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTempAspect(idx)}
                              className="text-neutral-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title={t.deleteAspect}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-3 bg-neutral-950/10 border border-neutral-900/30 rounded-lg italic">
                        {t.labelAspectosTemporalesEmpty}
                      </p>
                    );
                  })()}

                  {/* Aspect Form */}
                  <div className="flex gap-2">
                    <input
                      id="input-session-new-temp-aspect"
                      type="text"
                      placeholder={t.placeholderAspectoTemporal}
                      value={newTempAspect}
                      onChange={(e) => setNewTempAspect(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTempAspect(newTempAspect);
                          setNewTempAspect("");
                        }
                      }}
                      className="flex-1 text-xs bg-neutral-900 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200"
                    />
                    <button
                      id="btn-session-add-temp-aspect"
                      type="button"
                      onClick={() => {
                        handleAddTempAspect(newTempAspect);
                        setNewTempAspect("");
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-violet-400 font-bold border border-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stress track Controls - Physical */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                  💪 {t.estresFisico}
                </h3>

                {/* Physical track box */}
                <div className="p-4 bg-neutral-950/40 rounded-xl border border-violet-900/10 space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-neutral-300">{t.estresFisico}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500">{character.estresFisico}/{character.estresFisicoMax}</span>
                      {isQuickEditing && (
                        <div className="flex items-center gap-1 ml-1 bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800">
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresFisicoMax", "estresFisico", -1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            -
                          </button>
                          <span className="text-[10px] text-neutral-300">Max</span>
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresFisicoMax", "estresFisico", 1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Visual grid checkboxes */}
                  <div className="flex flex-wrap gap-2 justify-center items-center">
                    <button
                      id="stress-phys-box-0"
                      onClick={() => {
                        const clone = { ...character, estresFisico: 0 };
                        saveStateToDB(clone);
                      }}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${character.estresFisico === 0
                          ? "bg-rose-950/30 border-rose-500/40 text-rose-300 shadow-inner"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        }`}
                      title={t.noStress}
                    >
                      0
                    </button>
                    {Array.from({ length: character.estresFisicoMax }).map((_, idx) => {
                      const count = idx + 1;
                      const isChecked = character.estresFisico >= count;
                      return (
                        <button
                          id={`stress-phys-box-${count}`}
                          key={idx}
                          onClick={() => {
                            const clone = { ...character, estresFisico: count };
                            saveStateToDB(clone);
                          }}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${isChecked
                              ? "bg-rose-950/80 border-rose-500 text-rose-300 shadow-inner"
                              : "bg-neutral-900 border-neutral-800 text-neutral-600 hover:border-neutral-700"
                            }`}
                        >
                          {count}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                    <span>{t.labelSalud}</span>
                    <span className="text-rose-400 font-bold">{t.labelHerido}</span>
                  </div>
                </div>

                {/* Dynamic Physical Consequences */}
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{t.consecuenciasFisicas}</span>
                  </div>

                  {/* Consequences List */}
                  {(() => {
                    const physCons = Array.isArray(character.consecuenciasFisicas)
                      ? character.consecuenciasFisicas
                      : [];
                    return physCons.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {physCons.map((conseq, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 md:p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300"
                          >
                            <span className="break-words max-w-[85%]">“ {conseq} ”</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePhysicalConsequence(idx)}
                              className="text-neutral-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title={t.removeConsequence}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-3 bg-neutral-950/10 border border-neutral-900/30 rounded-lg italic">
                        {t.labelConsecuenciasFisicasEmpty}
                      </p>
                    );
                  })()}

                  {/* Consequence Form */}
                  <div className="flex gap-2">
                    <input
                      id="input-session-new-phys-consequence"
                      type="text"
                      placeholder={t.placeholderConsecuenciaFisica}
                      value={newPhysicalConsequence}
                      onChange={(e) => setNewPhysicalConsequence(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPhysicalConsequence(newPhysicalConsequence);
                          setNewPhysicalConsequence("");
                        }
                      }}
                      className="flex-1 text-xs bg-neutral-950 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200"
                    />
                    <button
                      id="btn-session-add-phys-consequence"
                      type="button"
                      onClick={() => {
                        handleAddPhysicalConsequence(newPhysicalConsequence);
                        setNewPhysicalConsequence("");
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-violet-400 font-bold border border-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stress track control - Mental */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                  🧠 {t.estresMental}
                </h3>

                <div className="p-4 bg-neutral-950/40 rounded-xl border border-violet-900/10 space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-neutral-300">{t.estresMental}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500">{character.estresMental}/{character.estresMentalMax}</span>
                      {isQuickEditing && (
                        <div className="flex items-center gap-1 ml-1 bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800">
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresMentalMax", "estresMental", -1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            -
                          </button>
                          <span className="text-[10px] text-neutral-300">Max</span>
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresMentalMax", "estresMental", 1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual grid checkboxes */}
                  <div className="flex flex-wrap gap-2 justify-center items-center">
                    <button
                      id="stress-mental-box-0"
                      onClick={() => {
                        const clone = { ...character, estresMental: 0 };
                        saveStateToDB(clone);
                      }}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${character.estresMental === 0
                          ? "bg-violet-950/30 border-violet-500/40 text-violet-300 shadow-inner"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        }`}
                      title={t.noStress}
                    >
                      0
                    </button>
                    {Array.from({ length: character.estresMentalMax }).map((_, idx) => {
                      const count = idx + 1;
                      const isChecked = character.estresMental >= count;
                      return (
                        <button
                          id={`stress-mental-box-${count}`}
                          key={idx}
                          onClick={() => {
                            const clone = { ...character, estresMental: count };
                            saveStateToDB(clone);
                          }}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${isChecked
                              ? "bg-violet-950/80 border-violet-500 text-violet-300 shadow-inner"
                              : "bg-neutral-900 border-neutral-800 text-neutral-600 hover:border-neutral-700"
                            }`}
                        >
                          {count}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                    <span>{t.labelCordura}</span>
                    <span className="text-violet-400 font-bold">{t.labelLocura}</span>
                  </div>
                </div>

                {/* Dynamic Mental Consequences */}
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{t.consecuenciasMentales}</span>
                  </div>

                  {/* Consequences List */}
                  {(() => {
                    const mentalCons = Array.isArray(character.consecuenciasMentales)
                      ? character.consecuenciasMentales
                      : (character.estresMentalConsecuencia ? [character.estresMentalConsecuencia] : []); // fallback retrocompatibility
                    return mentalCons.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {mentalCons.map((conseq, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 md:p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300"
                          >
                            <span className="break-words max-w-[85%]">“ {conseq} ”</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMentalConsequence(idx)}
                              className="text-neutral-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title={t.removeConsequence}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-3 bg-neutral-950/10 border border-neutral-900/30 rounded-lg italic">
                        {t.labelConsecuenciasMentalesEmpty}
                      </p>
                    );
                  })()}

                  {/* Consequence Form */}
                  <div className="flex gap-2">
                    <input
                      id="input-session-new-mental-consequence"
                      type="text"
                      placeholder={t.placeholderConsecuenciaMental}
                      value={newMentalConsequence}
                      onChange={(e) => setNewMentalConsequence(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMentalConsequence(newMentalConsequence);
                          setNewMentalConsequence("");
                        }
                      }}
                      className="flex-1 text-xs bg-neutral-950 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200"
                    />
                    <button
                      id="btn-session-add-mental-consequence"
                      type="button"
                      onClick={() => {
                        handleAddMentalConsequence(newMentalConsequence);
                        setNewMentalConsequence("");
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-violet-400 font-bold border border-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stress track Control - Social */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                  🗣️ {t.estresSocial}
                </h3>

                {/* Social track box */}
                <div className="p-4 bg-neutral-950/40 rounded-xl border border-violet-900/10 space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-neutral-300">{t.estresSocial}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500">{character.estresSocial}/{character.estresSocialMax}</span>
                      {isQuickEditing && (
                        <div className="flex items-center gap-1 ml-1 bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800">
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresSocialMax", "estresSocial", -1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            -
                          </button>
                          <span className="text-[10px] text-neutral-300">Max</span>
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresSocialMax", "estresSocial", 1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Visual grid checkboxes */}
                  <div className="flex flex-wrap gap-2 justify-center items-center">
                    <button
                      id="stress-soc-box-0"
                      onClick={() => {
                        const clone = { ...character, estresSocial: 0 };
                        saveStateToDB(clone);
                      }}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${character.estresSocial === 0
                          ? "bg-indigo-950/30 border-indigo-500/40 text-indigo-300 shadow-inner"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        }`}
                      title={t.noStress}
                    >
                      0
                    </button>
                    {Array.from({ length: character.estresSocialMax }).map((_, idx) => {
                      const count = idx + 1;
                      const isChecked = character.estresSocial >= count;
                      return (
                        <button
                          id={`stress-soc-box-${count}`}
                          key={idx}
                          onClick={() => {
                            const clone = { ...character, estresSocial: count };
                            saveStateToDB(clone);
                          }}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${isChecked
                              ? "bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-inner"
                              : "bg-neutral-900 border-neutral-800 text-neutral-600 hover:border-neutral-700"
                            }`}
                        >
                          {count}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                    <span>{t.labelSereno}</span>
                    <span className="text-indigo-400 font-bold">{t.labelAislado}</span>
                  </div>
                </div>

                {/* Dynamic Social Consequences */}
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{t.consecuenciasSociales}</span>
                  </div>

                  {/* Consequences List */}
                  {(() => {
                    const socialCons = Array.isArray(character.consecuenciasSociales)
                      ? character.consecuenciasSociales
                      : [];
                    return socialCons.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {socialCons.map((conseq, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 md:p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300"
                          >
                            <span className="break-words max-w-[85%]">“ {conseq} ”</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSocialConsequence(idx)}
                              className="text-neutral-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title={t.removeConsequence}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-3 bg-neutral-950/10 border border-neutral-900/30 rounded-lg italic">
                        {t.labelConsecuenciasSocialesEmpty}
                      </p>
                    );
                  })()}

                  {/* Consequence Form */}
                  <div className="flex gap-2">
                    <input
                      id="input-session-new-social-consequence"
                      type="text"
                      placeholder={t.placeholderConsecuenciaSocial}
                      value={newSocialConsequence}
                      onChange={(e) => setNewSocialConsequence(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSocialConsequence(newSocialConsequence);
                          setNewSocialConsequence("");
                        }
                      }}
                      className="flex-1 text-xs bg-neutral-900 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200"
                    />
                    <button
                      id="btn-session-add-social-consequence"
                      type="button"
                      onClick={() => {
                        handleAddSocialConsequence(newSocialConsequence);
                        setNewSocialConsequence("");
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-violet-400 font-bold border border-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: HABILIDADES (Skills tracker) */}
        {activeTab === "habilidades" && (
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
        )}

        {/* TAB 4: HECHIZOS (Conjuros y Pociones) */}
        {activeTab === "hechizos" && (
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
        )}

        {/* TAB 5: NOTAS & CHRONICLES */}
        {activeTab === "notas" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="detail-tab-notas">
            {/* Left side: Clubs & Inventory */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6">
              {/* Clubes */}
              <div className="space-y-3">
                <h4 className="font-magic text-[10px] text-amber-400 uppercase tracking-widest border-b border-violet-900/10 pb-1.5 font-bold flex items-center justify-between">
                  <span>🛡️ {t.clubes}</span>
                  <span className="text-[9px] font-mono text-neutral-500">{(character.clubesList || []).length}</span>
                </h4>

                {/* List First: Consultation Priority */}
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {character.clubesList && character.clubesList.length > 0 ? (
                    character.clubesList.map((cl) => (
                      <div
                        key={cl.id}
                        className="flex items-center justify-between bg-neutral-950/30 px-2.5 py-1.5 border border-neutral-900 rounded-lg group hover:border-violet-500/10 transition-all"
                      >
                        <span className="text-xs text-neutral-200 font-sans break-words max-w-[80%]">{cl.nombre}</span>
                        {isQuickEditing && (
                          <button
                            id={`btn-del-club-${cl.id}`}
                            onClick={() => handleRemoveClub(cl.id)}
                            className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer opacity-80 hover:opacity-100 transition-colors"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] font-mono text-neutral-600 italic select-none py-4 text-center">
                      {t.emptyClubs}
                    </p>
                  )}
                </div>

                {/* Add Club Input Form */}
                {isQuickEditing && (
                  <div className="bg-neutral-950/20 p-2.5 border border-neutral-900/50 rounded-lg space-y-2 mt-2 animate-fade-in">
                    <input
                      id="input-new-club"
                      type="text"
                      placeholder={t.placeholderClubes}
                      value={newClubName}
                      onChange={(e) => setNewClubName(e.target.value)}
                      className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    />
                    <button
                      id="btn-add-club"
                      onClick={handleAddClub}
                      className="w-full py-1.5 bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/10 text-violet-300 hover:text-neutral-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.addClub}
                    </button>
                  </div>
                )}
              </div>

              {/* Equipo / Grimorio / Inventario */}
              <div className="space-y-3">
                <h4 className="font-magic text-[10px] text-amber-400 uppercase tracking-widest border-b border-violet-900/10 pb-1.5 font-bold flex items-center justify-between">
                  <span>🎒 {t.equipo}</span>
                  <span className="text-[9px] font-mono text-neutral-500">{(character.equipoList || []).length}</span>
                </h4>

                {/* List First: Consultation Priority */}
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {character.equipoList && character.equipoList.length > 0 ? (
                    character.equipoList.map((eq) => (
                      <div
                        key={eq.id}
                        className="flex items-center justify-between bg-neutral-950/30 px-2.5 py-1.5 border border-neutral-900 rounded-lg group hover:border-violet-500/10 transition-all gap-2"
                      >
                        <span className="text-xs text-neutral-200 font-mono break-all flex-1">{eq.nombre}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleChangeInventoryQty(eq.id, -1)}
                              disabled={eq.cantidad <= 1}
                              className={`px-1.5 py-0.5 text-[10px] font-mono font-bold transition-colors ${
                                eq.cantidad <= 1
                                  ? "text-neutral-700 cursor-not-allowed"
                                  : "text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 cursor-pointer"
                              }`}
                            >
                              -
                            </button>
                            <span className="text-[10px] px-1.5 text-amber-400 font-mono font-bold tabular-nums">
                              x{eq.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleChangeInventoryQty(eq.id, 1)}
                              className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          {isQuickEditing && (
                            <button
                              id={`btn-del-item-${eq.id}`}
                              onClick={() => handleRemoveInventoryItem(eq.id)}
                              className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer opacity-80 hover:opacity-100 transition-colors"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] font-mono text-neutral-600 italic select-none py-4 text-center">
                      {t.emptyInventory}
                    </p>
                  )}
                </div>

                {/* Add Inventory Item Input Form */}
                {isQuickEditing && (
                  <div className="bg-neutral-950/20 p-2.5 border border-neutral-900/50 rounded-lg space-y-2 mt-2 animate-fade-in">
                    <input
                      id="input-new-item"
                      type="text"
                      placeholder={t.placeholderEquipo}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      {/* Quantity Input */}
                      <div className="flex items-center border border-neutral-800 bg-neutral-900 rounded-lg overflow-hidden h-8">
                        <button
                          id="btn-qty-minus"
                          onClick={() => setNewItemQty(q => Math.max(1, q - 1))}
                          className="px-2 h-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          id="input-new-item-qty"
                          type="number"
                          min="1"
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 text-center bg-transparent text-xs text-neutral-200 focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                        />
                        <button
                          id="btn-qty-plus"
                          onClick={() => setNewItemQty(q => q + 1)}
                          className="px-2 h-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        id="btn-add-inventory-item"
                        onClick={handleAddInventoryItem}
                        className="flex-1 py-1.5 h-8 bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/10 text-violet-300 hover:text-neutral-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t.addItem}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Student Notepad overhaul */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2 flex flex-col space-y-4">
              <div className="flex justify-between items-center border-b border-violet-950/10 pb-2">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span>📖</span> {t.labelNotesChronicleTitle}
                </h3>
                <span className="text-[9px] font-mono text-neutral-500 select-none bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                  {(character.notasList || []).length} {t.notesLabel}
                </span>
              </div>

              {/* List of custom notes - Order is consultation first, we render them neatly. Newest notes are at the top. */}
              <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1 flex-1">
                {character.notasList && character.notasList.length > 0 ? (
                  [...character.notasList].sort((a, b) => b.fecha - a.fecha).map((note) => {
                    const isEditingThisNote = editingNoteId === note.id;
                    return (
                      <div
                        key={note.id}
                        className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-4 space-y-2 hover:border-violet-500/10 transition-all shadow-inner"
                      >
                        {isEditingThisNote ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingNoteTitle}
                              onChange={(e) => setEditingNoteTitle(e.target.value)}
                              placeholder={t.placeholderNoteTitle}
                              className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                            />
                            <textarea
                              rows={4}
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              placeholder={t.placeholderNoteContent}
                              className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-200 rounded-lg text-[11px] font-mono font-bold cursor-pointer"
                              >
                                {t.cancel}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedNote(note.id)}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {t.saveNote}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <h4 className="text-xs font-semibold text-neutral-200 font-sans tracking-wide">
                                  {note.titulo}
                                </h4>
                                <span className="text-[9px] font-mono text-neutral-500">
                                  {new Date(note.fecha).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditNote(note)}
                                  className="text-neutral-500 hover:text-amber-400 p-1 cursor-pointer hover:bg-neutral-900 rounded transition-colors"
                                  title={t.editNote}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                {isQuickEditing && (
                                  <button
                                    id={`btn-del-note-${note.id}`}
                                    onClick={() => handleRemoveNote(note.id)}
                                    className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer hover:bg-neutral-900 rounded transition-colors"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-neutral-300 font-sans leading-relaxed whitespace-pre-wrap select-text selection:bg-violet-900 selection:text-white pt-1">
                              {note.contenido}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10 text-center select-none">
                    <span className="text-xl mb-1.5">📝</span>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">
                      {t.emptyNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Form to Add New Note at the bottom */}
              <div className="bg-neutral-950/30 p-4 border border-violet-500/5 rounded-xl space-y-3 mt-auto">
                <h4 className="text-[10px] font-mono text-neutral-400 uppercase font-black tracking-wide flex items-center gap-1.5">
                  <span>🖋️</span> {t.addNote}
                </h4>
                <div className="space-y-2">
                  <input
                    id="input-new-note-title"
                    type="text"
                    placeholder={t.placeholderNoteTitle}
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2.5 text-neutral-200 focus:outline-none"
                  />
                  <textarea
                    id="input-new-note-content"
                    rows={4}
                    placeholder={t.placeholderNoteContent}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2.5 text-neutral-200 focus:outline-none min-h-[80px]"
                  />
                  <button
                    id="btn-add-note"
                    onClick={handleAddNote}
                    className="w-full py-2 bg-violet-900 hover:bg-violet-800 border border-violet-600 text-violet-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {t.registerNote}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: GALERÍA DE FOTOS (Base64 list) */}
        {activeTab === "galeria" && (
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
        )}

      </div>
      </div>

      {/* Lightbox Modal overlay */}
      {lightboxImage && (
        <div
          id="lightbox-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur duration-300 pointer-events-auto"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-100 cursor-pointer">
            <X className="w-8 h-8" />
          </div>

          <div className="max-w-[90vw] max-h-[85vh] overflow-hidden rounded-xl border border-violet-500/20" onClick={(e) => e.stopPropagation()}>
            <img
              id="lightbox-img"
              src={lightboxImage}
              alt="Expanded"
              className="max-w-full max-h-[85vh] object-contain"
              referrerPolicy="referrer"
            />
          </div>
        </div>
      )}

      {/* Student Delete Double-Check Modal */}
      {isDeleteStudentOpen && (
        <div id="modal-delete-student" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-rose-500/30 bg-[#0e0a16] shadow-2xl space-y-4">
            <h3 className="font-magic text-base text-rose-400 font-bold border-b border-rose-500/10 pb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              {t.confirmDelete}
            </h3>
            <p className="text-neutral-300 text-sm">
              {t.confirmDeleteText}
            </p>

            {/* Double check checkbox */}
            <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-900 flex items-start gap-3 mt-2">
              <input
                id="checkbox-confirm-student-delete"
                type="checkbox"
                checked={deleteStudentUnderstood}
                onChange={(e) => setDeleteStudentUnderstood(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 bg-neutral-900 border-rose-500/20 focus:ring-rose-500/50"
              />
              <label
                htmlFor="checkbox-confirm-student-delete"
                className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer select-none leading-relaxed"
              >
                {t.confirmDeleteCheckbox}
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="btn-confirm-delete-student-cancel"
                onClick={() => setIsDeleteStudentOpen(false)}
                className="px-4 py-2 border border-neutral-700/60 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                id="btn-confirm-delete-student-action"
                disabled={!deleteStudentUnderstood}
                onClick={confirmDeleteCharacter}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${deleteStudentUnderstood
                    ? "bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/25"
                    : "bg-neutral-900 text-neutral-600 border border-neutral-950 cursor-not-allowed"
                  }`}
              >
                <Trash2 className="w-4 h-4" />
                {t.confirmDeleteButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minor Deletions Modal Overlay */}
      {minorDeleteTarget && (
        <div id="modal-minor-delete" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="glass-panel max-w-sm w-full p-5 rounded-xl border border-violet-500/20 bg-[#0c0814] shadow-xl space-y-4">
            <h4 className="font-sans text-xs font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-violet-500/10 pb-2">
              <Trash className="w-3.5 h-3.5 text-rose-400" />
              {t.confirmDeleteTitle}
            </h4>
            <p className="text-neutral-200 text-xs">
              {minorDeleteTarget.type === "spell" && t.confirmDeleteSpell}
              {minorDeleteTarget.type === "potion" && t.confirmDeletePotion}
              {minorDeleteTarget.type === "gallery" && t.confirmDeleteGalleryImage}
              {minorDeleteTarget.type === "club" && t.confirmDeleteClub}
              {minorDeleteTarget.type === "item" && t.confirmDeleteItem}
              {minorDeleteTarget.type === "note" && t.confirmDeleteNote}
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                id="btn-minor-delete-cancel"
                onClick={() => setMinorDeleteTarget(null)}
                className="px-3 py-1.5 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-md text-[11px] font-bold transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                id="btn-minor-delete-confirm"
                onClick={() => {
                  if (minorDeleteTarget.type === "spell") {
                    confirmRemoveSpell(minorDeleteTarget.id as string);
                  } else if (minorDeleteTarget.type === "potion") {
                    confirmRemovePotion(minorDeleteTarget.id as string);
                  } else if (minorDeleteTarget.type === "gallery") {
                    confirmRemoveGalleryImage(minorDeleteTarget.id as number);
                  } else if (minorDeleteTarget.type === "club") {
                    confirmRemoveClub(minorDeleteTarget.id as string);
                  } else if (minorDeleteTarget.type === "item") {
                    confirmRemoveInventoryItem(minorDeleteTarget.id as string);
                  } else if (minorDeleteTarget.type === "note") {
                    confirmRemoveNote(minorDeleteTarget.id as string);
                  }
                }}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-md text-[11px] font-bold transition-all cursor-pointer border border-rose-500/10"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Interactive Crop Wizard Modal */}
      {isCropperOpen && cropImageSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in" id="crop-avatar-modal">
          <div className="bg-neutral-900 border border-violet-500/25 rounded-2xl w-full max-w-md p-6 flex flex-col space-y-4 shadow-2xl">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h4 className="font-magic text-xs text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>📐</span> {t.cropHeader}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsCropperOpen(false);
                  setCropImageSrc(null);
                }}
                className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-lg cursor-pointer max-w-max bg-transparent border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cropper Box */}
            <div className="relative w-full aspect-[3/4] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 select-none">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Zoom control Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                <span>🔍 {t.cropZoom}</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>

            {/* Confirm & Cancel Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCropperOpen(false);
                  setCropImageSrc(null);
                }}
                className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                className="w-full py-2.5 bg-violet-900 hover:bg-violet-800 border border-violet-600 text-violet-100 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {t.cropConfirm}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Vincular Familiar a este personaje */}
      {isSelectFamiliarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-amber-500/30 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-magic text-sm font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-emerald-400" />
                {t.familiarBondSectionTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsSelectFamiliarModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 font-sans">
              {t.selectFamiliarPlaceholder}
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {/* Opción 1: Sin familiar / Desvincular */}
              <button
                type="button"
                onClick={() => {
                  if (onBondFamiliar && character.id) {
                    onBondFamiliar(character.id, null);
                  } else {
                    const clone = { ...character, familiarId: undefined };
                    saveStateToDB(clone);
                  }
                  setIsSelectFamiliarModalOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                  !character.familiarId
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                    : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <span>{t.familiarBondNone}</span>
                {!character.familiarId && <Check className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Lista de familiares creados */}
              {familiars.map((fam) => (
                <button
                  key={fam.id}
                  type="button"
                  onClick={() => {
                    if (onBondFamiliar && character.id) {
                      onBondFamiliar(character.id, fam.id);
                    } else {
                      const clone = { ...character, familiarId: fam.id };
                      saveStateToDB(clone);
                    }
                    setIsSelectFamiliarModalOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                    character.familiarId === fam.id
                      ? "bg-amber-950/60 border-amber-500 text-amber-200"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {fam.imagen ? (
                      <img
                        src={fam.imagen}
                        alt={fam.nombre}
                        className="w-7 h-7 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/60 flex items-center justify-center shrink-0 text-emerald-400">
                        <PawPrint className="w-4 h-4" />
                      </div>
                    )}
                    <span className="truncate font-semibold">{fam.nombre}</span>
                    <span className="text-[10px] text-emerald-400">
                      ({fam.especie})
                    </span>
                  </div>
                  {character.familiarId === fam.id && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
              {onOpenCreateFamiliar ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectFamiliarModalOpen(false);
                    onOpenCreateFamiliar();
                  }}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.createNewFamiliar}</span>
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setIsSelectFamiliarModalOpen(false)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-xs font-mono uppercase cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
