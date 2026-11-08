/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The familiar sheet's "perfil" tab (R3.4).
import React from "react";
import { FiligreeCorner, CompassStarDivider } from "../AcademyOrnaments";
import { HouseCrest } from "../HouseCrest";
import { imageSrc } from "../../remote/assets";
import { PawPrint, Upload, Link as LinkIcon, Unlink, ExternalLink } from "lucide-react";

import type { FamiliarContext } from "./useFamiliarDetail";

export function FamiliarProfileTab({ ctx }: { ctx: FamiliarContext }) {
  const {
    familiar, onSelectCharacter, t, isAcademy, isQuickEditing, editNombre, setEditNombre, editEspecie, setEditEspecie,
    editDescripcion, setEditDescripcion, editImageFit, setEditImageFit, avatarInputRef, setIsSelectMasterOpen,
    linkedMaster, handleAvatarChange, handleBondMaster, canEditName, canEditSpecies, canEditDescription, canEditImage,
    canEditImageFit, canBond,
  } = ctx;
  return (
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
                    src={imageSrc(familiar.imagen)}
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
                {isQuickEditing && (canEditImage || canEditImageFit) && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEditImage && (
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
                    )}

                    {canEditImageFit && (
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
                    )}
                  </div>
                )}
              </div>

              {/* Portrait footer details */}
              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-neutral-400">
                <span className="text-emerald-400 uppercase font-bold tracking-wider">
                  {familiar.especie || "—"}
                </span>
                {/* The creation date is not part of the server's model: the element stays, empty. */}
                <span></span>
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
                      disabled={!canEditName}
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
                      disabled={!canEditSpecies}
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
                      disabled={!canEditDescription}
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

                {canBond && (
                <button
                  type="button"
                  onClick={() => setIsSelectMasterOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{linkedMaster ? t.familiarChangeBond : t.familiarBondStudent}</span>
                </button>
                )}
              </div>
              {isAcademy && <CompassStarDivider className="mb-4" />}

              {linkedMaster ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-950/90 to-[#181126] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Master Info */}
                  <div className="flex items-center gap-3.5">
                    {linkedMaster.fields.avatarImage ? (
                      <img
                        src={imageSrc(linkedMaster.fields.avatarImage)}
                        alt={linkedMaster.fields.nombre}
                        className="w-14 h-14 rounded-xl object-cover border border-amber-500/50 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-violet-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <HouseCrest house={linkedMaster.fields.casa ?? ""} className="w-8 h-8" />
                      </div>
                    )}

                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90">
                        {linkedMaster.fields.characterType === "adult_wizard"
                          ? t.characterTypeAdultWizard
                          : `${t.studentPrefix} • ${linkedMaster.fields.casa ?? ""}`}
                      </div>
                      <div className="font-magic text-lg font-bold text-neutral-100 uppercase tracking-wide">
                        {linkedMaster.fields.nombre}
                      </div>
                      <div className="text-xs text-neutral-400 font-serif italic truncate max-w-xs">
                        {linkedMaster.fields.concepto || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Actions to jump to master's profile or unbind */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      id="btn-navigate-to-master"
                      onClick={() => onSelectCharacter(linkedMaster.id)}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.wizardViewDetail}</span>
                    </button>

                    {canBond && (
                    <button
                      type="button"
                      onClick={() => handleBondMaster(null)}
                      className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                      title={t.familiarUnbind}
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                    )}
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
                  {canBond && (
                  <button
                    type="button"
                    onClick={() => setIsSelectMasterOpen(true)}
                    className="mt-1 px-4 py-2 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-500/40 text-emerald-100 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{t.familiarBondStudent}</span>
                  </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
  );
}
