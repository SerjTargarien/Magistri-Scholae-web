/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Character, HOUSES, Spell, Potion, Skill } from "../types";
import { Language, TRANSLATIONS } from "../localization";
import { db } from "../db";
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
  Maximize2
} from "lucide-react";

interface CharacterDetailProps {
  lang: Language;
  character: Character;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (id: number) => void;
  onUpdateCharacter: (updated: Character) => void; // For immediate state updates
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({
  lang,
  character,
  onBack,
  onEdit,
  onDelete,
  onUpdateCharacter,
}) => {
  const t = TRANSLATIONS[lang];
  const hInfo = HOUSES[character.casa.toUpperCase()] || HOUSES.IRATI;

  // Tabs: perfil, sesion, habilidades, hechizos, notas, galeria
  const [activeTab, setActiveTab] = useState<"perfil" | "sesion" | "habilidades" | "hechizos" | "notas" | "galeria">("perfil");

  // Local/Temporary form states for spells & potions
  const [newSpellName, setNewSpellName] = useState("");
  const [newSpellVal, setNewSpellVal] = useState(1);
  const [newSpellSpec, setNewSpellSpec] = useState(false);

  const [newPotionName, setNewPotionName] = useState("");
  const [newPotionVal, setNewPotionVal] = useState(1);
  const [newPotionSpec, setNewPotionSpec] = useState(false);

  // Gallery view states
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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

  const handleAspectTemporalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clone = { ...character, aspectoTemporal: e.target.value };
    saveStateToDB(clone);
  };

