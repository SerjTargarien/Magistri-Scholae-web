/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The creation form's state and handlers (R3.4). The form only creates
// characters: it builds one complete new CharacterSheet in the server's model
// (src/model/sheet.ts) and hands it to onSave, with the cropped portrait and
// a familiar created from the form passed alongside.
import React, { useEffect, useRef, useState } from "react";
import { TRANSLATIONS, getLocalizedHouseLore, translateHouseMotto } from "../../localization";
import { getCroppedImg } from "../../utils/imageCompressor";
import { getCharacterVisualTheme } from "../../utils/characterVisualTheme";
import type { CharacterFormProps } from "../../account/screens";
import type { AdultWizardProfile, CharacterSheet, EsotericKnowledge, House, SkillEntry, TextEntry } from "../../model/sheet";
import { newItemId } from "../../model/sheet";
import { newCharacterSheet } from "../../model/defaults";
import type { SkillCategory } from "../../model/catalogue";
import { ApiFailure } from "../../remote/client";

type TextListKey = "aspectosPersonales" | "complicaciones" | "aspectoTemporal";

const SAVE_FAILED = { es: "No se pudo guardar el personaje", en: "Could not save the character" } as const;

/** A short readable message for a refused or failed save. */
function describeSaveFailure(err: unknown, lang: "es" | "en"): string {
  if (err instanceof ApiFailure) {
    const { path, rule, limit } = err.details ?? {};
    const limitText = limit === undefined || limit === null ? undefined : typeof limit === "object" ? JSON.stringify(limit) : String(limit);
    const parts = [err.code, path, rule, limitText].filter(p => p !== undefined && p !== "");
    return `${SAVE_FAILED[lang]} (${parts.join(" · ")})`;
  }
  return err instanceof Error && err.message ? `${SAVE_FAILED[lang]} (${err.message})` : SAVE_FAILED[lang];
}

const EMPTY_PROFILE: AdultWizardProfile = {
  role: "",
  institution: "",
  isTeacher: false,
  teachingSubjects: [],
  formerHouse: "",
  reputation: "",
};

