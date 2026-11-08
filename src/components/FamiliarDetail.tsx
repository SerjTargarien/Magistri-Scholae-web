/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Familiar, Character, VisualStyle, JournalNote } from "../types";
import { Language, TRANSLATIONS } from "../localization";
import { storage } from "../storage";
import { referencesCharacter } from "../storage/backup";
import { FiligreeCorner, CompassStarDivider } from "./AcademyOrnaments";
import { HouseCrest } from "./HouseCrest";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/imageCompressor";
import {
  ArrowLeft,
  Edit,
  Trash2,
  PawPrint,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash,
  X,
  Maximize2,
  Check,
  Upload,
  User,
  Sparkles,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
} from "lucide-react";

interface FamiliarDetailProps {
  lang: Language;
  visualStyle?: VisualStyle;
  familiar: Familiar;
  characters: Character[];
  onBack: () => void;
  onEditInEditor: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateFamiliar: (updated: Familiar) => void;
  onSelectCharacter: (charId: number) => void;
  onBondMaster: (familiarId: string, charId: number | null) => void;
  onShowToast?: (type: "success" | "error", text: string) => void;
}

export const FamiliarDetail: React.FC<FamiliarDetailProps> = ({
  lang,
  visualStyle = "academy",
  familiar,
  characters,
  onBack,
  onEditInEditor,
  onDelete,
  onUpdateFamiliar,
  onSelectCharacter,
  onBondMaster,
  onShowToast,
}) => {
  const t = TRANSLATIONS[lang];
  const isAcademy = visualStyle === "academy";

  // Tabs: perfil, notas, galeria
  const [activeTab, setActiveTab] = useState<"perfil" | "notas" | "galeria">("perfil");

  // Quick edit mode
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [editNombre, setEditNombre] = useState(familiar.nombre);
  const [editEspecie, setEditEspecie] = useState(familiar.especie);
  const [editDescripcion, setEditDescripcion] = useState(familiar.descripcion || "");
  const [editImageFit, setEditImageFit] = useState<"cover" | "contain">(familiar.imageFit || "cover");

  // Notes state
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteContent, setEditingNoteContent] = useState("");

  // Gallery state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [pastedUrl, setPastedUrl] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Avatar cropping state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSelectMasterOpen, setIsSelectMasterOpen] = useState(false);

  // Find linked character
  const linkedMaster = familiar.studentId
    ? characters.find((c) => referencesCharacter(familiar.studentId, c.id!))
    : undefined;

  // Auto-save helper
  const saveFamiliarToDB = async (updated: Familiar) => {
    try {
      updated.updatedAt = Date.now();
      const saved = await storage.familiars.save(updated);
      onUpdateFamiliar(saved);
    } catch (err) {
      console.error("Failed to save familiar to IndexedDB:", err);
    }
  };

  const handleSaveQuickEdit = async () => {
    const updated: Familiar = {
      ...familiar,
      nombre: editNombre.trim() || familiar.nombre,
      especie: editEspecie.trim() || familiar.especie,
      descripcion: editDescripcion.trim(),
      imageFit: editImageFit,
    };
    await saveFamiliarToDB(updated);
    setIsQuickEditing(false);
    if (onShowToast) {
      onShowToast("success", t.familiarSavedInlineToast);
    }
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
      e.target.value = "";
    }
  };

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const updated: Familiar = {
        ...familiar,
        imagen: croppedBase64,
      };
      await saveFamiliarToDB(updated);
      setIsCropperOpen(false);
      setCropImageSrc(null);
    } catch (err) {
      console.error("Cropping error:", err);
    }
  };

  // Notes management
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;

    const newNote: JournalNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      titulo: newNoteTitle.trim() || t.noName,
      contenido: newNoteContent.trim(),
      fecha: Date.now(),
    };

    const currentNotes = familiar.notasList || [];
    const updated: Familiar = {
      ...familiar,
      notasList: [newNote, ...currentNotes],
    };
    await saveFamiliarToDB(updated);
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const handleSaveEditedNote = async (noteId: string) => {
    const currentNotes = familiar.notasList || [];
    const updatedNotes = currentNotes.map((n) =>
      n.id === noteId
        ? { ...n, titulo: editingNoteTitle.trim() || n.titulo, contenido: editingNoteContent.trim() }
        : n
    );
    const updated: Familiar = { ...familiar, notasList: updatedNotes };
    await saveFamiliarToDB(updated);
    setEditingNoteId(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    const currentNotes = familiar.notasList || [];
    const updated: Familiar = {
      ...familiar,
      notasList: currentNotes.filter((n) => n.id !== noteId),
    };
    await saveFamiliarToDB(updated);
  };

  // Gallery management
  const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryError(null);

    if (file.size > 2.5 * 1024 * 1024) {
      setGalleryError(t.imageTooLarge);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const currentGallery = familiar.galleryImages || [];
        const updated: Familiar = {
          ...familiar,
          galleryImages: [...currentGallery, base64],
        };
        await saveFamiliarToDB(updated);
      };
      reader.readAsDataURL(file);
    } catch {
      setGalleryError(t.imageUploadError);
    } finally {
      e.target.value = "";
    }
  };

  const handleAddUrlImage = async () => {
    if (!pastedUrl.trim()) return;
    setGalleryError(null);
    const currentGallery = familiar.galleryImages || [];
    const updated: Familiar = {
      ...familiar,
      galleryImages: [...currentGallery, pastedUrl.trim()],
    };
    await saveFamiliarToDB(updated);
    setPastedUrl("");
  };

  const handleDeleteGalleryImage = async (idx: number) => {
    const currentGallery = familiar.galleryImages || [];
    const updated: Familiar = {
      ...familiar,
      galleryImages: currentGallery.filter((_, i) => i !== idx),
    };
    await saveFamiliarToDB(updated);
  };

  return (
    <div
      className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 font-sans select-none animate-fade-in"
      id="familiar-detail-container"
    >
      {/* Top Banner Navigation & Actions */}
      <div
        className={`p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/85 to-[#120924] ${
          isAcademy ? "border border-amber-500/30" : "border border-emerald-500/25"
        } mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-2xl`}
      >
        {isAcademy && (
          <>
            <FiligreeCorner position="tl" className="w-6 h-6 text-amber-500/40" />
            <FiligreeCorner position="tr" className="w-6 h-6 text-amber-500/40" />
            <FiligreeCorner position="bl" className="w-6 h-6 text-amber-500/40" />
            <FiligreeCorner position="br" className="w-6 h-6 text-amber-500/40" />
          </>
        )}

        <div className="z-10 flex items-center gap-3">
          <button
            type="button"
            id="btn-familiar-back"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-700/60 transition-colors flex items-center gap-1.5 text-xs font-mono uppercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.familiarBackToList}</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
                <PawPrint className="w-3.5 h-3.5" />
                {familiar.especie || t.familiarSpeciesShort}
              </span>
              <span className="text-neutral-500">·</span>
              <span className="text-xs font-mono text-neutral-400">
                {linkedMaster ? linkedMaster.nombre : t.familiarUnbound}
              </span>
            </div>
            <h1 className="font-magic text-2xl sm:text-3xl font-bold text-neutral-100 uppercase tracking-wider glow-amber truncate max-w-md">
              {familiar.nombre || t.noName}
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="z-10 flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Quick Edit Toggle */}
          <button
            type="button"
            id="btn-familiar-quick-edit"
            onClick={() => {
              if (isQuickEditing) {
                handleSaveQuickEdit();
              } else {
                setEditNombre(familiar.nombre);
                setEditEspecie(familiar.especie);
                setEditDescripcion(familiar.descripcion || "");
                setEditImageFit(familiar.imageFit || "cover");
                setIsQuickEditing(true);
              }
            }}
            className={`px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
              isQuickEditing
                ? "bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 border-neutral-700/60"
            }`}
          >
            {isQuickEditing ? <Check className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
            <span>{isQuickEditing ? t.save : t.familiarQuickEdit}</span>
          </button>

          {/* Full Editor */}
          <button
            type="button"
            id="btn-familiar-full-editor"
            onClick={() => onEditInEditor(familiar.id)}
            className="px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">{t.familiarEditInEditor}</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            id="btn-familiar-delete"
            onClick={() => setIsDeleteOpen(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-800 transition-colors cursor-pointer"
            title={t.delete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Modular tabs inherited from archetype registry) */}
      <div className="flex items-center gap-2 border-b border-neutral-800/80 mb-6 overflow-x-auto pb-1">
        <button
          id="familiar-tab-perfil"
          type="button"
          onClick={() => setActiveTab("perfil")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === "perfil"
              ? "border-emerald-400 text-emerald-300 bg-emerald-950/20 font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
          }`}
        >
          <PawPrint className="w-4 h-4 text-emerald-400" />
          {t.tabFamiliarProfile}
        </button>

        <button
          id="familiar-tab-notas"
          type="button"
          onClick={() => setActiveTab("notas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === "notas"
              ? "border-emerald-400 text-emerald-300 bg-emerald-950/20 font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          {t.tabFamiliarNotes}
          {(familiar.notasList?.length || 0) > 0 && (
            <span className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-300">
              {familiar.notasList?.length}
            </span>
          )}
        </button>

        <button
          id="familiar-tab-galeria"
          type="button"
          onClick={() => setActiveTab("galeria")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === "galeria"
              ? "border-emerald-400 text-emerald-300 bg-emerald-950/20 font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
          }`}
        >
          <ImageIcon className="w-4 h-4 text-violet-400" />
          {t.tabFamiliarGallery}
          {(familiar.galleryImages?.length || 0) > 0 && (
            <span className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-300">
              {familiar.galleryImages?.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Perfil y Vínculo Mágico */}
      {activeTab === "perfil" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left Column: Portrait Card (4 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div
              className={`glass-panel p-4 sm:p-6 rounded-2xl ${
                isAcademy ? "border border-amber-500/25" : "border border-emerald-500/20"
              } relative overflow-hidden shadow-xl`}
            >
              {isAcademy && (
                <>
                  <FiligreeCorner position="tl" className="w-6 h-6 text-amber-500/30" />
                  <FiligreeCorner position="tr" className="w-6 h-6 text-amber-500/30" />
                  <FiligreeCorner position="bl" className="w-6 h-6 text-amber-500/30" />
                  <FiligreeCorner position="br" className="w-6 h-6 text-amber-500/30" />
                </>
              )}

              {/* Portrait container */}
              <div className="relative aspect-[3/4] w-full bg-neutral-950 rounded-xl overflow-hidden border-2 border-emerald-500/30 shadow-inner flex items-center justify-center group">
                {familiar.imagen ? (
                  <img
                    src={familiar.imagen}
                    alt={familiar.nombre}
                    className={`w-full h-full ${
                      familiar.imageFit === "contain" ? "object-contain bg-[#0e0917]" : "object-cover"
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-400">
                    <PawPrint className="w-16 h-16 text-emerald-400/60 mb-3" />
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                      {familiar.especie || t.familiarSpeciesShort}
                    </span>
                  </div>
                )}

                {/* Quick edit overlay for avatar */}
                {isQuickEditing && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono uppercase cursor-pointer flex items-center gap-1.5 shadow-lg">
                      <Upload className="w-4 h-4" />
                      <span>{t.btnChangePhoto}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={avatarInputRef}
                        onChange={handleAvatarChange}
                      />
                    </label>

                    <div className="flex items-center gap-1 bg-neutral-900/90 border border-neutral-700 p-1 rounded-lg text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setEditImageFit("cover")}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          editImageFit === "cover" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400"
                        }`}
                      >
                        {t.optAvatarCover}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditImageFit("contain")}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          editImageFit === "contain" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400"
                        }`}
                      >
                        {t.optAvatarContain}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Portrait footer details */}
              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-neutral-400">
                <span className="text-emerald-400 uppercase font-bold tracking-wider">
                  {familiar.especie || "—"}
                </span>
                <span>{new Date(familiar.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Identity & Magical Bond (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Identity Card */}
            <div
              className={`glass-panel p-5 sm:p-6 rounded-2xl ${
                isAcademy ? "border border-amber-500/25" : "border border-emerald-500/20"
              } relative overflow-hidden shadow-xl`}
            >
              <h2 className="font-magic text-sm uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
                <PawPrint className="w-4 h-4" />
                {t.titleBasicRegistry}
              </h2>
              {isAcademy && <CompassStarDivider className="mb-4" />}

              {isQuickEditing ? (
                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="text-amber-400 uppercase font-bold tracking-wider block mb-1">
                      {t.familiarName}
                    </label>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-amber-400 uppercase font-bold tracking-wider block mb-1">
                      {t.familiarSpecies}
                    </label>
                    <input
                      type="text"
                      value={editEspecie}
                      onChange={(e) => setEditEspecie(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-amber-400 uppercase font-bold tracking-wider block mb-1">
                      {t.familiarDescription}
                    </label>
                    <textarea
                      rows={4}
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 rounded-lg p-2.5 focus:border-amber-500 focus:outline-none font-sans"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{t.familiarName}</div>
                      <div className="text-sm font-bold text-neutral-100 mt-1">{familiar.nombre}</div>
                    </div>
                    <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{t.familiarSpecies}</div>
                      <div className="text-sm font-bold text-emerald-300 mt-1">{familiar.especie}</div>
                    </div>
                  </div>

                  <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800/80">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono mb-2">
                      {t.familiarDescription}
                    </div>
                    {familiar.descripcion ? (
                      <p className="font-serif italic text-neutral-200 leading-relaxed text-sm whitespace-pre-wrap">
                        “{familiar.descripcion}”
                      </p>
                    ) : (
                      <p className="font-serif italic text-xs text-neutral-500">
                        {t.noDescriptionDefined}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Master / Wizard Bond Section (Mini-card) */}
            <div
              className={`glass-panel p-5 sm:p-6 rounded-2xl ${
                isAcademy ? "border border-amber-500/25" : "border border-emerald-500/20"
              } relative overflow-hidden shadow-xl`}
              id="familiar-bond-card"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-magic text-sm uppercase tracking-widest text-amber-400 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  {t.familiarBondSectionTitle}
                </h2>

                <button
                  type="button"
                  onClick={() => setIsSelectMasterOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{linkedMaster ? t.familiarChangeBond : t.familiarBondStudent}</span>
                </button>
              </div>
              {isAcademy && <CompassStarDivider className="mb-4" />}

              {linkedMaster ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-950/90 to-[#181126] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Master Info */}
                  <div className="flex items-center gap-3.5">
                    {linkedMaster.avatarImage ? (
                      <img
                        src={linkedMaster.avatarImage}
                        alt={linkedMaster.nombre}
                        className="w-14 h-14 rounded-xl object-cover border border-amber-500/50 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-violet-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <HouseCrest house={linkedMaster.casa} className="w-8 h-8" />
                      </div>
                    )}

                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90">
                        {linkedMaster.characterType === "adult_wizard"
                          ? t.characterTypeAdultWizard
                          : `${t.studentPrefix} • ${linkedMaster.casa}`}
                      </div>
                      <div className="font-magic text-lg font-bold text-neutral-100 uppercase tracking-wide">
                        {linkedMaster.nombre}
                      </div>
                      <div className="text-xs text-neutral-400 font-serif italic truncate max-w-xs">
                        {linkedMaster.concepto || linkedMaster.lema || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Actions to jump to master's profile or unbind */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      id="btn-navigate-to-master"
                      onClick={() => linkedMaster.id && onSelectCharacter(linkedMaster.id)}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.wizardViewDetail}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onBondMaster(familiar.id, null)}
                      className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                      title={t.familiarUnbind}
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-neutral-950/50 border border-neutral-800/80 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-200">{t.familiarBondNone}</div>
                    <div className="text-xs text-neutral-400 mt-1 font-serif italic">
                      Este compañero no está vinculado a ningún alumno o mago actualmente.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSelectMasterOpen(true)}
                    className="mt-1 px-4 py-2 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-500/40 text-emerald-100 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{t.familiarBondStudent}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Diario / Crónicas del Familiar (Inherited Notes) */}
      {activeTab === "notas" && (
        <div className="space-y-6 animate-fade-in">
          {/* New note form */}
          <form
            onSubmit={handleAddNote}
            className={`glass-panel p-5 sm:p-6 rounded-2xl ${
              isAcademy ? "border border-amber-500/25" : "border border-emerald-500/20"
            }`}
          >
            <h2 className="font-magic text-sm uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t.addNote}
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder={t.placeholderNoteTitle}
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
              <textarea
                rows={3}
                placeholder={t.placeholderNoteContent}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none font-sans"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteTitle.trim() && !newNoteContent.trim()}
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-emerald-100 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.registerNote}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-3">
            {(familiar.notasList || []).length === 0 ? (
              <div className="glass-panel p-8 text-center text-neutral-400 font-serif italic text-xs rounded-2xl border border-neutral-800">
                {t.emptyNotes}
              </div>
            ) : (
              (familiar.notasList || []).map((note) => (
                <div
                  key={note.id}
                  className="glass-panel p-4 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors space-y-2"
                >
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingNoteTitle}
                        onChange={(e) => setEditingNoteTitle(e.target.value)}
                        className="w-full bg-neutral-950 border border-amber-500/50 rounded p-2 text-xs font-mono text-neutral-100"
                      />
                      <textarea
                        rows={3}
                        value={editingNoteContent}
                        onChange={(e) => setEditingNoteContent(e.target.value)}
                        className="w-full bg-neutral-950 border border-amber-500/50 rounded p-2 text-xs text-neutral-100 font-sans"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded text-xs font-mono cursor-pointer"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditedNote(note.id)}
                          className="px-3 py-1 bg-amber-500 text-neutral-950 font-bold rounded text-xs font-mono cursor-pointer"
                        >
                          {t.save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-magic text-sm font-bold text-amber-300 uppercase tracking-wide">
                          {note.titulo}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-neutral-500">
                            {new Date(note.fecha).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteTitle(note.titulo);
                              setEditingNoteContent(note.contenido);
                            }}
                            className="p-1 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 font-sans whitespace-pre-wrap leading-relaxed">
                        {note.contenido}
                      </p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Galería de Recuerdos (Inherited Gallery) */}
      {activeTab === "galeria" && (
        <div className="space-y-6 animate-fade-in">
          {/* Gallery upload header */}
          <div
            className={`glass-panel p-5 sm:p-6 rounded-2xl ${
              isAcademy ? "border border-amber-500/25" : "border border-emerald-500/20"
            }`}
          >
            <h2 className="font-magic text-sm uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              {t.uploadGallery}
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Subir Imagen Local</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAddGalleryImage}
                />
              </label>

              <div className="w-full flex-1 flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://... o pegar URL de imagen"
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  disabled={!pastedUrl.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl text-xs font-mono uppercase cursor-pointer transition-colors"
                >
                  {t.add}
                </button>
              </div>
            </div>

            {galleryError && (
              <div className="mt-2 text-xs text-rose-400 font-mono">{galleryError}</div>
            )}
          </div>

          {/* Gallery grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(familiar.galleryImages || []).length === 0 ? (
              <div className="col-span-full glass-panel p-12 text-center text-neutral-500 font-serif italic text-xs rounded-2xl border border-neutral-800">
                {t.labelGalleryEmpty}
              </div>
            ) : (
              (familiar.galleryImages || []).map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden group bg-neutral-950 border border-neutral-800 shadow-lg"
                >
                  <img
                    src={imgUrl}
                    alt={`Recuerdo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(imgUrl)}
                      className="p-2 rounded-full bg-neutral-900/90 text-neutral-200 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryImage(idx)}
                      className="p-2 rounded-full bg-rose-950/90 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-neutral-800"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-neutral-900 text-neutral-200 hover:text-amber-400 border border-neutral-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Select Master / Bonding Modal */}
      {isSelectMasterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-magic text-sm font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                {t.familiarBondStudent}
              </h3>
              <button
                type="button"
                onClick={() => setIsSelectMasterOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 font-sans">
              {t.selectFamiliarToBond}
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {/* Option: Unbind */}
              <button
                type="button"
                onClick={() => {
                  onBondMaster(familiar.id, null);
                  setIsSelectMasterOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                  !familiar.studentId
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                    : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <span>{t.familiarBondNone}</span>
                {!familiar.studentId && <Check className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Characters list */}
              {characters.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => {
                    if (char.id) {
                      onBondMaster(familiar.id, char.id);
                      setIsSelectMasterOpen(false);
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                    referencesCharacter(familiar.studentId, char.id!)
                      ? "bg-amber-950/60 border-amber-500 text-amber-200"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {char.avatarImage ? (
                      <img
                        src={char.avatarImage}
                        alt={char.nombre}
                        className="w-7 h-7 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                    )}
                    <span className="truncate font-semibold">{char.nombre}</span>
                    <span className="text-[10px] text-neutral-500">
                      ({char.characterType === "adult_wizard" ? t.characterTypeAdultWizardShort : char.casa})
                    </span>
                  </div>
                  {referencesCharacter(familiar.studentId, char.id!) && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsSelectMasterOpen(false)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-xs font-mono uppercase cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (no window.confirm) */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border-2 border-rose-600/40 shadow-2xl space-y-4">
            <h3 className="font-magic text-base font-bold text-rose-400 uppercase tracking-wide">
              {t.familiarDeleteTitle}
            </h3>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              {t.familiarDeletePrompt}
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-xs font-mono uppercase cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  onDelete(familiar.id);
                }}
                className="px-4 py-2 bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold rounded-xl text-xs font-mono uppercase cursor-pointer"
              >
                {t.familiarDeleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Cropper Modal */}
      {isCropperOpen && cropImageSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg aspect-square bg-neutral-950 rounded-2xl overflow-hidden border border-amber-500/40">
            <Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setIsCropperOpen(false);
                setCropImageSrc(null);
              }}
              className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-xs font-mono uppercase cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleConfirmCrop}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs font-mono uppercase cursor-pointer"
            >
              {t.cropConfirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
