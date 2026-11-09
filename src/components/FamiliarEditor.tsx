/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import type { FamiliarEditorProps } from "../account/screens";
import { TRANSLATIONS } from "../localization";
import type { FamiliarSheet } from "../model/sheet";
import { newFamiliarSheet } from "../model/defaults";
import { ApiFailure } from "../remote/client";
import { imageSrc } from "../remote/assets";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/imageCompressor";
import { FiligreeCorner } from "./AcademyOrnaments";
import { IMAGE_FROM_URL } from "./imageFromUrl";
import { limitAttrs } from "./LimitHint";
import {
  Save,
  X,
  Sparkles,
  Trash2,
  ArrowLeft,
  ShieldAlert,
  PawPrint,
} from "lucide-react";

export type { FamiliarEditorProps };

/** Which message a refused save shows: the name/species rule, or the generic one. */
const isNameRule = (path?: string, rule?: string) => (path === "nombre" || path === "especie") && rule === "required";

export const FamiliarEditor: React.FC<FamiliarEditorProps> = ({
  lang,
  onCreate,
  onUploadImage,
  onBack,
  onShowToast,
  isModal = false,
}) => {
  const t = TRANSLATIONS[lang];
  // Creation only (owner decision, 8 November 2026): an existing familiar is edited on its
  // own sheet, like a character, and familiars are listed on the main card view.
  // Form fields. `imagen` is the cropped picture (data URL), uploaded after creation.
  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");
  const [pastedUrl, setPastedUrl] = useState("");

  // Validation & feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Cropper states
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const resetForm = () => {
    setNombre("");
    setEspecie("");
    setDescripcion("");
    setImagen("");
    setImageFit("cover");
    setPastedUrl("");
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

    {
      // The whole sheet is created once; the cropped picture is uploaded after.
      const fields: FamiliarSheet = {
        ...newFamiliarSheet(),
        nombre: nombre.trim(),
        especie: especie.trim(),
        descripcion: descripcion.trim(),
        imageFit,
      };
      try {
        await onCreate(fields, imagen.startsWith("data:") ? imagen : undefined);
      } catch (err) {
        console.error("Failed to create familiar:", err);
        setFormError(
          err instanceof ApiFailure && isNameRule(err.details?.path, err.details?.rule)
            ? t.familiarValidationError
            : t.validationErrorGeneric
        );
        return;
      }
    }

    onShowToast("success", t.familiarSavedToast);
    resetForm();
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
        className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/85 to-[#120924] border border-amber-500/30 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-2xl`}
      >
        <>
          <FiligreeCorner position="tl" className="w-6 h-6 text-amber-500/40" />
          <FiligreeCorner position="tr" className="w-6 h-6 text-amber-500/40" />
          <FiligreeCorner position="bl" className="w-6 h-6 text-amber-500/40" />
          <FiligreeCorner position="br" className="w-6 h-6 text-amber-500/40" />
        </>
        

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

      {/* The creation form (familiars are listed on the main card view) */}
      <div className="max-w-3xl mx-auto">
        {/* Left Panel: Familiar Creation / Edition Form */}
        <form
          onSubmit={handleSaveFamiliar}
          className={`glass-panel p-5 sm:p-7 rounded-2xl relative overflow-hidden flex flex-col justify-between border border-amber-500/20`}
          id="familiar-editor-form"
        >
          <>
            <FiligreeCorner position="tl" className="w-5 h-5 text-amber-500/30" />
            <FiligreeCorner position="tr" className="w-5 h-5 text-amber-500/30" />
            <FiligreeCorner position="bl" className="w-5 h-5 text-amber-500/30" />
            <FiligreeCorner position="br" className="w-5 h-5 text-amber-500/30" />
          </>
          

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-violet-500/15 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                  {t.familiarCreateNewBtn}
                </h3>
              </div>
            </div>

            {/* Portrait + Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-[190px_1fr] gap-6 items-start">
              {/* Portrait Column (same capabilities as Student Avatar) */}
              <div className="flex flex-col items-center md:items-stretch space-y-3.5">
                <div
                  className={`w-44 md:w-full aspect-[3/4] bg-neutral-950 rounded-2xl border-2 flex items-center justify-center overflow-hidden relative shadow-inner mx-auto border-amber-500/35 text-amber-400`}
                  id="familiar-avatar-box"
                >
                  {imagen ? (
                    <img
                      id="familiar-avatar-preview"
                      src={imageSrc(imagen)}
                      alt={nombre || t.archetypeFamiliar}
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

                  {/* Hidden until the server downloads the image (most sites block the browser from doing it). */}
                  {IMAGE_FROM_URL && (
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
                  )}

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
                    {...limitAttrs("familiar", "nombre")}
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
                    {...limitAttrs("familiar", "especie")}
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
                    {...limitAttrs("familiar", "descripcion")}
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
            <button
              id="btn-save-familiar"
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-neutral-950 transition-all font-sans cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-amber-500 hover:bg-amber-400"
            >
              <Save className="w-4 h-4" />
              {t.familiarSaveNewBtn}
            </button>
          </div>
        </form>

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
