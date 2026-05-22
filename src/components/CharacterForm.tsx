/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Character, HOUSES, DEFAULT_SKILLS, Skill, CustomField } from "../types";
import { Language, TRANSLATIONS } from "../localization";
import Cropper from "react-easy-crop";
import { compressImage, getCroppedImg } from "../utils/imageCompressor";
import { 
  Save, 
  X, 
  Sparkles, 
  Image, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  History,
  Coins,
  ShieldAlert as Heart,
  FileText
} from "lucide-react";

interface CharacterFormProps {
  lang: Language;
  initialCharacter?: Character | null; // If null, we are creating a new character
  onSave: (character: Character) => void;
  onCancel: () => void;
}

export const CharacterForm: React.FC<CharacterFormProps> = ({
  lang,
  initialCharacter,
  onSave,
  onCancel,
}) => {
  const t = TRANSLATIONS[lang];

  // Load initial values or prefilled default draft
  const [characterState, setCharacterState] = useState<Omit<Character, "id" | "createdAt" | "updatedAt">>({
    nombre: "",
    jugador: "",
    edad: "11 años",
    casa: "IRATI",
    curso: "1º",
    puestoClase: "",
    concepto: "",
    lema: "Creer es ver",
    escudoText: "IRATI",
    complicaciones: [],
    linaje: "Mítico",
    puntosDestino: 3,
    economia: "Normal",
    familiar: "",
    varitaSintonia: "",
    estresFisico: 0,
    estresFisicoMax: 5,
    estresMental: 0,
    estresMentalMax: 5,
    estresMentalConsecuencia: "",
    estresSocial: 0,
    estresSocialMax: 5,
    consecuenciasFisicas: [],
    consecuenciasMentales: [],
    consecuenciasSociales: [],
    pxs: 0,
    aspectoTemporal: [],
    aspectosPersonales: [],
    habilidades: DEFAULT_SKILLS.map(sk => ({ ...sk, valor: 0 })),
    conjuros: [],
    pociones: [],
    clubes: "",
    clubesList: [],
    equipo: "",
    equipoList: [],
    notas: "",
    notasList: [],
    avatarImage: "",
    avatarFit: "cover",
    galleryImages: [],
    camposPersonalizados: [],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [newAspectName, setNewAspectName] = useState("");
  const [newComplicationName, setNewComplicationName] = useState("");
  const [newFormTempAspect, setNewFormTempAspect] = useState("");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [pastedAvatarUrl, setPastedAvatarUrl] = useState("");

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
        linaje: initialCharacter.linaje || "Mítico",
        puntosDestino: initialCharacter.puntosDestino !== undefined ? initialCharacter.puntosDestino : 3,
        economia: initialCharacter.economia || "Normal",
        familiar: initialCharacter.familiar || "",
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
          : DEFAULT_SKILLS.map(sk => ({ ...sk, valor: 0 })),
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
      });
    }
  }, [initialCharacter]);

  // Handle house selection change
  const handleHouseChange = (houseName: string) => {
    const houseKey = houseName.toUpperCase();
    const houseData = HOUSES[houseKey];
    
    setCharacterState(prev => ({
      ...prev,
      casa: houseName,
      lema: houseData ? houseData.lema : prev.lema,
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
        // Gallery remains high-quality auto-compressed without cropping (retains dynamic heights for masonry)
        const base64Str = await compressImage(file, 1600, 1600, 0.75);
        setCharacterState(prev => ({
          ...prev,
          galleryImages: [...prev.galleryImages, base64Str]
        }));
      }
    } catch (err: any) {
      console.error("Image upload processing error:", err);
      setImageError(t.imageUploadError);
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
      setImageError(t.imageUploadError);
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

  // Custom Fields Management
  const addCustomField = () => {
    if (!newFieldName.trim() || !newFieldValue.trim()) return;
    setCharacterState(prev => ({
      ...prev,
      camposPersonalizados: [
        ...prev.camposPersonalizados, 
        { nombre: newFieldName.trim(), valor: newFieldValue.trim() }
      ]
    }));
    setNewFieldName("");
    setNewFieldValue("");
  };

  const removeCustomField = (idx: number) => {
    setCharacterState(prev => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.filter((_, i) => i !== idx)
    }));
  };

  // Save changes
  const handleSave = () => {
    if (!characterState.nombre.trim()) {
      setFormError(t.validationErrorName);
      // Scroll to top or near error
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

  // Check if current form values differ from the initial character details (or if a new draft has data)
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
        characterState.linaje !== (initialCharacter.linaje || "Mítico") ||
        characterState.puntosDestino !== (initialCharacter.puntosDestino !== undefined ? initialCharacter.puntosDestino : 3) ||
        characterState.economia !== (initialCharacter.economia || "Normal") ||
        characterState.familiar !== (initialCharacter.familiar || "") ||
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
        JSON.stringify(characterState.conjuros) !== JSON.stringify(initialCharacter.conjuros || []) ||
        JSON.stringify(characterState.pociones) !== JSON.stringify(initialCharacter.pociones || []) ||
        characterState.clubes !== (initialCharacter.clubes || "") ||
        JSON.stringify(characterState.clubesList) !== JSON.stringify(initialCharacter.clubesList || []) ||
        characterState.equipo !== (initialCharacter.equipo || "") ||
        JSON.stringify(characterState.equipoList) !== JSON.stringify(initialCharacter.equipoList || []) ||
        characterState.notas !== (initialCharacter.notas || "") ||
        JSON.stringify(characterState.notasList) !== JSON.stringify(initialCharacter.notasList || []) ||
        characterState.avatarImage !== (initialCharacter.avatarImage || "") ||
        characterState.avatarFit !== (initialCharacter.avatarFit || "cover") ||
        JSON.stringify(characterState.galleryImages) !== JSON.stringify(initialCharacter.galleryImages || []) ||
        JSON.stringify(characterState.camposPersonalizados) !== JSON.stringify(initialCharacter.camposPersonalizados || [])
      );
    } else {
      return characterState.nombre.trim() !== "" || characterState.concepto.trim() !== "";
    }
  };

  // Interactive Cancel Flow with check
  const handleCancelClick = () => {
    const isDirty = isStateDirty();
    if (isDirty) {
      try {
        const confirmDiscard = window.confirm(t.draftDiscardConfirm);
        if (!confirmDiscard) return;
      } catch (e) {
        console.warn("window.confirm blocked or failed in sandbox iframe:", e);
      }
    }
    onCancel();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" id="character-form-container">
      {/* Header and Save Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 border-b border-violet-500/15 pb-4">
        <div>
          <h2 className="font-magic text-xl md:text-2xl text-amber-400 select-none flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: "12s" }} />
            {initialCharacter ? t.edit : t.addCharacter}
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            {initialCharacter ? `ID: ${initialCharacter.id}` : "Magistri Scholae Draft Security ON"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-form-cancel"
            onClick={handleCancelClick}
            className="px-4 py-2 border border-neutral-700 hover:border-neutral-500 bg-neutral-900/60 hover:bg-neutral-800 rounded-xl text-xs sm:text-sm font-semibold transition-all text-neutral-300 font-mono cursor-pointer"
          >
            {t.cancel}
          </button>
          
          <button
            id="btn-form-save"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-900/40 hover:shadow-amber-900/60 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {t.save}
          </button>
        </div>
      </div>

      {formError && (
        <div 
          id="form-error-alert"
          className="mb-6 p-4 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-350 flex items-center gap-3"
        >
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{formError}</span>
        </div>
      )}

      {/* Editor Content split in sections for clarity */}
      <div className="space-y-6">

        {/* 1. Datos de Alumno: Basic Profiling */}
        <div className="glass-panel p-6 rounded-2xl border border-violet-500/15" id="form-sec-perfil">
          <h3 className="font-magic text-sm text-neutral-300 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            1. {t.secDatosAlumno}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Nombre */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                {t.nombre} <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-nombre"
                type="text"
                placeholder={t.placeholderNombre}
                value={characterState.nombre}
                onChange={(e) => {
                  setCharacterState(prev => ({ ...prev, nombre: e.target.value }));
                  if (formError) setFormError(null);
                }}
                className="w-full"
              />
            </div>

            {/* Jugador */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.jugador}
              </label>
              <input
                id="input-jugador"
                type="text"
                placeholder={t.placeholderJugador}
                value={characterState.jugador}
                onChange={(e) => setCharacterState(prev => ({ ...prev, jugador: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* Edad */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.edad}
              </label>
              <input
                id="input-edad"
                type="text"
                value={characterState.edad}
                onChange={(e) => setCharacterState(prev => ({ ...prev, edad: e.target.value }))}
                className="w-full font-mono"
              />
            </div>

            {/* Casa */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.casa}
              </label>
              <select
                id="select-casa"
                value={characterState.casa.toUpperCase()}
                onChange={(e) => handleHouseChange(e.target.value)}
                className="w-full bg-neutral-900 font-semibold"
              >
                {Object.keys(HOUSES).map((hKey) => (
                  <option key={hKey} value={hKey}>
                    🏰 {HOUSES[hKey].nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Curso */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.curso}
              </label>
              <input
                id="input-curso"
                type="text"
                value={characterState.curso}
                onChange={(e) => setCharacterState(prev => ({ ...prev, curso: e.target.value }))}
                className="w-full font-mono"
              />
            </div>

            {/* Puesto de Clase */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.puestoClase}
              </label>
              <input
                id="input-puesto-clase"
                type="text"
                placeholder={t.placeholderPuestoClase}
                value={characterState.puestoClase}
                onChange={(e) => setCharacterState(prev => ({ ...prev, puestoClase: e.target.value }))}
                className="w-full font-sans"
              />
            </div>

            {/* Arquetipo/Concepto */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.concepto}
              </label>
              <input
                id="input-concepto"
                type="text"
                placeholder={t.placeholderConcepto}
                value={characterState.concepto}
                onChange={(e) => setCharacterState(prev => ({ ...prev, concepto: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* Lema de Casa */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.lema}
              </label>
              <input
                id="input-lema"
                type="text"
                value={characterState.lema}
                onChange={(e) => setCharacterState(prev => ({ ...prev, lema: e.target.value }))}
                className="w-full italic font-serif text-amber-200"
              />
            </div>

            {/* Escudo Texto */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.escudoText}
              </label>
              <input
                id="input-escudo-text"
                type="text"
                value={characterState.escudoText}
                onChange={(e) => setCharacterState(prev => ({ ...prev, escudoText: e.target.value }))}
                className="w-full font-mono tracking-wider font-bold"
              />
            </div>
          </div>
        </div>

        {/* 2. Avatar loading & upload */}
        <div className="glass-panel p-6 rounded-2xl border border-violet-500/15" id="form-sec-retrato">
          <h3 className="font-magic text-sm text-neutral-300 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-4 flex items-center gap-2">
            <Image className="w-4 h-4 text-violet-400" />
            2. {t.uploadAvatar}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Display box */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-40 aspect-[3/4] bg-neutral-950 rounded-2xl border-2 border-violet-500/30 flex items-center justify-center overflow-hidden shadow-inner relative">
                {characterState.avatarImage ? (
                  <img
                    id="avatar-edit-preview"
                    src={characterState.avatarImage}
                    alt="Retrato"
                    className={`w-full h-full ${characterState.avatarFit === "contain" ? "object-contain bg-[#11091f]" : "object-cover"}`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center text-neutral-600 p-4 select-none">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-violet-400" />
                    <span className="text-[10px] font-mono">SIN RETRATO</span>
                  </div>
                )}
                {characterState.avatarImage && (
                  <button
                    id="btn-remove-avatar"
                    type="button"
                    onClick={() => setCharacterState(prev => ({ ...prev, avatarImage: "" }))}
                    className="absolute bottom-2 right-2 bg-rose-950/80 border border-rose-500/30 p-1.5 rounded-lg text-rose-350 hover:text-rose-200 transition-all cursor-pointer"
                    title="Remove avatar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Form controls */}
            <div className="md:col-span-2 space-y-4">
              {/* Image upload/compress error */}
              {imageError && (
                <div className="bg-rose-950/40 border border-rose-500/20 rounded-xl p-3 flex items-center justify-between text-rose-300 text-[11px] font-mono animate-fade-in" id="avatar-image-upload-error">
                  <div className="flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>{imageError}</span>
                  </div>
                  <button
                    id="btn-close-avatar-err"
                    type="button"
                    onClick={() => setImageError(null)}
                    className="text-rose-400 hover:text-rose-200 cursor-pointer p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Local upload */}
              <div className="p-4 bg-neutral-950/40 rounded-xl border border-dashed border-violet-500/25 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-neutral-400 mb-2 font-mono">
                  {t.subirArchivoLocalMax}
                </p>
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "avatar")}
                  className="block w-full text-xs text-neutral-400 file:mr-4 file:py-1 py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-950 file:text-violet-200 hover:file:bg-violet-900 cursor-pointer"
                />
              </div>

              {/* URL paste */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">
                  {t.pasteUrl}
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-avatar-url"
                    type="text"
                    placeholder="https://images.unsplash.com/your-image"
                    value={pastedAvatarUrl}
                    onChange={(e) => setPastedAvatarUrl(e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <button
                    id="btn-apply-avatar-url"
                    type="button"
                    onClick={handleUrlAvatarSubmit}
                    className="px-3 py-1 bg-violet-900 border border-violet-500/30 text-violet-100 rounded-md text-xs font-mono font-bold hover:bg-violet-800 transition-all"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Complicación, Linaje, Destino, Economía */}
        <div className="glass-panel p-6 rounded-2xl border border-violet-500/15" id="form-sec-linaje">
          <h3 className="font-magic text-sm text-neutral-300 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-4 flex items-center gap-2">
            <Coins className="w-4 h-4 text-violet-400" />
            3. {t.secLinajeDestino}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Linaje */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.linaje}
              </label>
              <input
                id="input-linaje"
                type="text"
                placeholder={t.placeholderLinaje}
                value={characterState.linaje}
                onChange={(e) => setCharacterState(prev => ({ ...prev, linaje: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* Puntos de Destino */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.puntosDestino}
              </label>
              <input
                id="input-puntos-destino"
                type="number"
                min="0"
                value={characterState.puntosDestino}
                onChange={(e) => setCharacterState(prev => ({ ...prev, puntosDestino: parseInt(e.target.value) || 0 }))}
                className="stat-input rounded-md py-1.5"
              />
            </div>

            {/* Economía */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.economia}
              </label>
              <input
                id="input-economia"
                type="text"
                placeholder={t.placeholderEconomia}
                value={characterState.economia}
                onChange={(e) => setCharacterState(prev => ({ ...prev, economia: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* Pxs */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.pxs}
              </label>
              <input
                id="input-pxs"
                type="number"
                min="0"
                value={characterState.pxs}
                onChange={(e) => setCharacterState(prev => ({ ...prev, pxs: parseInt(e.target.value) || 0 }))}
                className="stat-input rounded-md py-1.5"
              />
            </div>

            {/* Aspectos Temporales List Editor */}
            <div className="flex flex-col gap-3 md:col-span-2 border-t border-violet-500/10 pt-4 mt-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                {t.aspectoTemporal}
              </label>
              
              {/* Form Input for Temporary Aspects */}
              <div className="flex gap-2">
                <input
                  id="input-new-temp-aspect-form"
                  type="text"
                  placeholder={t.placeholderAspectoTemporal}
                  value={newFormTempAspect}
                  onChange={(e) => setNewFormTempAspect(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTempAspect();
                    }
                  }}
                  className="flex-1 text-xs"
                />
                <button
                  id="btn-add-temp-aspect-form"
                  type="button"
                  onClick={addTempAspect}
                  className="px-4 py-1.5 bg-violet-900 border border-violet-500/35 hover:bg-violet-850 text-violet-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === "es" ? "Añadir" : "Add"}
                </button>
              </div>

              {/* Temporary Aspects List of values */}
              {characterState.aspectoTemporal && characterState.aspectoTemporal.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="temp-aspects-editor-list">
                  {characterState.aspectoTemporal.map((ast, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center bg-neutral-950/40 border border-violet-500/15 p-2 rounded-lg"
                    >
                      <span className="text-xs text-neutral-350 font-serif italic">“ {ast} ”</span>
                      <button
                        type="button"
                        onClick={() => removeTempAspect(index)}
                        className="text-neutral-500 hover:text-rose-450 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-1.5">
                  {t.labelAspectosTemporalesEmpty}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 4. Familiar y Varita */}
        <div className="glass-panel p-6 rounded-2xl border border-violet-500/15" id="form-sec-familiar">
          <h3 className="font-magic text-sm text-neutral-300 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            4. {t.secFamiliarVarita}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.familiar}
              </label>
              <input
                id="input-familiar"
                type="text"
                placeholder={t.placeholderFamiliar}
                value={characterState.familiar}
                onChange={(e) => setCharacterState(prev => ({ ...prev, familiar: e.target.value }))}
                className="w-full text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.varitaSintonia}
              </label>
              <input
                id="input-varita-sintonia"
                type="text"
                placeholder={t.placeholderVaritaSintonia}
                value={characterState.varitaSintonia}
                onChange={(e) => setCharacterState(prev => ({ ...prev, varitaSintonia: e.target.value }))}
                className="w-full text-xs"
              />
            </div>
          </div>
        </div>

        {/* 5. Estrés */}
        <div className="glass-panel p-6 rounded-2xl border border-violet-500/15" id="form-sec-estres">
          <h3 className="font-magic text-sm text-neutral-300 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-violet-400" />
            5. {t.secEstresRango}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Estrés Físico */}
            <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-2">
              <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase">
                {t.estresFisico}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-[9px] font-mono text-neutral-500">{t.labelActual}</div>
                  <input
                    id="input-estres-fisico"
                    type="number"
                    min="0"
                    max={characterState.estresFisicoMax}
                    value={characterState.estresFisico}
                    onChange={(e) => setCharacterState(prev => ({ ...prev, estresFisico: parseInt(e.target.value) || 0 }))}
                    className="stat-input rounded-md w-full"
                  />
                </div>
                <div>
                  <div className="text-[9px] font-mono text-neutral-500">{t.labelMaximo}</div>
                  <input
                    id="input-estres-fisico-max"
                    type="number"
                    min="1"
                    value={characterState.estresFisicoMax}
                    onChange={(e) => setCharacterState(prev => ({ ...prev, estresFisicoMax: parseInt(e.target.value) || 5 }))}
                    className="stat-input rounded-md w-full"
                  />
                </div>
              </div>
            </div>

            {/* Estrés Mental */}
            <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-2">
              <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase">
                {t.estresMental}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-[9px] font-mono text-neutral-500">{t.labelActual}</div>
                  <input
                    id="input-estres-mental"
                    type="number"
                    min="0"
                    max={characterState.estresMentalMax}
                    value={characterState.estresMental}
                    onChange={(e) => setCharacterState(prev => ({ ...prev, estresMental: parseInt(e.target.value) || 0 }))}
                    className="stat-input rounded-md w-full"
                  />
                </div>
                <div>
                  <div className="text-[9px] font-mono text-neutral-500">{t.labelMaximo}</div>
                  <input
                    id="input-estres-mental-max"
                    type="number"
                    min="1"
                    value={characterState.estresMentalMax}
                    onChange={(e) => setCharacterState(prev => ({ ...prev, estresMentalMax: parseInt(e.target.value) || 5 }))}
                    className="stat-input rounded-md w-full"
                  />
                </div>
              </div>
            </div>

            {/* Estrés Social */}
            <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-2">
              <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase">
                {t.estresSocial}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-[9px] font-mono text-neutral-500">{t.labelActual}</div>
                  <input
                    id="input-estres-social"
                    type="number"
                    min="0"
                    max={characterState.estresSocialMax}
                    value={characterState.estresSocial}
                    onChange={(e) => setCharacterState(prev => ({ ...prev, estresSocial: parseInt(e.target.value) || 0 }))}
                    className="stat-input rounded-md w-full"
                  />
                </div>
                <div>
                  <div className="text-[9px] font-mono text-neutral-500">{t.labelMaximo}</div>
                  <input
                    id="input-estres-social-max"
                    type="number"
                    min="1"
                    value={characterState.estresSocialMax}
                    onChange={(e) => setCharacterState(prev => ({ ...prev, estresSocialMax: parseInt(e.target.value) || 5 }))}
                    className="stat-input rounded-md w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Aspectos Personales y Complicaciones */}
        <div className="glass-panel p-6 rounded-2xl border border-violet-500/15" id="form-sec-aspectos">
          <h3 className="font-magic text-sm text-neutral-300 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" />
            6. {t.aspectosPersonales} & {t.complicaciones}
          </h3>

          <div className="space-y-6">
            {/* Aspectos Personales Block */}
            <div className="space-y-4">
              <h4 className="text-xs font-magic text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                🌟 {t.aspectosPersonales}
              </h4>
              
              {/* Aspect Form */}
              <div className="flex gap-2">
                <input
                  id="input-new-aspect"
                  type="text"
                  placeholder={t.placeholderNuevoAspecto}
                  value={newAspectName}
                  onChange={(e) => setNewAspectName(e.target.value)}
                  className="flex-1 text-xs"
                />
                <button
                  id="btn-add-aspect"
                  type="button"
                  onClick={addAspect}
                  className="px-4 py-1.5 bg-violet-900 border border-violet-500/35 hover:bg-violet-850 text-violet-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.addAspect || "Add Aspect"}
                </button>
              </div>

              {/* Aspects List */}
              {characterState.aspectosPersonales.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="aspects-editor-list">
                  {characterState.aspectosPersonales.map((as, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center bg-neutral-950/40 border border-violet-500/15 p-2 rounded-lg"
                    >
                      <span className="text-xs text-neutral-200 font-serif italic">“ {as} ”</span>
                      <button
                        type="button"
                        onClick={() => removeAspect(index)}
                        className="text-neutral-500 hover:text-rose-450 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-1.5">
                  {t.labelAspectsEmpty}
                </p>
              )}
            </div>

            {/* Divider divider divider */}
            <div className="border-t border-violet-500/10 pt-4"></div>

            {/* Complicaciones Block */}
            <div className="space-y-4">
              <h4 className="text-xs font-magic text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                ⚠️ {t.complicaciones}
              </h4>

              {/* Complication Form */}
              <div className="flex gap-2">
                <input
                  id="input-new-complication"
                  type="text"
                  placeholder={t.placeholderComplicaciones}
                  value={newComplicationName}
                  onChange={(e) => setNewComplicationName(e.target.value)}
                  className="flex-1 text-xs"
                />
                <button
                  id="btn-add-complication"
                  type="button"
                  onClick={addComplication}
                  className="px-4 py-1.5 bg-rose-950 border border-rose-550/30 hover:bg-rose-900 text-rose-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === "es" ? "Añadir Complicación" : "Add Flaw"}
                </button>
              </div>

              {/* Complications List */}
              {characterState.complicaciones.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="complications-editor-list">
                  {characterState.complicaciones.map((comp, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center bg-neutral-950/40 border border-rose-500/15 p-2 rounded-lg"
                    >
                      <span className="text-xs text-rose-300 font-sans italic">“ {comp} ”</span>
                      <button
                        type="button"
                        onClick={() => removeComplication(index)}
                        className="text-neutral-500 hover:text-rose-450 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-1.5">
                  {t.labelComplicacionesEmpty}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 7. Campos personalizados */}
        <div className="glass-panel p-6 rounded-2xl border border-violet-500/15" id="form-sec-campos-custom">
          <h3 className="font-magic text-sm text-neutral-300 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-400" />
            7. {t.customFields}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                id="input-custom-field-name"
                type="text"
                placeholder={t.fieldName}
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="text-xs"
              />
              <input
                id="input-custom-field-value"
                type="text"
                placeholder={t.fieldValue}
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                className="text-xs sm:col-span-2"
              />
            </div>
            <button
              id="btn-add-custom-field"
              type="button"
              onClick={addCustomField}
              className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded-lg font-bold flex items-center gap-1.5 w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.addCustomField}
            </button>

            {characterState.camposPersonalizados.length > 0 ? (
              <div className="space-y-2 border-t border-neutral-800 pt-3">
                {characterState.camposPersonalizados.map((fd, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center bg-neutral-900/30 px-3 py-2 border border-neutral-800 rounded-lg text-xs"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-amber-500 uppercase tracking-wider block">{fd.nombre}</span>
                      <span className="text-neutral-200 mt-0.5 block">{fd.valor}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="text-neutral-500 hover:text-rose-450 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

      </div>

      {/* Primary bottom controllers */}
      <div className="mt-8 flex justify-end gap-3 border-t border-violet-500/10 pt-4">
        <button
          id="btn-form-bottom-cancel"
          onClick={handleCancelClick}
          className="px-4 py-2 border border-neutral-700 hover:border-neutral-500 bg-neutral-900/60 hover:bg-neutral-800 rounded-xl text-xs sm:text-sm font-semibold transition-all text-neutral-300 font-mono cursor-pointer"
        >
          {t.cancel}
        </button>
        <button
          id="btn-form-bottom-save"
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-xl text-xs sm:text-sm shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {t.save}
        </button>
      </div>

      {isCropperOpen && cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in" id="crop-avatar-modal">
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
                className="w-full py-2.5 bg-violet-900 hover:bg-violet-850 border border-violet-600 text-violet-100 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {t.cropConfirm}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
