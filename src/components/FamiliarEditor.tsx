/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Familiar, VisualStyle } from "../types";
import { Language, TRANSLATIONS } from "../localization";
import { db } from "../db";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/imageCompressor";
import { FiligreeCorner } from "./AcademyOrnaments";
import {
  Save,
  X,
  Sparkles,
  Trash2,
  Plus,
  Edit2,
  ArrowLeft,
  ShieldAlert,
  Check,
  PawPrint,
} from "lucide-react";

interface FamiliarEditorProps {
  lang: Language;
  visualStyle?: VisualStyle;
  onBack: () => void;
  onFamiliarSaved?: (familiar: Familiar) => void;
  onFamiliarDeleted?: (id: string) => void;
  onShowToast?: (type: "success" | "error", text: string) => void;
  isModal?: boolean;
  initialFamiliarId?: string | null;
}

export const FamiliarEditor: React.FC<FamiliarEditorProps> = ({
  lang,
  visualStyle = "academy",
  onBack,
  onFamiliarSaved,
  onFamiliarDeleted,
  onShowToast,
  isModal = false,
  initialFamiliarId = null,
}) => {
  const t = TRANSLATIONS[lang];
  const isAcademy = visualStyle === "academy";

  // List of saved familiars in IndexedDB
  const [familiars, setFamiliars] = useState<Familiar[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");
  const [pastedUrl, setPastedUrl] = useState("");

  // Validation & feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Cropper states
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const loadFamiliars = async () => {
    try {
      const list = await db.familiars.orderBy("createdAt").reverse().toArray();
      setFamiliars(list);
      return list;
    } catch (err) {
      console.error("Failed to load familiars:", err);
      return [];
    }
  };

  useEffect(() => {
    loadFamiliars().then((list) => {
      if (initialFamiliarId) {
        const found = list.find((f) => f.id === initialFamiliarId);
        if (found) {
          handleSelectFamiliarToEdit(found);
        }
      }
    });
  }, [initialFamiliarId]);

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setEspecie("");
    setDescripcion("");
    setImagen("");
    setImageFit("cover");
    setPastedUrl("");
    setFormError(null);
    setImageError(null);
  };

  const handleSelectFamiliarToEdit = (fam: Familiar) => {
    setEditingId(fam.id);
    setNombre(fam.nombre);
    setEspecie(fam.especie);
    setDescripcion(fam.descripcion || "");
    setImagen(fam.imagen || "");
    setImageFit(fam.imageFit || "cover");
    setFormError(null);
    setImageError(null);
  };

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
    } catch (err) {
      console.error("Familiar image upload error:", err);
      setImageError(t.imageUploadError);
    } finally {
      e.target.value = "";
    }
  };

  const handleUrlSubmit = () => {
    if (!pastedUrl.trim()) return;
    setImageError(null);
    setCropImageSrc(pastedUrl.trim());
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setIsCropperOpen(true);
    setPastedUrl("");
  };

  const onCropComplete = (_croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      setImagen(croppedBase64);
      setIsCropperOpen(false);
      setCropImageSrc(null);
    } catch (err) {
      console.error("Familiar crop error:", err);
      setImageError(t.imageUploadError);
    }
  };

  const handleSaveFamiliar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombre.trim() || !especie.trim()) {
      setFormError(t.familiarValidationError);
      return;
    }

    const now = Date.now();
    const existing = editingId ? familiars.find((f) => f.id === editingId) : undefined;

    const familiarRecord: Familiar = {
      id: editingId || `fam_${now}_${Math.random().toString(36).substring(2, 7)}`,
      nombre: nombre.trim(),
      especie: especie.trim(),
      descripcion: descripcion.trim(),
      imagen: imagen || undefined,
      imageFit,
      studentId: existing?.studentId,
      notasList: existing?.notasList,
      galleryImages: existing?.galleryImages,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      await db.familiars.put(familiarRecord);
      await loadFamiliars();
      if (onShowToast) {
        onShowToast("success", t.familiarSavedToast);
      }
      if (onFamiliarSaved) {
        onFamiliarSaved(familiarRecord);
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save familiar:", err);
      setFormError(t.validationErrorGeneric);
    }
  };

  const handleDeleteFamiliar = async (id: string) => {
    try {
      await db.familiars.delete(id);
      if (editingId === id) {
        resetForm();
      }
      setConfirmDeleteId(null);
      await loadFamiliars();
      if (onFamiliarDeleted) {
        onFamiliarDeleted(id);
      }
      if (onShowToast) {
        onShowToast("success", t.familiarDeletedToast);
      }
    } catch (err) {
      console.error("Failed to delete familiar:", err);
    }
  };

  return (
    <div
      className={
        isModal
          ? "w-full max-w-5xl mx-auto p-3 sm:p-6"
          : "w-full max-w-6xl mx-auto px-3 py-6 sm:py-8 animate-fade-in"
      }
      id="familiar-editor-container"
    >
      {/* Top Banner Header */}
      <div
        className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/85 to-[#120924] ${
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

        <div className="z-10 space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <PawPrint className="w-5 h-5" />
            </div>
            <h2 className="font-magic text-xl md:text-2xl text-neutral-100 uppercase tracking-widest glow-amber">
              {t.familiarEditorTitle}
            </h2>
          </div>
          <p className="text-xs text-neutral-300 italic font-serif pl-1">
            {t.familiarEditorSubtitle}
          </p>
        </div>

        <div className="z-10 flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {editingId && (
            <button
              id="btn-familiar-new-reset"
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-emerald-500/30 bg-emerald-950/60 hover:bg-emerald-900/70 rounded-xl text-xs font-semibold font-mono text-emerald-200 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.familiarCreateNewBtn}
            </button>
          )}

          <button
            id="btn-familiar-back"
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 border border-neutral-700 bg-neutral-950/80 hover:bg-neutral-900 rounded-xl text-xs font-semibold font-mono text-neutral-300 transition-all hover:border-neutral-500 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.back}
          </button>
        </div>
      </div>

      {formError && (
        <div
          id="familiar-error-alert"
          className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <span className="text-xs font-semibold font-mono">{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-rose-400 hover:text-rose-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Editor Panel + Saved Familiars Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 items-stretch">
        {/* Left Panel: Familiar Creation / Edition Form */}
        <form
          onSubmit={handleSaveFamiliar}
          className={`glass-panel p-5 sm:p-7 rounded-2xl relative overflow-hidden flex flex-col justify-between ${
            isAcademy ? "border border-amber-500/20" : "border border-violet-500/15"
          }`}
          id="familiar-editor-form"
        >
          {isAcademy && (
            <>
              <FiligreeCorner position="tl" className="w-5 h-5 text-amber-500/30" />
              <FiligreeCorner position="tr" className="w-5 h-5 text-amber-500/30" />
              <FiligreeCorner position="bl" className="w-5 h-5 text-amber-500/30" />
              <FiligreeCorner position="br" className="w-5 h-5 text-amber-500/30" />
            </>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-violet-500/15 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                  {editingId ? t.familiarUpdateBtn : t.familiarCreateNewBtn}
                </h3>
              </div>
              {editingId && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  {t.edit}
                </span>
              )}
            </div>

            {/* Portrait + Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-[190px_1fr] gap-6 items-start">
              {/* Portrait Column (same capabilities as Student Avatar) */}
              <div className="flex flex-col items-center md:items-stretch space-y-3.5">
                <div
                  className={`w-44 md:w-full aspect-[3/4] bg-neutral-950 rounded-2xl border-2 flex items-center justify-center overflow-hidden relative shadow-inner mx-auto ${
                    isAcademy
                      ? "border-amber-500/35 text-amber-400"
                      : "border-emerald-500/35 text-emerald-400"
                  }`}
                  id="familiar-avatar-box"
                >
                  {imagen ? (
                    <img
                      id="familiar-avatar-preview"
                      src={imagen}
                      alt={nombre || t.familiar}
                      className={`w-full h-full ${
                        imageFit === "contain" ? "object-contain bg-[#11091f]" : "object-cover"
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center text-neutral-600 p-4 select-none">
                      <PawPrint className="w-9 h-9 mx-auto mb-2 opacity-40 text-emerald-400" />
                      <span className="text-[10px] font-mono block uppercase">{t.noPortrait}</span>
                      <span className="text-[8px] font-mono text-neutral-500 mt-1 block">
                        {t.idealRatio}
                      </span>
                    </div>
                  )}

                  {imagen && (
                    <button
                      id="btn-remove-familiar-avatar"
                      type="button"
                      onClick={() => setImagen("")}
                      className="absolute bottom-2 right-2 bg-rose-950/85 border border-rose-500/30 p-1.5 rounded-lg text-rose-300 hover:text-rose-200 transition-all cursor-pointer shadow"
                      title={t.removeAvatar}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Upload & Fit Controls */}
                <div className="w-full p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">
                      {t.uploadAvatar}
                    </span>
                    <input
                      id="familiar-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-[10px] text-neutral-400 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-emerald-950 file:text-emerald-200 hover:file:bg-emerald-900 cursor-pointer"
                    />
                  </div>

                  <div className="border-t border-neutral-800/60 pt-2 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">
                      {t.pasteUrl}
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        id="input-familiar-avatar-url"
                        type="text"
                        placeholder="https://..."
                        value={pastedUrl}
                        onChange={(e) => setPastedUrl(e.target.value)}
                        className="flex-1 text-[10px] py-1 px-1.5 min-w-0"
                      />
                      <button
                        id="btn-apply-familiar-url"
                        type="button"
                        onClick={handleUrlSubmit}
                        className="px-2 bg-emerald-900/60 border border-emerald-500/30 text-emerald-100 rounded text-[9px] font-mono font-bold hover:bg-emerald-800 transition-all h-6 cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-neutral-800/60 pt-2 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">
                      {t.lblAvatarFit}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        id="btn-familiar-fit-cover"
                        type="button"
                        onClick={() => setImageFit("cover")}
                        className={`px-2 py-1 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer truncate ${
                          imageFit === "cover"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        {t.optAvatarCover}
                      </button>
                      <button
                        id="btn-familiar-fit-contain"
                        type="button"
                        onClick={() => setImageFit("contain")}
                        className={`px-2 py-1 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer truncate ${
                          imageFit === "contain"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        {t.optAvatarContain}
                      </button>
                    </div>
                  </div>
                </div>

                {imageError && (
                  <div className="bg-rose-950/40 border border-rose-500/20 rounded-lg p-2.5 flex items-center justify-between text-rose-300 text-[10px] font-mono">
                    <span className="truncate">{imageError}</span>
                    <button
                      type="button"
                      onClick={() => setImageError(null)}
                      className="text-rose-400 hover:text-rose-200 cursor-pointer p-0.5 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Name, Species & Description */}
              <div className="space-y-4">
                {/* Nombre del Familiar */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-between">
                    <span>
                      {t.familiarName} <span className="text-rose-400">*</span>
                    </span>
                    <span className="text-[9px] text-neutral-500 normal-case font-normal">
                      {t.minOneChar}
                    </span>
                  </label>
                  <input
                    id="input-familiar-nombre"
                    type="text"
                    required
                    placeholder={t.familiarNamePlaceholder}
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="w-full text-sm font-sans"
                  />
                </div>

                {/* Especie del Familiar */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    {t.familiarSpecies} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="input-familiar-especie"
                    type="text"
                    required
                    placeholder={t.familiarSpeciesPlaceholder}
                    value={especie}
                    onChange={(e) => {
                      setEspecie(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="w-full text-xs sm:text-sm font-sans"
                  />
                </div>

                {/* Descripción del Familiar */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    {t.familiarDescription}
                  </label>
                  <textarea
                    id="input-familiar-descripcion"
                    rows={6}
                    placeholder={t.familiarDescriptionPlaceholder}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full text-xs sm:text-sm font-sans leading-relaxed resize-y"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="flex items-center justify-end gap-3 pt-5 mt-6 border-t border-violet-500/15">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-neutral-700 bg-neutral-950/80 hover:bg-neutral-900 rounded-xl text-xs font-semibold font-mono text-neutral-300 transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
            )}
            <button
              id="btn-save-familiar"
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-neutral-950 transition-all font-sans cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-amber-500 hover:bg-amber-400"
            >
              <Save className="w-4 h-4" />
              {editingId ? t.familiarUpdateBtn : t.familiarSaveNewBtn}
            </button>
          </div>
        </form>

        {/* Right Panel: Registered Familiars Gallery */}
        <div
          className={`glass-panel p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col ${
            isAcademy ? "border border-amber-500/20" : "border border-violet-500/15"
          }`}
          id="familiar-registry-list-panel"
        >
          {isAcademy && (
            <>
              <FiligreeCorner position="tl" className="w-5 h-5 text-amber-500/30" />
              <FiligreeCorner position="tr" className="w-5 h-5 text-amber-500/30" />
              <FiligreeCorner position="bl" className="w-5 h-5 text-amber-500/30" />
              <FiligreeCorner position="br" className="w-5 h-5 text-amber-500/30" />
            </>
          )}

          <div className="flex items-center justify-between border-b border-violet-500/15 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-amber-400" />
              <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                {t.familiarGalleryTitle}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-amber-400">
              {familiars.length}
            </span>
          </div>

          {familiars.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-neutral-800 rounded-xl bg-neutral-950/30">
              <PawPrint className="w-10 h-10 text-neutral-700 mb-2" />
              <p className="text-xs font-mono text-neutral-500">{t.familiarGalleryEmpty}</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[540px] pr-1 scrollbar-thin">
              {familiars.map((fam) => {
                const isSelected = editingId === fam.id;
                const isConfirmingDelete = confirmDeleteId === fam.id;

                return (
                  <div
                    key={fam.id}
                    id={`familiar-card-${fam.id}`}
                    className={`p-3 rounded-xl border transition-all flex gap-3.5 items-start ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500/50 shadow-md"
                        : "bg-neutral-950/60 border-neutral-800/90 hover:border-neutral-700"
                    }`}
                  >
                    {/* Familiar Thumbnail */}
                    <div
                      onClick={() => handleSelectFamiliarToEdit(fam)}
                      className="w-16 h-20 rounded-lg bg-neutral-900 border border-amber-500/25 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer"
                    >
                      {fam.imagen ? (
                        <img
                          src={fam.imagen}
                          alt={fam.nombre}
                          className={`w-full h-full ${
                            fam.imageFit === "contain"
                              ? "object-contain bg-[#11091f]"
                              : "object-cover"
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <PawPrint className="w-6 h-6 text-neutral-700" />
                      )}
                    </div>

                    {/* Familiar Details */}
                    <div
                      onClick={() => handleSelectFamiliarToEdit(fam)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <h4 className="font-magic text-sm text-amber-300 font-bold truncate">
                          {fam.nombre}
                        </h4>
                      </div>
                      <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-emerald-300 bg-emerald-950/60 border border-emerald-500/25 px-1.5 py-0.5 rounded mt-0.5">
                        {fam.especie}
                      </span>
                      {fam.descripcion && (
                        <p className="text-xs text-neutral-400 line-clamp-2 mt-1.5 font-sans leading-snug">
                          {fam.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectFamiliarToEdit(fam)}
                        className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-300 transition-colors cursor-pointer"
                        title={t.edit}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteFamiliar(fam.id)}
                            className="p-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                            title={t.delete}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                            title={t.cancel}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(fam.id)}
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-rose-950/70 border border-neutral-800 hover:border-rose-500/30 text-neutral-500 hover:text-rose-300 transition-colors cursor-pointer"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Portrait Cropper Modal */}
      {isCropperOpen && cropImageSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
          id="crop-familiar-modal"
        >
          <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 flex flex-col space-y-4 shadow-2xl">
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
                className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded hover:bg-neutral-800"
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
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
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
                className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 border border-emerald-600 text-emerald-100 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
