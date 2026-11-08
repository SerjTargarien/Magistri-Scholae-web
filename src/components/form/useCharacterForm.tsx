/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The creation form's state and handlers, moved verbatim out of
// CharacterForm.tsx (R3.4) so each tab can live in its own file.
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

import type { CharacterFormProps } from "../CharacterForm";

export function useCharacterForm(screenProps: CharacterFormProps) {
  const {
  lang,
  initialCharacter,
  newCharacterType,
  onSave,
  onCancel,
  } = screenProps;
  const t = TRANSLATIONS[lang];

  // Forms Navigation State
  const [activeFormTab, setActiveFormTab] = useState<
    "perfil" | "afiliacion" | "habilidades" | "estres" | "aspectos"
  >("perfil");

  // Load initial values or prefilled default draft
  const [characterState, setCharacterState] = useState<Omit<Character, "id" | "createdAt" | "updatedAt">>(
    createDefaultCharacter(newCharacterType || "student")
  );

  const characterType = characterState.characterType || "student";

  const profile = characterState.adultWizardProfile || {
    role: "",
    institution: "",
    isTeacher: false,
    teachingSubjects: [],
    formerHouse: "",
    magicalFocus: "",
    reputation: "",
  };

  const updateProfileField = (field: string, value: any) => {
    setCharacterState(prev => ({
      ...prev,
      adultWizardProfile: {
        role: prev.adultWizardProfile?.role || "",
        institution: prev.adultWizardProfile?.institution || "",
        isTeacher: typeof prev.adultWizardProfile?.isTeacher === "boolean" ? prev.adultWizardProfile.isTeacher : false,
        teachingSubjects: prev.adultWizardProfile?.teachingSubjects || [],
        formerHouse: prev.adultWizardProfile?.formerHouse || "",
        magicalFocus: prev.adultWizardProfile?.magicalFocus || "",
        reputation: prev.adultWizardProfile?.reputation || "",
        [field]: value
      }
    }));
  };

  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [newAspectName, setNewAspectName] = useState("");
  const [newComplicationName, setNewComplicationName] = useState("");
  const [newFormTempAspect, setNewFormTempAspect] = useState("");
  const [pastedAvatarUrl, setPastedAvatarUrl] = useState("");

  // Consequences inputs
  const [newPhysConsequence, setNewPhysConsequence] = useState("");
  const [newMentConsequence, setNewMentConsequence] = useState("");
  const [newSocConsequence, setNewSocConsequence] = useState("");

  // Local state for adding a skill and saving defaults
  const [inlineSkillNames, setInlineSkillNames] = useState<Record<string, string>>({});
  const [skillsSavedFeedback, setSkillsSavedFeedback] = useState(false);

  // Equipment / Inventory inputs
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);

  // Custom fields inputs
  const [newCustomFieldName, setNewCustomFieldName] = useState("");
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("");

  // Custom Discard Draft Modal state (replaces window.confirm)
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showFamiliarEditorModal, setShowFamiliarEditorModal] = useState(false);

  // Cropper states for interactive portrait portal
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Populate state on mount / update from initialCharacter
  useEffect(() => {
    if (initialCharacter) {
      // Load existing editing character
      setCharacterState({
        characterType: initialCharacter.characterType || "student",
        nombre: initialCharacter.nombre,
        jugador: initialCharacter.jugador,
        edad: initialCharacter.edad,
        casa: initialCharacter.casa,
        curso: initialCharacter.curso,
        puestoClase: initialCharacter.puestoClase || "",
        concepto: initialCharacter.concepto,
        lema: initialCharacter.lema,
        escudoText: initialCharacter.escudoText,
        complicaciones: initialCharacter.complicaciones
          ? (Array.isArray(initialCharacter.complicaciones)
              ? initialCharacter.complicaciones
              : [initialCharacter.complicaciones])
          : [],
        linaje: initialCharacter.linaje || "",
        puntosDestino: initialCharacter.puntosDestino !== undefined ? initialCharacter.puntosDestino : 3,
        economia: initialCharacter.economia || "",
        familiarId: initialCharacter.familiarId,
        varitaSintonia: initialCharacter.varitaSintonia || "",
        estresFisico: initialCharacter.estresFisico !== undefined ? initialCharacter.estresFisico : 0,
        estresFisicoMax: initialCharacter.estresFisicoMax !== undefined ? initialCharacter.estresFisicoMax : 5,
        estresMental: initialCharacter.estresMental !== undefined ? initialCharacter.estresMental : 0,
        estresMentalMax: initialCharacter.estresMentalMax !== undefined ? initialCharacter.estresMentalMax : 5,
        estresMentalConsecuencia: initialCharacter.estresMentalConsecuencia || "",
        estresSocial: initialCharacter.estresSocial !== undefined ? initialCharacter.estresSocial : 0,
        estresSocialMax: initialCharacter.estresSocialMax !== undefined ? initialCharacter.estresSocialMax : 5,
        consecuenciasFisicas: initialCharacter.consecuenciasFisicas || [],
        consecuenciasMentales: initialCharacter.consecuenciasMentales || [],
        consecuenciasSociales: initialCharacter.consecuenciasSociales || [],
        pxs: initialCharacter.pxs !== undefined ? initialCharacter.pxs : 0,
        aspectoTemporal: initialCharacter.aspectoTemporal
          ? (Array.isArray(initialCharacter.aspectoTemporal)
              ? initialCharacter.aspectoTemporal
              : [initialCharacter.aspectoTemporal])
          : [],
        aspectosPersonales: initialCharacter.aspectosPersonales || [],
        habilidades: initialCharacter.habilidades && initialCharacter.habilidades.length > 0 
          ? initialCharacter.habilidades 
          : getInitialDefaultSkills(),
        conjuros: initialCharacter.conjuros || [],
        pociones: initialCharacter.pociones || [],
        clubes: initialCharacter.clubes || "",
        clubesList: initialCharacter.clubesList || [],
        equipo: initialCharacter.equipo || "",
        equipoList: initialCharacter.equipoList || [],
        notas: initialCharacter.notas || "",
        notasList: initialCharacter.notasList || [],
        avatarImage: initialCharacter.avatarImage || "",
        avatarFit: initialCharacter.avatarFit || "cover",
        galleryImages: initialCharacter.galleryImages || [],
        camposPersonalizados: initialCharacter.camposPersonalizados || [],
        adultWizardProfile: initialCharacter.adultWizardProfile ? {
          role: initialCharacter.adultWizardProfile.role || "",
          institution: initialCharacter.adultWizardProfile.institution || "",
          isTeacher: !!initialCharacter.adultWizardProfile.isTeacher,
          teachingSubjects: initialCharacter.adultWizardProfile.teachingSubjects || [],
          formerHouse: initialCharacter.adultWizardProfile.formerHouse || "",
          magicalFocus: initialCharacter.adultWizardProfile.magicalFocus || "",
          reputation: initialCharacter.adultWizardProfile.reputation || "",
        } : (initialCharacter.characterType === "adult_wizard" ? {
          role: "",
          institution: "",
          isTeacher: false,
          teachingSubjects: [],
          formerHouse: "",
          magicalFocus: "",
          reputation: "",
        } : undefined),
      });
    } else {
      const def = createDefaultCharacter(newCharacterType || "student");
      if (def.characterType === "student") {
        def.lema = getLocalizedHouseLore(def.casa || "IRATI", lang).lema;
        def.edad = lang === "en" ? "11 years" : "11 años";
      }
      setCharacterState(def);
    }
  }, [initialCharacter, newCharacterType]);

  // Handle house selection change and apply its typical crest/motto
  const handleHouseChange = (houseName: string) => {
    const houseKey = houseName.toUpperCase();
    const houseData = HOUSES[houseKey];
    const houseLore = getLocalizedHouseLore(houseKey, lang);
    
    setCharacterState(prev => ({
      ...prev,
      casa: houseName,
      lema: houseLore ? houseLore.lema : prev.lema,
      escudoText: houseData ? houseData.escudo : prev.escudoText,
    }));
  };

  // Convert and compress uploaded files to base64 with interactive cropper
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "gallery") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);

    try {
      if (target === "avatar") {
        const reader = new FileReader();
        reader.onload = (event) => {
          const rawBase64 = event.target?.result as string;
          setCropImageSrc(rawBase64);
          setZoom(1);
          setCrop({ x: 0, y: 0 });
          setIsCropperOpen(true);
        };
        reader.readAsDataURL(file);
      } else {
        const base64Str = await compressImage(file, 1600, 1600, 0.75);
        setCharacterState(prev => ({
          ...prev,
          galleryImages: [...prev.galleryImages, base64Str]
        }));
      }
    } catch (err: any) {
      console.error("Image upload processing error:", err);
      setImageError(t.imageUploadError || "Error processing image.");
    } finally {
      e.target.value = ""; // refresh picker
    }
  };

  // Pasting external url safely with interactive cropping
  const handleUrlAvatarSubmit = () => {
    if (!pastedAvatarUrl.trim()) return;
    setCropImageSrc(pastedAvatarUrl.trim());
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setIsCropperOpen(true);
    setPastedAvatarUrl("");
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      setCharacterState(prev => ({ ...prev, avatarImage: croppedBase64 }));
      setIsCropperOpen(false);
      setCropImageSrc(null);
    } catch (err: any) {
      console.error("Cropping confirm error:", err);
      setImageError(t.imageUploadError || "Failed to crop image.");
    }
  };

  // Aspects Management
  const addAspect = () => {
    if (!newAspectName.trim()) return;
    setCharacterState(prev => ({
      ...prev,
      aspectosPersonales: [...prev.aspectosPersonales, newAspectName.trim()]
    }));
    setNewAspectName("");
  };

  const removeAspect = (idx: number) => {
    setCharacterState(prev => ({
      ...prev,
      aspectosPersonales: prev.aspectosPersonales.filter((_, i) => i !== idx)
    }));
  };

  // Temporary Aspects Management
  const addTempAspect = () => {
    if (!newFormTempAspect.trim()) return;
    setCharacterState(prev => ({
      ...prev,
      aspectoTemporal: [...(prev.aspectoTemporal || []), newFormTempAspect.trim()]
    }));
    setNewFormTempAspect("");
  };

  const removeTempAspect = (idx: number) => {
    setCharacterState(prev => ({
      ...prev,
      aspectoTemporal: (prev.aspectoTemporal || []).filter((_, i) => i !== idx)
    }));
  };

  // Complications Management
  const addComplication = () => {
    if (!newComplicationName.trim()) return;
    setCharacterState(prev => ({
      ...prev,
      complicaciones: [...(prev.complicaciones || []), newComplicationName.trim()]
    }));
    setNewComplicationName("");
  };

  const removeComplication = (idx: number) => {
    setCharacterState(prev => ({
      ...prev,
      complicaciones: (prev.complicaciones || []).filter((_, i) => i !== idx)
    }));
  };

  // Equipment / Inventory Management
  const addEquipmentItem = () => {
    if (!newItemName.trim()) return;
    const newItem = {
      id: "item_" + Date.now(),
      nombre: newItemName.trim(),
      cantidad: Math.max(1, newItemQty)
    };
    setCharacterState(prev => ({
      ...prev,
      equipoList: [...(prev.equipoList || []), newItem]
    }));
    setNewItemName("");
    setNewItemQty(1);
  };

  const removeEquipmentItem = (id: string) => {
    setCharacterState(prev => ({
      ...prev,
      equipoList: (prev.equipoList || []).filter(eq => eq.id !== id)
    }));
  };

  // Custom Fields Management
  const addCustomField = () => {
    if (!newCustomFieldName.trim() || !newCustomFieldValue.trim()) return;
    const newField: CustomField = {
      nombre: newCustomFieldName.trim(),
      valor: newCustomFieldValue.trim(),
    };
    setCharacterState(prev => ({
      ...prev,
      camposPersonalizados: [...(prev.camposPersonalizados || []), newField]
    }));
    setNewCustomFieldName("");
    setNewCustomFieldValue("");
  };

  const updateCustomField = (idx: number, field: keyof CustomField, value: string) => {
    setCharacterState(prev => ({
      ...prev,
      camposPersonalizados: (prev.camposPersonalizados || []).map((cf, i) =>
        i === idx ? { ...cf, [field]: value } : cf
      )
    }));
  };

  const removeCustomField = (idx: number) => {
    setCharacterState(prev => ({
      ...prev,
      camposPersonalizados: (prev.camposPersonalizados || []).filter((_, i) => i !== idx)
    }));
  };

  // Consequences Add Handlers
  const addPhysConsequence = () => {
    if (!newPhysConsequence.trim()) return;
    setCharacterState(prev => ({
      ...prev,
      consecuenciasFisicas: [...(prev.consecuenciasFisicas || []), newPhysConsequence.trim()]
    }));
    setNewPhysConsequence("");
  };

  const removePhysConsequence = (idx: number) => {
    setCharacterState(prev => ({
      ...prev,
      consecuenciasFisicas: (prev.consecuenciasFisicas || []).filter((_, i) => i !== idx)
    }));
  };

  const addMentConsequence = () => {
    if (!newMentConsequence.trim()) return;
    setCharacterState(prev => ({
      ...prev,
      consecuenciasMentales: [...(prev.consecuenciasMentales || []), newMentConsequence.trim()]
    }));
    setNewMentConsequence("");
  };

  const removeMentConsequence = (idx: number) => {
    setCharacterState(prev => ({
      ...prev,
      consecuenciasMentales: (prev.consecuenciasMentales || []).filter((_, i) => i !== idx)
    }));
  };

  const addSocConsequence = () => {
    if (!newSocConsequence.trim()) return;
    setCharacterState(prev => ({
      ...prev,
      consecuenciasSociales: [...(prev.consecuenciasSociales || []), newSocConsequence.trim()]
    }));
    setNewSocConsequence("");
  };

  const removeSocConsequence = (idx: number) => {
    setCharacterState(prev => ({
      ...prev,
      consecuenciasSociales: (prev.consecuenciasSociales || []).filter((_, i) => i !== idx)
    }));
  };

  // Skills interactive increment/decrement handlers
  const adjustSkillValue = (skillName: string, amount: number) => {
    setCharacterState(prev => {
      const updatedSkills = prev.habilidades.map(sk => {
        if (sk.nombre === skillName) {
          const newValue = Math.max(0, Math.min(5, sk.valor + amount));
          return { ...sk, valor: newValue };
        }
        return sk;
      });
      return { ...prev, habilidades: updatedSkills };
    });
  };

  const [skillError, setSkillError] = useState<string | null>(null);

  const handleAddInlineSkill = (category: string) => {
    const rawVal = inlineSkillNames[category] || "";
    if (!rawVal.trim()) return;
    setSkillError(null);
    const canonicalNew = canonicalizeSkillName(rawVal).toLowerCase();
    const exists = characterState.habilidades.some(
      s =>
        s.nombre.toLowerCase() === rawVal.trim().toLowerCase() ||
        canonicalizeSkillName(s.nombre).toLowerCase() === canonicalNew ||
        translateSkillName(s.nombre, lang).toLowerCase() === rawVal.trim().toLowerCase()
    );
    if (exists) {
      setSkillError(t.errSkillExists.replace("{name}", rawVal.trim()));
      return;
    }
    const newSkill: Skill = {
      nombre: rawVal.trim(),
      categoria: category,
      valor: 0
    };
    setCharacterState(prev => ({
      ...prev,
      habilidades: [...prev.habilidades, newSkill]
    }));
    setInlineSkillNames(prev => ({
      ...prev,
      [category]: ""
    }));
  };

  const handleRemoveSkill = (skillName: string) => {
    setCharacterState(prev => ({
      ...prev,
      habilidades: prev.habilidades.filter(s => s.nombre !== skillName)
    }));
  };

  const handleSaveDefaultSkills = () => {
    const preset = characterState.habilidades.map(sk => ({
      nombre: sk.nombre,
      categoria: sk.categoria,
      valor: 0
    }));
    localStorage.setItem("fate_wizardry_custom_default_skills", JSON.stringify(preset));
    setSkillsSavedFeedback(true);
    setTimeout(() => setSkillsSavedFeedback(false), 3000);
  };

  // Registering or updating student draft
  const handleSave = () => {
    if (!characterState.nombre.trim()) {
      setFormError(t.validationErrorName || "Character name is required.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const savedCharacter: Character = {
      ...initialCharacter, // Keep id, createdAt
      ...characterState,
      nombre: characterState.nombre.trim(),
      createdAt: initialCharacter?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(savedCharacter);
  };

  const isStateDirty = () => {
    if (initialCharacter) {
      return (
        characterState.nombre !== initialCharacter.nombre ||
        characterState.jugador !== initialCharacter.jugador ||
        characterState.edad !== initialCharacter.edad ||
        characterState.casa !== initialCharacter.casa ||
        characterState.curso !== initialCharacter.curso ||
        characterState.puestoClase !== (initialCharacter.puestoClase || "") ||
        characterState.concepto !== initialCharacter.concepto ||
        characterState.lema !== initialCharacter.lema ||
        characterState.escudoText !== initialCharacter.escudoText ||
        JSON.stringify(characterState.complicaciones) !== JSON.stringify(Array.isArray(initialCharacter.complicaciones) ? initialCharacter.complicaciones : (initialCharacter.complicaciones ? [initialCharacter.complicaciones] : [])) ||
        characterState.linaje !== (initialCharacter.linaje || "") ||
        characterState.puntosDestino !== (initialCharacter.puntosDestino !== undefined ? initialCharacter.puntosDestino : 3) ||
        characterState.economia !== (initialCharacter.economia || "") ||
        characterState.familiarId !== initialCharacter.familiarId ||
        characterState.varitaSintonia !== (initialCharacter.varitaSintonia || "") ||
        characterState.estresFisico !== (initialCharacter.estresFisico !== undefined ? initialCharacter.estresFisico : 0) ||
        characterState.estresFisicoMax !== (initialCharacter.estresFisicoMax !== undefined ? initialCharacter.estresFisicoMax : 5) ||
        characterState.estresMental !== (initialCharacter.estresMental !== undefined ? initialCharacter.estresMental : 0) ||
        characterState.estresMentalMax !== (initialCharacter.estresMentalMax !== undefined ? initialCharacter.estresMentalMax : 5) ||
        characterState.estresMentalConsecuencia !== (initialCharacter.estresMentalConsecuencia || "") ||
        characterState.estresSocial !== (initialCharacter.estresSocial !== undefined ? initialCharacter.estresSocial : 0) ||
        characterState.estresSocialMax !== (initialCharacter.estresSocialMax !== undefined ? initialCharacter.estresSocialMax : 5) ||
        characterState.pxs !== (initialCharacter.pxs !== undefined ? initialCharacter.pxs : 0) ||
        JSON.stringify(characterState.aspectoTemporal) !== JSON.stringify(Array.isArray(initialCharacter.aspectoTemporal) ? initialCharacter.aspectoTemporal : (initialCharacter.aspectoTemporal ? [initialCharacter.aspectoTemporal] : [])) ||
        JSON.stringify(characterState.aspectosPersonales) !== JSON.stringify(initialCharacter.aspectosPersonales || []) ||
        JSON.stringify(characterState.habilidades) !== JSON.stringify(initialCharacter.habilidades || []) ||
        JSON.stringify(characterState.camposPersonalizados) !== JSON.stringify(initialCharacter.camposPersonalizados || []) ||
        characterState.avatarImage !== (initialCharacter.avatarImage || "") ||
        characterState.avatarFit !== (initialCharacter.avatarFit || "cover")
      );
    } else {
      return (
        characterState.nombre.trim() !== "" ||
        characterState.concepto.trim() !== "" ||
        characterState.jugador.trim() !== "" ||
        characterState.avatarImage !== "" ||
        characterState.aspectosPersonales.length > 0 ||
        characterState.complicaciones.length > 0 ||
        (characterState.equipoList || []).length > 0 ||
        (characterState.camposPersonalizados || []).length > 0
      );
    }
  };

  const handleCancelClick = () => {
    if (isStateDirty()) {
      setShowDiscardModal(true);
      return;
    }
    onCancel();
  };

  // Obtain current visual theme for dynamic accenting and styling
  const theme = getCharacterVisualTheme(characterState);
  
  const houseAccentBorder = 
    theme.key === "IRATI" ? "border-emerald-500/30 text-emerald-400 focus:border-emerald-400" :
    theme.key === "URANIA" ? "border-amber-500/30 text-amber-400 focus:border-amber-400" :
    theme.key === "AL-KHWARIZMI" ? "border-violet-500/30 text-violet-400 focus:border-violet-400" :
    theme.key === "CALANTES" ? "border-indigo-500/30 text-indigo-400 focus:border-indigo-400" :
    theme.key === "adult_wizard" ? "border-violet-500/30 text-violet-400 focus:border-violet-400" :
    "border-rose-500/30 text-rose-400 focus:border-rose-400";

  const houseTabBtnStyle = (tabId: typeof activeFormTab) => {
    const isActive = activeFormTab === tabId;
    if (isActive) {
      if (theme.key === "IRATI") return "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/25";
      if (theme.key === "URANIA") return "bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-md shadow-amber-950/25";
      if (theme.key === "AL-KHWARIZMI" || theme.key === "adult_wizard") return "bg-violet-950/60 border-violet-500/50 text-violet-300 shadow-md shadow-violet-950/25";
      if (theme.key === "CALANTES") return "bg-indigo-950/60 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-950/25";
      return "bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-md shadow-rose-950/25";
    }
    return "bg-neutral-950/40 border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200";
  };

  const houseIconColor = theme.textClass;

  return {
    lang,
    initialCharacter,
    newCharacterType,
    onSave,
    onCancel,
    t,
    activeFormTab,
    setActiveFormTab,
    characterState,
    setCharacterState,
    characterType,
    profile,
    updateProfileField,
    formError,
    setFormError,
    imageError,
    setImageError,
    newAspectName,
    setNewAspectName,
    newComplicationName,
    setNewComplicationName,
    newFormTempAspect,
    setNewFormTempAspect,
    pastedAvatarUrl,
    setPastedAvatarUrl,
    newPhysConsequence,
    setNewPhysConsequence,
    newMentConsequence,
    setNewMentConsequence,
    newSocConsequence,
    setNewSocConsequence,
    inlineSkillNames,
    setInlineSkillNames,
    skillsSavedFeedback,
    setSkillsSavedFeedback,
    newItemName,
    setNewItemName,
    newItemQty,
    setNewItemQty,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    showDiscardModal,
    setShowDiscardModal,
    showFamiliarEditorModal,
    setShowFamiliarEditorModal,
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
    handleHouseChange,
    handleImageUpload,
    handleUrlAvatarSubmit,
    onCropComplete,
    handleConfirmCrop,
    addAspect,
    removeAspect,
    addTempAspect,
    removeTempAspect,
    addComplication,
    removeComplication,
    addEquipmentItem,
    removeEquipmentItem,
    addCustomField,
    updateCustomField,
    removeCustomField,
    addPhysConsequence,
    removePhysConsequence,
    addMentConsequence,
    removeMentConsequence,
    addSocConsequence,
    removeSocConsequence,
    adjustSkillValue,
    skillError,
    setSkillError,
    handleAddInlineSkill,
    handleRemoveSkill,
    handleSaveDefaultSkills,
    handleSave,
    isStateDirty,
    handleCancelClick,
    theme,
    houseAccentBorder,
    houseTabBtnStyle,
    houseIconColor,
  };
}

export type FormContext = ReturnType<typeof useCharacterForm>;