export function useCharacterForm(screenProps: CharacterFormProps) {
  const { lang, newCharacterType, catalogue, isGM = false, onAddCatalogueSkill, onSave, onCreateFamiliar, onCancel } = screenProps;
  const t = TRANSLATIONS[lang];

  // Forms Navigation State
  const [activeFormTab, setActiveFormTab] = useState<
    "perfil" | "afiliacion" | "habilidades" | "estres" | "aspectos"
  >("perfil");

  // The new character, complete, in the server's model.
  const [characterState, setCharacterState] = useState<CharacterSheet>(() => newCharacterSheet(newCharacterType, catalogue));

  // A different character type starts a fresh sheet, as before.
  const firstType = useRef(true);
  useEffect(() => {
    if (firstType.current) { firstType.current = false; return; }
    setCharacterState(newCharacterSheet(newCharacterType, catalogue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCharacterType]);

  const characterType = characterState.characterType || "student";

  const profile: AdultWizardProfile & { teachingSubjects: TextEntry[] } = {
    ...EMPTY_PROFILE,
    ...characterState.adultWizardProfile,
    teachingSubjects: characterState.adultWizardProfile?.teachingSubjects ?? [],
  };

  const updateProfileField = <K extends keyof AdultWizardProfile>(field: K, value: AdultWizardProfile[K]) => {
    setCharacterState(prev => ({
      ...prev,
      adultWizardProfile: { ...EMPTY_PROFILE, ...prev.adultWizardProfile, [field]: value },
    }));
  };

  /** The comma-separated subjects box, as list entries (trimmed, non-empty). */
  const updateTeachingSubjects = (text: string) => {
    updateProfileField("teachingSubjects", text.split(",").map(s => s.trim()).filter(Boolean).map(value => ({ id: newItemId(), value })));
  };

  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [newAspectName, setNewAspectName] = useState("");
  const [newComplicationName, setNewComplicationName] = useState("");
  const [pastedAvatarUrl, setPastedAvatarUrl] = useState("");

  // The cropped portrait (data URL). Not a field: onSave uploads it after creation.
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);

  // A familiar created from the form's dialog, bonded by onSave.
  const [createdFamiliar, setCreatedFamiliar] = useState<{ id: string; nombre: string } | null>(null);

  // Local state for adding a skill and saving defaults (keyed by category id)
  const [inlineSkillNames, setInlineSkillNames] = useState<Record<string, string>>({});

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

  // Handle house selection change
  const handleHouseChange = (houseKey: House) => {
    setCharacterState(prev => ({ ...prev, casa: houseKey }));
  };

  /** Age is a whole number, 0-999; an empty box leaves it unset. */
  const handleAgeChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    setCharacterState(prev => ({ ...prev, edad: digits ? Math.min(999, parseInt(digits, 10)) : undefined }));
  };

  // Read a picked portrait and open the interactive cropper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);

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
      setAvatarDataUrl(croppedBase64);
      setIsCropperOpen(false);
      setCropImageSrc(null);
    } catch (err: any) {
      console.error("Cropping confirm error:", err);
      setImageError(t.imageUploadError || "Failed to crop image.");
    }
  };

  const removeAvatar = () => setAvatarDataUrl(null);

  // Text lists (aspects, complications): entries { id, value }
  const addTextEntry = (key: TextListKey, text: string) => {
    const value = text.trim();
    if (!value) return false;
    setCharacterState(prev => ({ ...prev, [key]: [...(prev[key] ?? []), { id: newItemId(), value }] }));
    return true;
  };

  const removeTextEntry = (key: TextListKey, id: string) => {
    setCharacterState(prev => ({ ...prev, [key]: (prev[key] ?? []).filter(e => e.id !== id) }));
  };

  // Aspects Management
  const addAspect = () => {
    if (addTextEntry("aspectosPersonales", newAspectName)) setNewAspectName("");
  };
  const removeAspect = (id: string) => removeTextEntry("aspectosPersonales", id);

  // Complications Management
  const addComplication = () => {
    if (addTextEntry("complicaciones", newComplicationName)) setNewComplicationName("");
  };
  const removeComplication = (id: string) => removeTextEntry("complicaciones", id);

  // Equipment / Inventory Management
  const addEquipmentItem = () => {
    if (!newItemName.trim()) return;
    const newItem = { id: newItemId(), nombre: newItemName.trim(), cantidad: Math.max(1, newItemQty) };
    setCharacterState(prev => ({ ...prev, equipoList: [...(prev.equipoList ?? []), newItem] }));
    setNewItemName("");
    setNewItemQty(1);
  };

  const removeEquipmentItem = (id: string) => {
    setCharacterState(prev => ({ ...prev, equipoList: (prev.equipoList ?? []).filter(eq => eq.id !== id) }));
  };

  // Custom Fields Management
  const addCustomField = () => {
    if (!newCustomFieldName.trim() || !newCustomFieldValue.trim()) return;
    const newField = { id: newItemId(), nombre: newCustomFieldName.trim(), valor: newCustomFieldValue.trim() };
    setCharacterState(prev => ({ ...prev, camposPersonalizados: [...(prev.camposPersonalizados ?? []), newField] }));
    setNewCustomFieldName("");
    setNewCustomFieldValue("");
  };

  const updateCustomField = (id: string, field: "nombre" | "valor", value: string) => {
    setCharacterState(prev => ({
      ...prev,
      camposPersonalizados: (prev.camposPersonalizados ?? []).map(cf => (cf.id === id ? { ...cf, [field]: value } : cf)),
    }));
  };

  const removeCustomField = (id: string) => {
    setCharacterState(prev => ({ ...prev, camposPersonalizados: (prev.camposPersonalizados ?? []).filter(cf => cf.id !== id) }));
  };

  // Stress maxima, 1-10
  const setStressMax = (key: "estresFisicoMax" | "estresMentalMax" | "estresSocialMax", next: (current: number) => number) => {
    setCharacterState(prev => ({ ...prev, [key]: Math.max(1, Math.min(10, next(prev[key] ?? 1))) }));
  };

  // Skills interactive increment/decrement handlers (0-5)
  // The knowledge level of an esoteric skill (none removes the field).
  const setSkillKnowledge = (skillId: string, level: EsotericKnowledge | undefined) =>
    setCharacterState(prev => ({
      ...prev,
      habilidades: (prev.habilidades ?? []).map(sk => {
        if (sk.id !== skillId) return sk;
        const { conocimiento: _level, ...rest } = sk;
        return level ? { ...rest, conocimiento: level } : rest;
      }),
    }));

  const adjustSkillValue = (skillId: string, amount: number) => {
    setCharacterState(prev => ({
      ...prev,
      habilidades: (prev.habilidades ?? []).map(sk =>
        sk.id === skillId ? { ...sk, valor: Math.max(0, Math.min(5, (sk.valor ?? 0) + amount)) } : sk
      ),
    }));
  };

  const [skillError, setSkillError] = useState<string | null>(null);

  const handleAddInlineSkill = (category: SkillCategory) => {
    const name = (inlineSkillNames[category.id] || "").trim();
    if (!name) return;
    setSkillError(null);
    const lower = name.toLocaleLowerCase();
    const catalogueNames = catalogue.habilidades.flatMap(s => [s.nombre.es, s.nombre.en]);
    const ownNames = (characterState.habilidades ?? []).filter(s => !s.catalogo).map(s => s.nombre);
    const exists = [...catalogueNames, ...ownNames].some(n => !!n && n.trim().toLocaleLowerCase() === lower);
    if (exists) {
      setSkillError(t.errSkillExists.replace("{name}", name));
      return;
    }
    // The GM's typed skill joins the campaign's list (C2) and the new character links it.
    const add = (entry: SkillEntry) => {
      setCharacterState(prev => ({ ...prev, habilidades: [...(prev.habilidades ?? []), entry] }));
      setInlineSkillNames(prev => ({ ...prev, [category.id]: "" }));
    };
    if (onAddCatalogueSkill) {
      void onAddCatalogueSkill(category.id, name).then(id => add({ id: newItemId(), catalogo: id, valor: 0 }), () => {});
      return;
    }
    add({ id: newItemId(), nombre: name, categoria: category.id, valor: 0 });
  };

  const handleRemoveSkill = (skillId: string) => {
    setCharacterState(prev => ({ ...prev, habilidades: (prev.habilidades ?? []).filter(s => s.id !== skillId) }));
  };

  // The + list: a catalogue skill the character does not have yet, at 0.
  const handlePickSkill = (catalogo: string) =>
    setCharacterState(prev => ({ ...prev, habilidades: [...(prev.habilidades ?? []), { id: newItemId(), catalogo, valor: 0 }] }));

  // Creating the character
  const saving = useRef(false);
  const handleSave = async () => {
    if (saving.current) return;
    const nombre = (characterState.nombre ?? "").trim();
    if (!nombre) {
      setFormError(t.validationErrorName || "Character name is required.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFormError(null);
    saving.current = true;
    try {
      await onSave({ ...characterState, nombre }, avatarDataUrl ?? undefined, createdFamiliar?.id);
    } catch (err) {
      console.error("Creating the character failed:", err);
      setFormError(describeSaveFailure(err, lang));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      saving.current = false;
    }
  };

  // Creating a familiar from the form's dialog: remembered for onSave's bond.
  const handleCreateFamiliar = async (fields: Parameters<CharacterFormProps["onCreateFamiliar"]>[0], image?: string) => {
    const created = await onCreateFamiliar(fields, image);
    setCreatedFamiliar({ id: created.id, nombre: created.nombre });
    return created.id;
  };

  const isStateDirty = () =>
    (characterState.nombre ?? "").trim() !== "" ||
    (characterState.concepto ?? "").trim() !== "" ||
    (characterState.jugador ?? "").trim() !== "" ||
    !!avatarDataUrl ||
    (characterState.aspectosPersonales ?? []).length > 0 ||
    (characterState.complicaciones ?? []).length > 0 ||
    (characterState.equipoList ?? []).length > 0 ||
    (characterState.camposPersonalizados ?? []).length > 0;

  const handleCancelClick = () => {
    if (isStateDirty()) {
      setShowDiscardModal(true);
      return;
    }
    onCancel();
  };

  // The house's own motto for the banner (students with a house)
  const houseMotto = characterType !== "adult_wizard" && characterState.casa
    ? translateHouseMotto(getLocalizedHouseLore(characterState.casa, lang).lema, lang)
    : "";

  // Obtain current visual theme for dynamic accenting and styling
  const theme = getCharacterVisualTheme({ characterType, casa: characterState.casa ?? "" });

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
    catalogue,
    onCancel,
    t,
    activeFormTab,
    setActiveFormTab,
    characterState,
    setCharacterState,
    characterType,
    profile,
    updateProfileField,
    updateTeachingSubjects,
    formError,
    setFormError,
    imageError,
    setImageError,
    newAspectName,
    setNewAspectName,
    newComplicationName,
    setNewComplicationName,
    pastedAvatarUrl,
    setPastedAvatarUrl,
    avatarDataUrl,
    removeAvatar,
    createdFamiliar,
    inlineSkillNames,
    setInlineSkillNames,
    isGM,
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
    handleHouseChange,
    handleAgeChange,
    handleImageUpload,
    handleUrlAvatarSubmit,
    onCropComplete,
    handleConfirmCrop,
    addAspect,
    removeAspect,
    addComplication,
    removeComplication,
    addEquipmentItem,
    removeEquipmentItem,
    addCustomField,
    updateCustomField,
    removeCustomField,
    setStressMax,
    adjustSkillValue,
    skillError,
    setSkillError,
    handleAddInlineSkill,
    handleRemoveSkill,
    handlePickSkill,
    setSkillKnowledge,
    handleSave,
    handleCreateFamiliar,
    handleCancelClick,
    houseMotto,
    theme,
    houseAccentBorder,
    houseTabBtnStyle,
    houseIconColor,
  };
}

export type FormContext = ReturnType<typeof useCharacterForm>;
