/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Character, HOUSES, Skill, CustomField, HOUSE_ICONS, CharacterType } from "../types";
import { Language, TRANSLATIONS } from "../localization";
import Cropper from "react-easy-crop";
import { compressImage, getCroppedImg } from "../utils/imageCompressor";
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
  Minus
} from "lucide-react";
import { createDefaultCharacter, getInitialDefaultSkills } from "../utils/characterFactory";

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

  // Forms Navigation State
  const [activeFormTab, setActiveFormTab] = useState<
    "perfil" | "afiliacion" | "habilidades" | "estres" | "aspectos"
  >("perfil");

  // Load initial values or prefilled default draft
  const [characterState, setCharacterState] = useState<Omit<Character, "id" | "createdAt" | "updatedAt">>(
    createDefaultCharacter("student")
  );

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
      });
    }
  }, [initialCharacter]);

  // Handle house selection change and apply its typical crest/motto
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
    const exists = characterState.habilidades.some(
      s => s.nombre.toLowerCase() === rawVal.trim().toLowerCase()
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
        JSON.stringify(characterState.camposPersonalizados) !== JSON.stringify(initialCharacter.camposPersonalizados || []) ||
        characterState.avatarImage !== (initialCharacter.avatarImage || "") ||
        characterState.avatarFit !== (initialCharacter.avatarFit || "cover")
      );
    } else {
      return characterState.nombre.trim() !== "" || characterState.concepto.trim() !== "";
    }
  };

  const handleCancelClick = () => {
    if (isStateDirty()) {
      try {
        const confirmDiscard = window.confirm(t.draftDiscardConfirm || "Are you sure you want to discard changes?");
        if (!confirmDiscard) return;
      } catch (e) {
        console.warn("window.confirm blocked or failed in sandbox iframe:", e);
      }
    }
    onCancel();
  };

  // Obtain current chosen house metadata for dynamic accenting
  const chosenHouseKey = characterState.casa.toUpperCase();
  const chosenHouseInfo = HOUSES[chosenHouseKey] || HOUSES.IRATI;
  const houseAccentBorder = 
    chosenHouseKey === "IRATI" ? "border-emerald-500/30 text-emerald-400 focus:border-emerald-400" :
    chosenHouseKey === "URANIA" ? "border-amber-500/30 text-amber-400 focus:border-amber-400" :
    chosenHouseKey === "AL-KHWARIZMI" ? "border-violet-500/30 text-violet-400 focus:border-violet-400" :
    chosenHouseKey === "CALANTES" ? "border-indigo-500/30 text-indigo-400 focus:border-indigo-400" :
    "border-rose-500/30 text-rose-400 focus:border-rose-400";

  const houseTabBtnStyle = (tabId: typeof activeFormTab) => {
    const isActive = activeFormTab === tabId;
    if (isActive) {
      if (chosenHouseKey === "IRATI") return "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/25";
      if (chosenHouseKey === "URANIA") return "bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-md shadow-amber-950/25";
      if (chosenHouseKey === "AL-KHWARIZMI") return "bg-violet-950/60 border-violet-500/50 text-violet-300 shadow-md shadow-violet-950/25";
      if (chosenHouseKey === "CALANTES") return "bg-indigo-950/60 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-950/25";
      return "bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-md shadow-rose-950/25";
    }
    return "bg-neutral-950/40 border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200";
  };

  const houseIconColor = 
    chosenHouseKey === "IRATI" ? "text-emerald-400" :
    chosenHouseKey === "URANIA" ? "text-amber-400" :
    chosenHouseKey === "AL-KHWARIZMI" ? "text-violet-400" :
    chosenHouseKey === "CALANTES" ? "text-indigo-400" :
    "text-rose-400";

  return (
    <div className="w-full max-w-6xl mx-auto px-2 py-4 sm:py-6" id="character-form-container">
      
      {/* Dynamic Styled Banner Decor matching academic theme */}
      <div className={`p-6 rounded-2xl bg-gradient-to-r ${chosenHouseInfo.bgClass} border border-violet-500/10 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-2xl transition-all duration-300`}>
        {/* Ambient Magic Grid backdrops */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(124,58,237,0.1),transparent_50%)] pointer-events-none" />
        
        <div className="z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{HOUSE_ICONS[chosenHouseKey] || "🏰"}</span>
            <h2 className="font-magic text-xl md:text-2xl text-neutral-100 uppercase tracking-widest glow-amber">
              {initialCharacter ? t.edit : t.studentRegistration}
            </h2>
          </div>
          <p className="text-xs text-neutral-300 italic font-serif">
            {characterState.lema ? `« ${characterState.lema} »` : "Magistri Scholae Academy Register Desk"}
          </p>
        </div>

        {/* Global form controls top */}
        <div className="z-10 flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            id="btn-form-cancel"
            type="button"
            onClick={handleCancelClick}
            className="px-4 py-2 border border-neutral-700 bg-neutral-950/80 hover:bg-neutral-900 rounded-xl text-xs font-semibold font-mono text-neutral-300 transition-all hover:border-neutral-500 cursor-pointer"
          >
            {t.cancel}
          </button>
          
          <button
            id="btn-form-save"
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl text-neutral-950 transition-all font-sans duration-300 cursor-pointer shadow-lg hover:scale-[1.03] active:scale-[0.97] bg-amber-500 hover:bg-amber-400`}
          >
            <Save className="w-4 h-4" />
            {t.save}
          </button>
        </div>
      </div>

      {formError && (
        <div 
          id="form-error-alert"
          className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 flex items-center gap-3 animate-fade-in"
        >
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold font-mono">{formError}</span>
        </div>
      )}

      {/* Main Dual Column Dashboard Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        
        {/* Left column / Top Row: Sections Navigation Tabs */}
        <div className="flex overflow-x-auto lg:flex-col pb-2 lg:pb-0 gap-1.5 snap-x scrollbar-thin lg:sticky lg:top-6 z-20">
          {[
            { id: "perfil", label: t.tabIdentification, icon: User },
            { id: "aspectos", label: t.tabAspects, icon: Sparkles },
            { id: "afiliacion", label: t.tabHouseMotto, icon: Award },
            { id: "habilidades", label: t.tabAcademicSkills, icon: BookOpen },
            { id: "estres", label: t.tabStress, icon: Activity },
          ].map((formTab) => {
            const IconComp = formTab.icon;
            return (
              <button
                id={`btn-form-tab-${formTab.id}`}
                key={formTab.id}
                type="button"
                onClick={() => setActiveFormTab(formTab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left shrink-0 snap-center cursor-pointer select-none lg:w-full ${houseTabBtnStyle(formTab.id as any)}`}
              >
                <IconComp className={`w-4 h-4 shrink-0 ${activeFormTab === formTab.id ? houseIconColor : "text-neutral-500"}`} />
                <span className="truncate">{formTab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right column: Form Fields Sheet inside single gorgeous Panel */}
        <div className="glass-panel p-5 sm:p-7 rounded-2xl border border-violet-500/10 min-h-[480px]">
          
          {/* TAB 1: IDENTIFICATION */}
          {activeFormTab === "perfil" && (
            <div className="space-y-6 animate-fade-in" id="form-tabpanel-perfil">
              <div className="flex items-center gap-1.5 border-b border-violet-500/10 pb-3">
                <User className={`w-5 h-5 ${houseIconColor}`} />
                <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                  {t.titleBasicRegistry}
                </h3>
              </div>

              {/* Master layout grid: Portrait setup on Left and Text fields on Right */}
              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] lg:grid-cols-[200px_1fr] gap-6 items-start" id="perfil-form-grid">
                
                {/* Left Column: Portrait uploader */}
                <div className="flex flex-col items-center md:items-stretch space-y-4">
                  <div className={`w-40 md:w-full aspect-[3/4] bg-neutral-950 rounded-2xl border-2 flex items-center justify-center overflow-hidden relative shadow-inner mx-auto ${houseAccentBorder}`} id="avatar-form-box">
                    {characterState.avatarImage ? (
                      <img
                        id="avatar-edit-preview"
                        src={characterState.avatarImage}
                        alt="Retrato"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center text-neutral-600 p-4 select-none">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-violet-400" />
                        <span className="text-[10px] font-mono block uppercase">SIN RETRATO</span>
                        <span className="text-[8px] font-mono text-neutral-500 mt-1 block">Ratio 3:4 Ideal</span>
                      </div>
                    )}
                    {characterState.avatarImage && (
                      <button
                        id="btn-remove-avatar"
                        type="button"
                        onClick={() => setCharacterState(prev => ({ ...prev, avatarImage: "" }))}
                        className="absolute bottom-2 right-2 bg-rose-950/80 border border-rose-500/30 p-1.5 rounded-lg text-rose-350 hover:text-rose-200 transition-all cursor-pointer shadow"
                        title="Remove avatar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Portrait File / URL uploader controls */}
                  <div className="w-full p-3 bg-neutral-950/50 rounded-xl border border-neutral-850 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">{t.uploadAvatar || "Retrato Local"}</span>
                      <input
                        id="avatar-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "avatar")}
                        className="block w-full text-[10px] text-neutral-400 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-violet-950 file:text-violet-200 hover:file:bg-violet-900 cursor-pointer"
                      />
                    </div>

                    <div className="border-t border-neutral-850/60 pt-2 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">{t.pasteUrl || "Enlace URL"}</span>
                      <div className="flex gap-1.5">
                        <input
                          id="input-avatar-url"
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={pastedAvatarUrl}
                          onChange={(e) => setPastedAvatarUrl(e.target.value)}
                          className="flex-1 text-[10px] py-1 px-1.5 min-w-0"
                        />
                        <button
                          id="btn-apply-avatar-url"
                          type="button"
                          onClick={handleUrlAvatarSubmit}
                          className="px-2 bg-violet-900/60 border border-violet-500/25 text-violet-100 rounded text-[9px] font-mono font-bold hover:bg-violet-850 transition-all h-6 cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>

                  {imageError && (
                    <div className="bg-rose-950/40 border border-rose-500/20 rounded-lg p-2.5 flex items-center justify-between text-rose-300 text-[10px] font-mono" id="avatar-image-upload-error">
                      <span className="truncate">{imageError}</span>
                      <button
                        id="btn-close-avatar-err"
                        type="button"
                        onClick={() => setImageError(null)}
                        className="text-rose-400 hover:text-rose-200 cursor-pointer p-0.5 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column: Character Information Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Nombre */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-between">
                      <span>{t.nombre} <span className="text-rose-400">*</span></span>
                      <span className="text-[9px] text-neutral-500 normal-case font-normal leading-none">Min. 1 letra</span>
                    </label>
                    <input
                      id="input-nombre"
                      type="text"
                      required
                      placeholder={t.placeholderNombre}
                      value={characterState.nombre}
                      onChange={(e) => {
                        setCharacterState(prev => ({ ...prev, nombre: e.target.value }));
                        if (formError) setFormError(null);
                      }}
                      className="w-full text-sm font-sans"
                    />
                  </div>

                  {/* Arquetipo/Concepto */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      {t.concepto}
                    </label>
                    <input
                      id="input-concepto"
                      type="text"
                      placeholder={t.placeholderConcepto}
                      value={characterState.concepto}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, concepto: e.target.value }))}
                      className="w-full text-xs font-sans"
                    />
                  </div>

                  {/* Jugador */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      {t.jugador}
                    </label>
                    <input
                      id="input-jugador"
                      type="text"
                      placeholder={t.placeholderJugador}
                      value={characterState.jugador}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, jugador: e.target.value }))}
                      className="w-full text-xs font-sans"
                    />
                  </div>

                  {/* Edad */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      {t.edad}
                    </label>
                    <input
                      id="input-edad"
                      type="text"
                      value={characterState.edad}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, edad: e.target.value }))}
                      className="w-full text-xs font-mono"
                    />
                  </div>

                  {/* Curso */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      {t.curso}
                    </label>
                    <input
                      id="input-curso"
                      type="text"
                      value={characterState.curso}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, curso: e.target.value }))}
                      className="w-full text-xs font-mono"
                    />
                  </div>

                  {/* Puesto de Clase */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      {t.puestoClase}
                    </label>
                    <input
                      id="input-puesto-clase"
                      type="text"
                      placeholder={t.placeholderPuestoClase}
                      value={characterState.puestoClase}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, puestoClase: e.target.value }))}
                      className="w-full text-xs font-sans"
                    />
                  </div>

                  {/* Linaje familiar */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      {t.linaje}
                    </label>
                    <input
                      id="input-linaje"
                      type="text"
                      placeholder={t.placeholderLinaje}
                      value={characterState.linaje}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, linaje: e.target.value }))}
                      className="w-full text-xs font-sans"
                    />
                  </div>

                  {/* Economía */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      {t.economia}
                    </label>
                    <input
                      id="input-economia"
                      type="text"
                      placeholder={t.placeholderEconomia}
                      value={characterState.economia}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, economia: e.target.value }))}
                      className="w-full text-xs font-sans"
                    />
                  </div>

                  {/* Familiar */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      {t.familiar}
                    </label>
                    <input
                      id="input-familiar"
                      type="text"
                      placeholder={t.placeholderFamiliar}
                      value={characterState.familiar}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, familiar: e.target.value }))}
                      className="w-full text-xs font-sans"
                    />
                  </div>

                  {/* Varita/Sintonía */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      {t.varitaSintonia}
                    </label>
                    <input
                      id="input-varita-sintonia"
                      type="text"
                      placeholder={t.placeholderVaritaSintonia}
                      value={characterState.varitaSintonia}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, varitaSintonia: e.target.value }))}
                      className="w-full text-xs font-sans"
                    />
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CASA Y LEMA */}
          {activeFormTab === "afiliacion" && (
            <div className="space-y-6 animate-fade-in" id="form-tabpanel-afiliacion">
              <div className="flex items-center gap-1.5 border-b border-violet-500/10 pb-3">
                <Award className={`w-5 h-5 ${houseIconColor}`} />
                <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                  {t.titleHouseHeraldry}
                </h3>
              </div>

              {/* House select & mottos */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    {t.casa}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="grid-house-select">
                    {Object.keys(HOUSES).map((hKey) => {
                      const hInfo = HOUSES[hKey];
                      const isChosen = characterState.casa.toUpperCase() === hKey;
                      return (
                        <button
                          id={`house-btn-${hKey}`}
                          key={hKey}
                          type="button"
                          onClick={() => handleHouseChange(hKey)}
                          className={`flex flex-col items-start p-4 bg-neutral-950/55 rounded-xl border text-left cursor-pointer transition-all ${
                            isChosen 
                              ? "border-amber-500/60 bg-violet-950/20 shadow-md ring-1 ring-amber-500/35" 
                              : "border-neutral-850 hover:border-neutral-750"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{HOUSE_ICONS[hKey] || "🏰"}</span>
                            <span className="font-sans font-bold text-xs text-neutral-100">{hInfo.nombre}</span>
                          </div>
                          <span className="text-[9.5px]/relaxed font-mono mt-2 text-neutral-300 w-full block">
                            <strong>Procedencia:</strong> {hInfo.procedencia}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400 block mt-1">
                            <strong>Colores:</strong> {hInfo.colores}
                          </span>
                          <span className="text-[9.5px]/relaxed font-serif text-amber-300/90 italic block mt-2 border-t border-neutral-800/70 pt-2 w-full">
                            Lema: “{hInfo.lema}”
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}



          {/* TAB 4: STRESS TRACKS */}
          {activeFormTab === "estres" && (
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
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresFisico} (Máximo)</h4>
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
                      onChange={(e) => setCharacterState(p => ({ ...p, estresFisicoMax: parseInt(e.target.value) || 5 }))}
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
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresMental} (Máximo)</h4>
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
                      onChange={(e) => setCharacterState(p => ({ ...p, estresMentalMax: parseInt(e.target.value) || 5 }))}
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
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresSocial} (Máximo)</h4>
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
                      onChange={(e) => setCharacterState(p => ({ ...p, estresSocialMax: parseInt(e.target.value) || 5 }))}
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
          )}

          {/* TAB 6: ACADEMIC SKILLS */}
          {activeFormTab === "habilidades" && (
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
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-extrabold border-b border-neutral-850 pb-1">
                      {category === "Físicas" ? "🛡️ " + (t.catFisicas || "Físicas") :
                       category === "Mentales" ? "🧠 " + (t.catMentales || "Mentales") :
                       category === "Sociales" ? "🗣️ " + (t.catSociales || "Sociales") :
                       category === "Asignaturas Troncales" ? "📐 " + (t.catTroncales || "Asignaturas Troncales") :
                       "🔮 " + (t.catOptativas || "Asignaturas Optativas")}
                    </h4>

                    {skillsInCategory.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {skillsInCategory.map((sk) => (
                          <div
                            key={sk.nombre}
                            className="flex items-center justify-between bg-neutral-900/40 border border-neutral-850 px-3 py-1.5 rounded-lg hover:border-violet-500/10 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(sk.nombre)}
                                className="text-neutral-500 hover:text-rose-450 p-0.5 transition-colors shrink-0 cursor-pointer"
                                title={t.removeSkill}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[11px] font-sans text-neutral-350 font-bold truncate pr-1" title={sk.nombre}>
                                {sk.nombre}
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
                        ))}
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
                          className="flex-1 text-[11px] font-sans py-1 px-2.5 bg-neutral-950 border border-neutral-850 text-neutral-200 rounded-lg placeholder-neutral-550 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
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
                          className="p-1 px-3 bg-violet-900/60 hover:bg-violet-850 border border-violet-650/30 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-95"
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
                <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-rose-450 text-[10.5px] font-mono animate-fade-in">
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
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-450 text-neutral-950 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
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
          )}

          {/* TAB 5: ASPECTS & BELONGINGS */}
          {activeFormTab === "aspectos" && (
            <div className="space-y-6 animate-fade-in" id="form-tabpanel-aspectos">
              <div className="flex items-center gap-1.5 border-b border-violet-500/10 pb-3">
                <Sparkles className={`w-5 h-5 ${houseIconColor}`} />
                <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                  {t.titleAspectsPossessions}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Column 1: Aspects & Complications */}
                <div className="space-y-6">
                  {/* Personal Aspects */}
                  <div className="p-4 bg-neutral-950/20 border border-violet-500/5 rounded-2xl">
                    <h4 className="text-xs font-magic text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-violet-900/10 pb-1.5 font-bold">
                      <span>🌟 {t.aspectosPersonales}</span>
                    </h4>
                    
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {characterState.aspectosPersonales && characterState.aspectosPersonales.length > 0 ? (
                        characterState.aspectosPersonales.map((asp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-neutral-900/40 border border-neutral-850 px-3 py-1.5 rounded-lg hover:border-violet-500/10 transition-colors"
                          >
                            <span className="text-[11px] text-neutral-200 italic font-serif">“ {asp} ”</span>
                            <button
                              type="button"
                              onClick={() => removeAspect(idx)}
                              className="text-neutral-500 hover:text-rose-450 p-1 rounded hover:bg-neutral-950 transition-colors cursor-pointer"
                              title={t.deleteAspect}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] font-mono text-neutral-500 italic py-4 text-center bg-neutral-950/10 border border-neutral-900/50 rounded-lg">
                          {t.emptyAspects}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 items-center bg-neutral-950/40 p-2 border border-violet-500/10 rounded-xl mt-3">
                      <input
                        type="text"
                        placeholder={t.placeholderAspectExample}
                        value={newAspectName}
                        onChange={(e) => setNewAspectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAspect();
                          }
                        }}
                        className="flex-1 text-[11px] font-sans bg-neutral-950 border border-neutral-850 focus:border-violet-500/55 rounded-lg px-2.5 py-1 text-neutral-200 focus:outline-none placeholder-neutral-600"
                      />
                      <button
                        type="button"
                        onClick={addAspect}
                        className="p-1 px-[10px] bg-violet-900/60 hover:bg-violet-850 text-white border border-violet-650/20 rounded-lg transition-all active:scale-95 cursor-pointer"
                        title={t.addAspect}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Complications */}
                  <div className="p-4 bg-neutral-950/20 border border-violet-500/5 rounded-2xl">
                    <h4 className="text-xs font-magic text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-violet-900/10 pb-1.5 font-bold">
                      <span>⚠️ {t.complicaciones}</span>
                    </h4>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {characterState.complicaciones && characterState.complicaciones.length > 0 ? (
                        characterState.complicaciones.map((comp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-neutral-900/40 border border-neutral-850 px-3 py-1.5 rounded-lg hover:border-violet-500/10 transition-colors"
                          >
                            <span className="text-[11px] text-rose-350 font-serif italic">“ {comp} ”</span>
                            <button
                              type="button"
                              onClick={() => removeComplication(idx)}
                              className="text-neutral-500 hover:text-rose-450 p-1 rounded hover:bg-neutral-950 transition-colors cursor-pointer"
                              title={t.deleteComplication}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] font-mono text-neutral-500 italic py-4 text-center bg-neutral-950/10 border border-neutral-900/50 rounded-lg">
                          {t.emptyComplications}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 items-center bg-neutral-950/40 p-2 border border-violet-500/10 rounded-xl mt-3">
                      <input
                        type="text"
                        placeholder={t.placeholderComplicaciones}
                        value={newComplicationName}
                        onChange={(e) => setNewComplicationName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addComplication();
                          }
                        }}
                        className="flex-1 text-[11px] font-sans bg-neutral-950 border border-neutral-850 focus:border-violet-500/55 rounded-lg px-2.5 py-1 text-neutral-200 focus:outline-none placeholder-neutral-600"
                      />
                      <button
                        type="button"
                        onClick={addComplication}
                        className="p-1 px-[10px] bg-violet-900/60 hover:bg-violet-850 text-white border border-violet-650/20 rounded-lg transition-all active:scale-95 cursor-pointer"
                        title={t.addComplication}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 2: Equipment / Posesiones */}
                <div className="p-4 bg-neutral-950/20 border border-violet-500/5 rounded-2xl">
                  <h4 className="text-xs font-magic text-amber-400 uppercase tracking-widest mb-3 flex items-center justify-between border-b border-violet-900/10 pb-1.5 font-bold">
                    <span>🎒 {t.equipo}</span>
                    <span className="text-[10px] font-mono text-neutral-500">{(characterState.equipoList || []).length}</span>
                  </h4>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {characterState.equipoList && characterState.equipoList.length > 0 ? (
                      characterState.equipoList.map((eq) => (
                        <div
                          key={eq.id}
                          className="flex items-center justify-between bg-neutral-900/40 px-3 py-1.5 border border-neutral-850 rounded-lg hover:border-violet-500/10 transition-all"
                        >
                          <div className="flex items-center gap-2 max-w-[80%] min-w-0">
                            <span className="text-[11px] text-neutral-200 font-mono truncate" title={eq.nombre}>{eq.nombre}</span>
                            <span className="bg-neutral-950/80 text-[10px] px-1.5 py-0.2 rounded text-amber-400 font-bold border border-neutral-800">
                              x{eq.cantidad}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEquipmentItem(eq.id)}
                            className="text-neutral-500 hover:text-rose-450 p-1 cursor-pointer transition-colors"
                            title={t.deleteItem}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-600 italic py-8 text-center bg-neutral-950/10 border border-neutral-900/50 rounded-lg">
                        {t.emptyInventory}
                      </p>
                    )}
                  </div>

                  {/* Add Inventory Item Input Form */}
                  <div className="bg-neutral-950/40 p-3 border border-violet-500/10 rounded-xl space-y-3 mt-3">
                    <input
                      type="text"
                      placeholder={t.placeholderEquipmentExample}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full text-[11px] font-sans bg-neutral-950 border border-neutral-850 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none placeholder-neutral-600"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addEquipmentItem();
                        }
                      }}
                    />
                    <div className="flex items-center justify-between gap-3">
                      {/* Quantity Input */}
                      <div className="flex items-center border border-neutral-850 bg-neutral-950 rounded-lg overflow-hidden h-8 shrink-0">
                        <button
                          type="button"
                          onClick={() => setNewItemQty(q => Math.max(1, q - 1))}
                          className="px-2 h-full text-neutral-400 hover:text-white hover:bg-neutral-900 cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-8 text-center bg-transparent text-[11px] text-neutral-200 focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setNewItemQty(q => q + 1)}
                          className="px-2 h-full text-neutral-400 hover:text-white hover:bg-neutral-900 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={addEquipmentItem}
                        className="flex items-center gap-1.5 px-3 py-1 bg-violet-900/60 hover:bg-violet-850 border border-violet-650/25 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer h-8"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t.add}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}




        </div>

      </div>

      {/* Primary bottom controller buttons */}
      <div className="mt-8 flex justify-end gap-3 border-t border-violet-500/10 pt-4">
        <button
          id="btn-form-bottom-cancel"
          type="button"
          onClick={handleCancelClick}
          className="px-5 py-2.5 border border-neutral-750 bg-neutral-950/70 hover:bg-neutral-900 rounded-xl text-xs sm:text-sm font-semibold transition-all text-neutral-350 font-mono cursor-pointer"
        >
          {t.cancel}
        </button>
        <button
          id="btn-form-bottom-save"
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-2 px-7 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-neutral-950 transition-all font-sans cursor-pointer shadow-lg hover:scale-[1.01] bg-amber-500 hover:bg-amber-400`}
        >
          <Save className="w-4 h-4" />
          {t.save}
        </button>
      </div>

      {/* Full cropped portrait modal display */}
      {isCropperOpen && cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in" id="crop-avatar-modal">
          <div className="bg-neutral-900 border border-violet-500/25 rounded-2xl w-full max-w-md p-6 flex flex-col space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h4 className="font-magic text-xs text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>📐</span> {t.cropHeader || "Crop Portrait"}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsCropperOpen(false);
                  setCropImageSrc(null);
                }}
                className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded hover:bg-neutral-800 max-w-max"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                <span>🔍 {t.cropZoom || "Zoom"}</span>
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
                {t.cropConfirm || "Apply Crop"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