  const handleConsecuenciaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clone = { ...character, estresMentalConsecuencia: e.target.value };
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
    if (!window.confirm(t.confirmDeleteSpell)) return;
    const clone = {
      ...character,
      conjuros: (character.conjuros || []).filter(sp => sp.id !== id)
    };
    saveStateToDB(clone);
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
    if (!window.confirm(t.confirmDeletePotion)) return;
    const clone = {
      ...character,
      pociones: (character.pociones || []).filter(po => po.id !== id)
    };
    saveStateToDB(clone);
  };

  // 5. Notes Chronicle update
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const clone = { ...character, notas: e.target.value };
    saveStateToDB(clone);
  };

  // 6. Gallery base64 attachment
  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(t.imageTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      const clone = {
        ...character,
        galleryImages: [...(character.galleryImages || []), base64Str]
      };
      saveStateToDB(clone);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // refresh list
  };

  const removeGalleryImage = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering click expansion
    if (!window.confirm(t.confirmDeleteGalleryImage)) return;
    const clone = {
      ...character,
      galleryImages: (character.galleryImages || []).filter((_, i) => i !== idx)
    };
    saveStateToDB(clone);
  };

  // Destructive character purge with strong check
  const handleDeleteCharacterClick = () => {
    const doubleCheck = window.confirm(`${t.confirmDelete}\n\n${t.confirmDeleteText}`);
    if (doubleCheck && character.id) {
      onDelete(character.id);
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
      
      {/* Top Navigation & Action Bar - Highly Visible with 44px+ touch targets */}
      <div className="flex flex-row justify-between items-center mb-6 bg-white/5 border border-white/10 p-3 rounded-xl gap-2 z-20 relative shadow-sm" id="detail-top-nav-bar">
        <button
          id="btn-detail-back"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-neutral-100 bg-neutral-900 border border-neutral-700 rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[44px] transition-all cursor-pointer select-none shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{t.back}</span>
        </button>

        <div className="flex gap-2">
          {/* Edit Button */}
          <button
            id="btn-detail-edit"
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[44px] transition-all cursor-pointer select-none"
          >
            <Edit className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{t.edit}</span>
          </button>

          {/* Delete Button */}
          <button
            id="btn-detail-delete"
            onClick={handleDeleteCharacterClick}
            className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-350 bg-rose-950/70 border border-rose-500/30 hover:bg-rose-900 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 min-h-[44px] transition-all cursor-pointer select-none"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{t.delete}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Profile Cover Banner */}
      <div className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-r ${hInfo.bgClass} border border-violet-500/15 p-6 mb-6 flex flex-col md:flex-row gap-6 items-center shadow-lg shadow-neutral-950/40`}>
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Left Aspect - Avatar */}
        <div className="shrink-0">
          <div className="w-28 h-36 bg-neutral-950 rounded-xl border border-violet-500/30 overflow-hidden shadow-md flex items-center justify-center relative">
            {character.avatarImage ? (
              <img
                src={character.avatarImage}
                alt={character.nombre}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center text-[10px] font-mono text-neutral-600 uppercase select-none p-2">
                <User className="w-8 h-8 opacity-40 mx-auto mb-1 text-violet-400" />
                No pic
              </div>
            )}
            <div className={`absolute bottom-0 inset-x-0 text-center text-[8px] font-mono uppercase bg-neutral-900/95 py-0.5 border-t ${hInfo.borderClass} text-neutral-400 font-bold`}>
              {hInfo.nombre}
            </div>
          </div>
        </div>

        {/* Center Aspect - Name, House & Concept Info */}
        <div className="flex-1 text-center md:text-left self-center">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="font-magic text-xl md:text-2xl font-bold text-neutral-100 uppercase tracking-widest glow-amber">
              {character.nombre || t.noName}
            </h1>
            <span className={`text-[10px] font-mono tracking-wider bg-neutral-950/80 px-2 py-0.5 rounded border ${hInfo.borderClass} self-center mt-1 md:mt-0 font-extrabold ${hInfo.textClass}`}>
              {hInfo.nombre} • {character.curso}
            </span>
          </div>

          <p className="text-xs text-neutral-400 mt-2 font-mono italic max-w-xl">
            {character.concepto ? `“${character.concepto}”` : `— ${t.noConceptDefined} —`}
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 font-serif italic text-amber-200 text-xs">
            {character.lema && (
              <span>« {character.lema} »</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Menu Ribbon */}
      <div className="flex overflow-x-auto pb-2 border-b border-violet-500/10 mb-6 gap-2 snap-x" id="detail-tabs-menu">
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
              className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-all shrink-0 snap-start cursor-pointer select-none ${
                IsActive
                  ? "bg-violet-950/70 border-amber-500/50 text-amber-300"
                  : "bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4 text-violet-400" />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Primary Tabs Board */}
      <div className="min-h-[400px]" id="detail-active-tab-box">
        
        {/* TAF 1: PERFIL */}
        {activeTab === "perfil" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="detail-tab-perfil">
            
{/* Bio Column */}
<div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-4">
  <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2 flex items-center gap-2">
    <User className="w-4 h-4 text-violet-400" />
    {t.secDatosAlumno}
  </h3>

  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
    <div>
      <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.jugador}</div>
      <div className="text-neutral-200 mt-0.5">{character.jugador || "—"}</div>
    </div>

    <div>
      <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.edad}</div>
      <div className="text-neutral-200 mt-0.5">{character.edad || "11 años"}</div>
    </div>

    <div>
      <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.curso}</div>
      <div className="text-neutral-200 mt-0.5">{character.curso || "1º"}</div>
    </div>

    <div>
      <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.puestoClase}</div>
      <div className="text-neutral-200 mt-0.5">{character.puestoClase || "—"}</div>
    </div>

    <div>
      <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.linaje}</div>
      <div className="text-neutral-200 mt-0.5">{character.linaje || "Mítico"}</div>
    </div>

    <div>
      <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.economia}</div>
      <div className="text-neutral-200 mt-0.5">{character.economia || "Normal"}</div>
    </div>
  </div>

  {/* Familiar & Varita */}
  <div className="border-t border-violet-500/10 pt-3">
    <div className="grid grid-cols-1 gap-3 text-xs font-mono">
      <div>
        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">
          {t.familiar}
        </div>
        <div className="text-neutral-200 mt-0.5">
          {character.familiar || t.labelFamiliarEmpty}
        </div>
      </div>

      <div>
        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">
          {t.varitaSintonia}
        </div>
        <div className="text-neutral-200 mt-0.5">
          {character.varitaSintonia || t.labelVaritaEmpty}
        </div>
      </div>
    </div>
  </div>
</div>

            {/* Complications & Aspects Column */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-5">
              
{/* Personal Aspects */}
<div>
  <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-3">
    🌟 {t.aspectosPersonales}
  </h3>

  {(() => {
    const aspectList = Array.isArray(character.aspectosPersonales)
      ? character.aspectosPersonales
      : character.aspectosPersonales
        ? [character.aspectosPersonales]
        : [];

    return aspectList.length > 0 ? (
      <div className="grid grid-cols-1 gap-2">
        {aspectList.map((aspect, idx) => (
          <div
            key={idx}
            className="p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300"
          >
            “ {aspect} ”
          </div>
        ))}
      </div>
    ) : (
      <span className="text-[10px] font-mono text-neutral-500 italic block text-center py-4 bg-neutral-950/10 border border-neutral-900 rounded-lg">
        {t.labelAspectsEmpty}
      </span>
    );
  })()}
</div>

{/* Complications */}
<div>
  <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-3">
    ⚠️ {t.complicaciones}
  </h3>

  {(() => {
    const compList = Array.isArray(character.complicaciones)
      ? character.complicaciones
      : character.complicaciones
        ? [character.complicaciones]
        : [];

    return compList.length > 0 ? (
      <div className="grid grid-cols-1 gap-2">
        {compList.map((comp, idx) => (
          <div
            key={idx}
            className="p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-red-300"
          >
            “ {comp} ”
          </div>
        ))}
      </div>
    ) : (
      <span className="text-[10px] font-mono text-neutral-500 italic block text-center py-4 bg-neutral-950/10 border border-neutral-900 rounded-lg">
        {t.labelComplicacionesEmpty}
      </span>
    );
  })()}
</div>

              {/* Custom fields display */}
              {character.camposPersonalizados && character.camposPersonalizados.length > 0 && (
                <div>
                  <h3 className="font-magic text-xs text-indigo-400 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-3">
                    🔮 {t.customFields}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {character.camposPersonalizados.map((fd, idx) => (
                      <div key={idx} className="p-2.5 bg-neutral-950/50 border border-neutral-800 rounded-lg text-xs flex justify-between">
                        <span className="font-mono text-[10px] text-amber-500 uppercase tracking-wider">{fd.nombre}:</span>
                        <span className="text-neutral-200 text-right">{fd.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: SESIÓN (Tracker mode) */}
        {activeTab === "sesion" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="detail-tab-sesion">
            
            {/* Core Stats Adjustments */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6">
              <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2 flex items-center gap-2">
                <Coins className="w-4 h-4 text-violet-400" />
                {lang === "es" ? "Recursos y Destino" : "Counters & Destiny"}
              </h3>

              {/* Destiny points control */}
              <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{t.puntosDestino}</span>
                  <span className="text-[10px] text-neutral-500 font-sans block">{lang === "es" ? "Puntos de destino" : "Destiny pool action tracking"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-dest-minus"
                    onClick={() => changeStat("puntosDestino", -1)}
                    className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-amber-400 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-lg font-mono font-bold text-amber-500">{character.puntosDestino}</span>
                  <button
                    id="btn-dest-plus"
                    onClick={() => changeStat("puntosDestino", 1)}
                    className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-amber-400 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Experience control */}
              <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{t.pxs}</span>
                  <span className="text-[10px] text-neutral-500 font-sans block">{lang === "es" ? "Experiencia" : "Character score scale"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-exp-minus"
                    onClick={() => changeStat("pxs", -1)}
                    className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-violet-400 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-lg font-mono font-bold text-violet-455">{character.pxs}</span>
                  <button
                    id="btn-exp-plus"
                    onClick={() => changeStat("pxs", 1)}
                    className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-violet-400 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Edit Temporary Aspect */}
              <div className="bg-neutral-950/30 p-4 border border-violet-900/15 rounded-xl space-y-2">
                <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">{t.aspectoTemporal}</label>
                <input
                  id="session-aspect-temporal"
                  type="text"
                  placeholder={t.placeholderAspectoTemporal}
                  value={character.aspectoTemporal || ""}
                  onChange={handleAspectTemporalChange}
                  className="w-full text-xs font-serif italic"
                />
              </div>
            </div>

            {/* Stress track Controls - Physical & Social */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-5">
              <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                💪 {t.estresFisico} & {t.estresSocial}
              </h3>

              {/* Physical track box */}
              <div className="p-4 bg-neutral-950/40 rounded-xl border border-violet-900/10 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-neutral-300">{t.estresFisico}</span>
                  <span className="text-amber-500">{character.estresFisico}/{character.estresFisicoMax}</span>
                </div>
                {/* Visual grid checkboxes */}
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: character.estresFisicoMax }).map((_, idx) => {
                    const count = idx + 1;
                    const isChecked = character.estresFisico >= count;
                    return (
                      <button
                        id={`stress-phys-box-${count}`}
                        key={idx}
                        onClick={() => {
                          const clone = { ...character, estresFisico: isChecked ? count - 1 : count };
                          saveStateToDB(clone);
                        }}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${
                          isChecked 
                            ? "bg-rose-950/80 border-rose-500 text-rose-350 shadow-inner" 
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

              {/* Social track box */}
              <div className="p-4 bg-neutral-950/40 rounded-xl border border-violet-900/10 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-neutral-300">{t.estresSocial}</span>
                  <span className="text-amber-550">{character.estresSocial}/{character.estresSocialMax}</span>
                </div>
                {/* Visual grid checkboxes */}
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: character.estresSocialMax }).map((_, idx) => {
                    const count = idx + 1;
                    const isChecked = character.estresSocial >= count;
                    return (
                      <button
                        id={`stress-soc-box-${count}`}
                        key={idx}
                        onClick={() => {
                          const clone = { ...character, estresSocial: isChecked ? count - 1 : count };
                          saveStateToDB(clone);
                        }}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${
                          isChecked 
                            ? "bg-indigo-950/80 border-indigo-550 text-indigo-350 shadow-inner" 
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
            </div>

            {/* Stress track control - Mental */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-4">
              <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                🧠 {t.estresMental}
              </h3>

              <div className="p-4 bg-neutral-950/40 rounded-xl border border-violet-900/10 space-y-4">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-neutral-300">{t.estresMental}</span>
                  <span className="text-amber-500">{character.estresMental}/{character.estresMentalMax}</span>
                </div>
                
                {/* Visual grid checkboxes */}
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: character.estresMentalMax }).map((_, idx) => {
                    const count = idx + 1;
                    const isChecked = character.estresMental >= count;
                    return (
                      <button
                        id={`stress-mental-box-${count}`}
                        key={idx}
                        onClick={() => {
                          const clone = { ...character, estresMental: isChecked ? count - 1 : count };
                          saveStateToDB(clone);
                        }}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${
                          isChecked 
                            ? "bg-violet-950/80 border-violet-500 text-violet-350 shadow-inner" 
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

              {/* Mental Consequence */}
              <div className="bg-neutral-950/30 p-4 border border-violet-900/10 rounded-xl space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">
                  {t.estresMentalConsecuencia}
                </label>
                <input
                  id="session-mental-consequence"
                  type="text"
                  placeholder={t.placeholderConsecuenciaMental}
                  value={character.estresMentalConsecuencia || ""}
                  onChange={handleConsecuenciaChange}
                  className="w-full text-xs"
                />
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: HABILIDADES (Skills tracker) */}
        {activeTab === "habilidades" && (
          <div className="space-y-6 animate-fade-in" id="detail-tab-habilidades">
            {/* Split Skills by structural headings */}
            {["Físicas", "Mentales", "Sociales", "Asignaturas Troncales", "Asignaturas Optativas"].map((catKey) => {
              const matchedSkills = character.habilidades.filter(sk => sk.categoria === catKey);
              if (matchedSkills.length === 0) return null;

              return (
                <div key={catKey} className="glass-panel p-6 rounded-xl border border-violet-500/15" id={`skill-block-${catKey}`}>
                  <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2 mb-4">
                    🛡️ {getCategoryTitle(catKey)}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {character.habilidades.map((sk, index) => {
                      if (sk.categoria !== catKey) return null;
                      return (
                        <div 
                          id={`skill-row-${sk.nombre}`}
                          key={sk.nombre}
                          className="bg-neutral-950/30 border border-neutral-900 px-3 py-2.5 rounded-xl flex items-center justify-between shadow-inner"
                        >
                          <div className="max-w-[130px] sm:max-w-[180px]">
                            <span className="text-xs font-semibold text-neutral-200 block truncate">{sk.nombre}</span>
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

                          <div className="flex items-center gap-2">
                            {/* Decrement Key */}
                            <button
                              id={`btn-skill-${sk.nombre}-minus`}
                              onClick={() => changeSkillValue(index, -1)}
                              disabled={sk.valor === 0}
                              className={`w-6 h-6 rounded-md flex items-center justify-center border font-mono font-black text-xs transition-colors cursor-pointer ${
                                sk.valor === 0 
                                  ? "bg-neutral-900 border-neutral-950 text-neutral-700 cursor-not-allowed" 
                                  : "bg-neutral-900 hover:bg-neutral-850 border-neutral-700 text-neutral-400 hover:text-rose-450"
                              }`}
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-mono font-bold text-amber-300 text-sm">
                              +{sk.valor}
                            </span>
                            {/* Increment key */}
                            <button
                              id={`btn-skill-${sk.nombre}-plus`}
                              onClick={() => changeSkillValue(index, 1)}
                              disabled={sk.valor === 5}
                              className={`w-6 h-6 rounded-md flex items-center justify-center border font-mono font-black text-xs transition-colors cursor-pointer ${
                                sk.valor === 5 
                                  ? "bg-neutral-900 border-neutral-950 text-neutral-700 cursor-not-allowed" 
                                  : "bg-neutral-900 hover:bg-neutral-850 border-neutral-700 text-neutral-400 hover:text-emerald-450"
                              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                ⚡ {lang === "es" ? "Grimorio de Conjuros" : "Grimoire of Spells"}
              </h3>

              {/* Add form */}
              <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
                <h4 className="text-[10px] font-mono text-neutral-400 uppercase font-black tracking-wide">
                  {t.addSpell}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    id="input-spell-name"
                    type="text"
                    placeholder={t.placeholderConjuroName}
                    value={newSpellName}
                    onChange={(e) => setNewSpellName(e.target.value)}
                    className="text-xs"
                  />
                  <select
                    id="select-spell-val"
                    value={newSpellVal}
                    onChange={(e) => setNewSpellVal(parseInt(e.target.value) || 1)}
                    className="text-xs bg-neutral-900"
                  >
                    <option value="1">{t.level} I</option>
                    <option value="2">{t.level} II</option>
                    <option value="3">{t.level} III</option>
                    <option value="4">{t.level} IV</option>
                    <option value="5">{t.level} V</option>
                  </select>
                  <label className="flex items-center gap-2 hover:text-neutral-200 text-xs text-neutral-400 ml-1 select-none">
                    <input
                      id="checkbox-spell-spec"
                      type="checkbox"
                      checked={newSpellSpec}
                      onChange={(e) => setNewSpellSpec(e.target.checked)}
                      className="rounded text-violet-600 bg-neutral-900"
                    />
                    {t.specialized}?
                  </label>
                </div>
                <button
                  id="btn-add-spell"
                  onClick={addSpell}
                  className="w-full py-1.5 bg-violet-900 hover:bg-violet-850 border border-violet-600 text-violet-100 rounded-lg text-xs font-bold font-mono transition-all"
                >
                  {lang === "es" ? "Registrar" : "Register"}
                </button>
              </div>

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
                            {t.labelGrado} {sp.valor}
                          </span>
                          {sp.specialized && (
                            <span className="text-[9px] font-mono uppercase bg-violet-950 text-violet-300 font-bold px-1 py-0.5 rounded border border-violet-500/10">
                              {t.specialized}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        id={`btn-del-spell-${sp.id}`}
                        onClick={() => removeSpell(sp.id)}
                        className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-mono text-neutral-600 text-center select-none py-6">
                    {t.labelSpellsEmpty}
                  </p>
                )}
              </div>
            </div>

            {/* Potions Panel */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6">
              <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                🧪 {lang === "es" ? "Catálogo de Pociones" : "Laboratory Potions"}
              </h3>

              {/* Add form */}
              <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
                <h4 className="text-[10px] font-mono text-neutral-400 uppercase font-black tracking-wide">
                  {t.addPotion}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    id="input-potion-name"
                    type="text"
                    placeholder={t.placeholderPocionName}
                    value={newPotionName}
                    onChange={(e) => setNewPotionName(e.target.value)}
                    className="text-xs"
                  />
                  <select
                    id="select-potion-val"
                    value={newPotionVal}
                    onChange={(e) => setNewPotionVal(parseInt(e.target.value) || 1)}
                    className="text-xs bg-neutral-900"
                  >
                    <option value="1">{t.level} I</option>
                    <option value="2">{t.level} II</option>
                    <option value="3">{t.level} III</option>
                    <option value="4">{t.level} IV</option>
                    <option value="5">{t.level} V</option>
                  </select>
                  <label className="flex items-center gap-2 hover:text-neutral-200 text-xs text-neutral-400 ml-1 select-none">
                    <input
                      id="checkbox-potion-spec"
                      type="checkbox"
                      checked={newPotionSpec}
                      onChange={(e) => setNewPotionSpec(e.target.checked)}
                      className="rounded text-violet-600 bg-neutral-900"
                    />
                    {t.specialized}?
                  </label>
                </div>
                <button
                  id="btn-add-potion"
                  onClick={addPotion}
                  className="w-full py-1.5 bg-violet-900 hover:bg-violet-850 border border-violet-600 text-violet-100 rounded-lg text-xs font-bold font-mono transition-all"
                >
                  {lang === "es" ? "Registrar" : "Register"}
                </button>
              </div>

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
                            {t.labelGrado} {po.valor}
                          </span>
                          {po.specialized && (
                            <span className="text-[9px] font-mono uppercase bg-violet-950 text-violet-300 font-bold px-1 py-0.5 rounded border border-violet-500/10">
                              {t.specialized}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        id={`btn-del-potion-${po.id}`}
                        onClick={() => removePotion(po.id)}
                        className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-mono text-neutral-600 text-center select-none py-6">
                    {t.labelPotionsEmpty}
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: NOTAS & CHRONICLES */}
        {activeTab === "notas" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="detail-tab-notas">
            {/* Left side: Clubs & Inventory */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-5">
              
              {/* Clubes */}
              <div className="space-y-2">
                <h4 className="font-magic text-[10px] text-amber-400 uppercase tracking-widest border-b border-violet-900/10 pb-1.5 font-bold">
                  🛡️ {t.clubes}
                </h4>
                <textarea
                  id="notes-clubes"
                  rows={3}
                  placeholder={t.placeholderClubes}
                  value={character.clubes || ""}
                  onChange={(e) => {
                    const clone = { ...character, clubes: e.target.value };
                    saveStateToDB(clone);
                  }}
                  className="w-full text-xs font-sans leading-relaxed"
                />
              </div>

              {/* Equipo / Grimorio */}
              <div className="space-y-2">
                <h4 className="font-magic text-[10px] text-amber-400 uppercase tracking-widest border-b border-violet-900/10 pb-1.5 font-bold">
                  🎒 {t.equipo}
                </h4>
                <textarea
                  id="notes-equipo"
                  rows={6}
                  placeholder={t.placeholderEquipo}
                  value={character.equipo || ""}
                  onChange={(e) => {
                    const clone = { ...character, equipo: e.target.value };
                    saveStateToDB(clone);
                  }}
                  className="w-full text-xs font-mono leading-relaxed"
                />
              </div>

            </div>

            {/* Right side: General Auto-saving Diary */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2 flex flex-col h-full space-y-3">
              <div className="flex justify-between items-center border-b border-violet-950/10 pb-2">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest">
                  🖋️ {t.notas}
                </h3>
                <span className="text-[9px] font-mono text-neutral-500 select-none animate-pulse">
                  {t.labelOfflineAutoSave}
                </span>
              </div>
              
              <div className="flex-1">
                <textarea
                  id="notes-diary-editor"
                  rows={16}
                  placeholder={t.placeholderNotasChronicle}
                  value={character.notas || ""}
                  onChange={handleNotesChange}
                  className="w-full h-full min-h-[300px] text-sm leading-relaxed font-sans bg-transparent/20 border-violet-500/5 focus:border-violet-500/20"
                />
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: GALERÍA DE FOTOS (Base64 list) */}
        {activeTab === "galeria" && (
          <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6 animate-fade-in" id="detail-tab-galeria">
            
            {/* Top Info with file picker */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-violet-550/10 pb-3">
              <div>
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-violet-400" />
                  {t.galeria}
                </h3>
                <p className="text-[10px] text-neutral-400 mt-1 font-mono">{t.galleryInstructions}</p>
              </div>

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
            </div>

            {/* Gallery images GRID */}
            {character.galleryImages && character.galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" id="gallery-pics-view">
                {character.galleryImages.map((pic, idx) => (
                  <div
                    id={`gallery-item-${idx}`}
                    key={idx}
                    onClick={() => setLightboxImage(pic)}
                    className="group relative h-36 bg-neutral-950 border border-violet-500/10 rounded-xl overflow-hidden cursor-pointer shadow hover:border-amber-500/40 hover:-translate-y-0.5 transition-all"
                  >
                    <img
                      src={pic}
                      alt={`Relato ${idx}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Delete action indicator hover */}
                    <button
                      id={`btn-del-gal-pic-${idx}`}
                      onClick={(e) => removeGalleryImage(idx, e)}
                      className="absolute top-2 right-2 bg-rose-950/90 border border-rose-500/30 p-1.5 rounded-lg text-rose-350 hover:text-rose-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                      title="Delet picture"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>

                    <div className="absolute bottom-2 left-2 bg-neutral-900/80 px-1.5 py-0.5 text-[8px] font-mono rounded text-neutral-400">
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
    </div>
  );
};
