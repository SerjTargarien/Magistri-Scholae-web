/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The creation form's "perfil" tab, moved verbatim out of CharacterForm.tsx (R3.4).
import React from "react";
import { Sparkles, Trash2, User, X } from "lucide-react";
import { imageSrc } from "../../remote/assets";

import type { FormContext } from "./useCharacterForm";

export function FormProfileTab({ ctx }: { ctx: FormContext }) {
  const {
    t, characterState, setCharacterState, characterType, profile, updateProfileField, updateTeachingSubjects, formError,
    setFormError, imageError, setImageError, pastedAvatarUrl, setPastedAvatarUrl, avatarDataUrl, removeAvatar,
    handleAgeChange, handleImageUpload, handleUrlAvatarSubmit, houseAccentBorder, houseIconColor,
  } = ctx;
  return (
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
                    {avatarDataUrl ? (
                      <img
                        id="avatar-edit-preview"
                        src={imageSrc(avatarDataUrl)}
                        alt={characterState.nombre || t.uploadAvatar}
                        className={`w-full h-full ${characterState.avatarFit === "contain" ? "object-contain bg-[#11091f]" : "object-cover"}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center text-neutral-600 p-4 select-none">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-violet-400" />
                        <span className="text-[10px] font-mono block uppercase">{t.noPortrait}</span>
                        <span className="text-[8px] font-mono text-neutral-500 mt-1 block">{t.idealRatio}</span>
                      </div>
                    )}
                    {avatarDataUrl && (
                      <button
                        id="btn-remove-avatar"
                        type="button"
                        onClick={removeAvatar}
                        className="absolute bottom-2 right-2 bg-rose-950/80 border border-rose-500/30 p-1.5 rounded-lg text-rose-300 hover:text-rose-200 transition-all cursor-pointer shadow"
                        title={t.removeAvatar}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Portrait File / URL uploader controls */}
                  <div className="w-full p-3 bg-neutral-950/50 rounded-xl border border-neutral-800 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">{t.uploadAvatar}</span>
                      <input
                        id="avatar-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-[10px] text-neutral-400 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-violet-950 file:text-violet-200 hover:file:bg-violet-900 cursor-pointer"
                      />
                    </div>

                    <div className="border-t border-neutral-800/60 pt-2 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">{t.pasteUrl}</span>
                      <div className="flex gap-1.5">
                        <input
                          id="input-avatar-url"
                          type="text"
                          placeholder="https://..."
                          value={pastedAvatarUrl}
                          onChange={(e) => setPastedAvatarUrl(e.target.value)}
                          className="flex-1 text-[10px] py-1 px-1.5 min-w-0"
                        />
                        <button
                          id="btn-apply-avatar-url"
                          type="button"
                          onClick={handleUrlAvatarSubmit}
                          className="px-2 bg-violet-900/60 border border-violet-500/25 text-violet-100 rounded text-[9px] font-mono font-bold hover:bg-violet-800 transition-all h-6 cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    </div>

                    {/* Portrait Fit Selector (cover vs contain) */}
                    <div className="border-t border-neutral-800/60 pt-2 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">{t.lblAvatarFit}</span>
                      <div className="grid grid-cols-2 gap-1.5" id="form-avatar-fit-toggle">
                        <button
                          id="btn-form-fit-cover"
                          type="button"
                          onClick={() => setCharacterState(prev => ({ ...prev, avatarFit: "cover" }))}
                          className={`px-2 py-1 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer truncate ${
                            (characterState.avatarFit || "cover") === "cover"
                              ? "bg-amber-500/20 border-amber-500 text-amber-300"
                              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                          }`}
                        >
                          {t.optAvatarCover}
                        </button>
                        <button
                          id="btn-form-fit-contain"
                          type="button"
                          onClick={() => setCharacterState(prev => ({ ...prev, avatarFit: "contain" }))}
                          className={`px-2 py-1 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer truncate ${
                            characterState.avatarFit === "contain"
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
                      <span className="text-[9px] text-neutral-500 normal-case font-normal leading-none">{t.minOneChar}</span>
                    </label>
                    <input
                      id="input-nombre"
                      type="text"
                      required
                      placeholder={t.placeholderNombre}
                      value={characterState.nombre ?? ""}
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
                      value={characterState.concepto ?? ""}
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
                      value={characterState.jugador ?? ""}
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
                      value={characterState.edad ?? ""}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      className="w-full text-xs font-mono"
                    />
                  </div>

                  {/* School Fields (Student Only) */}
                  {characterType !== "adult_wizard" && (
                    <>
                      {/* Curso */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                          {t.curso}
                        </label>
                        <input
                          id="input-curso"
                          type="text"
                          value={characterState.curso ?? ""}
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
                          value={characterState.puestoClase ?? ""}
                          onChange={(e) => setCharacterState(prev => ({ ...prev, puestoClase: e.target.value }))}
                          className="w-full text-xs font-sans"
                        />
                      </div>
                    </>
                  )}

                  {/* Linaje familiar */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      {t.linaje}
                    </label>
                    <input
                      id="input-linaje"
                      type="text"
                      placeholder={t.placeholderLinaje}
                      value={characterState.linaje ?? ""}
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
                      value={characterState.economia ?? ""}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, economia: e.target.value }))}
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
                      value={characterState.varitaSintonia ?? ""}
                      onChange={(e) => setCharacterState(prev => ({ ...prev, varitaSintonia: e.target.value }))}
                      className="w-full text-xs font-sans"
                    />
                  </div>

                  {/* Adult Wizard Fields */}
                  {characterType === "adult_wizard" && (
                    <div className="col-span-1 sm:col-span-2 border-t border-violet-500/10 pt-5 mt-4 space-y-4">
                      <div className="flex items-center gap-1.5 border-b border-violet-500/10 pb-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h4 className="font-magic text-xs uppercase tracking-widest text-neutral-200">
                          {t.adultWizardProfileSection}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Rol */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                            {t.adultWizardRole}
                          </label>
                          <input
                            id="input-aw-role"
                            type="text"
                            placeholder={t.adultWizardRolePlaceholder}
                            value={profile.role}
                            onChange={(e) => updateProfileField("role", e.target.value)}
                            className="w-full text-xs font-sans"
                          />
                        </div>

                        {/* Institución */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                            {t.adultWizardInstitution}
                          </label>
                          <input
                            id="input-aw-institution"
                            type="text"
                            placeholder={t.adultWizardInstitutionPlaceholder}
                            value={profile.institution}
                            onChange={(e) => updateProfileField("institution", e.target.value)}
                            className="w-full text-xs font-sans"
                          />
                        </div>

                        {/* Antigua Casa */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                            {t.adultWizardFormerHouse}
                          </label>
                          <input
                            id="input-aw-former-house"
                            type="text"
                            placeholder={t.adultWizardFormerHousePlaceholder}
                            value={profile.formerHouse}
                            onChange={(e) => updateProfileField("formerHouse", e.target.value)}
                            className="w-full text-xs font-sans"
                          />
                        </div>

                        {/* Reputación: beside the former house since the focus joined the wand above. */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                            {t.adultWizardReputation}
                          </label>
                          <input
                            id="input-aw-reputation"
                            type="text"
                            placeholder={t.adultWizardReputationPlaceholder}
                            value={profile.reputation}
                            onChange={(e) => updateProfileField("reputation", e.target.value)}
                            className="w-full text-xs font-sans"
                          />
                        </div>

                        {/* Es Profesor (Checkbox) */}
                        <div className="flex items-center gap-2 sm:col-span-2 py-1">
                          <input
                            id="checkbox-aw-is-teacher"
                            type="checkbox"
                            checked={profile.isTeacher}
                            onChange={(e) => updateProfileField("isTeacher", e.target.checked)}
                            className="w-4 h-4 rounded border-violet-500/20 text-amber-500 focus:ring-amber-500 bg-neutral-950 cursor-pointer"
                          />
                          <label htmlFor="checkbox-aw-is-teacher" className="text-xs text-neutral-300 font-sans cursor-pointer select-none">
                            {t.adultWizardIsTeacher}
                          </label>
                        </div>

                        {/* Asignaturas que imparte */}
                        {profile.isTeacher && (
                          <div className="flex flex-col gap-1.5 sm:col-span-2 animate-fade-in">
                            <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex justify-between">
                              <span>{t.adultWizardTeachingSubjects}</span>
                              <span className="text-[9px] text-neutral-500 normal-case font-normal">{t.commaSeparatedHint}</span>
                            </label>
                            <input
                              id="input-aw-teaching-subjects"
                              type="text"
                              placeholder={t.adultWizardTeachingSubjectsPlaceholder}
                              value={profile.teachingSubjects.map(s => s.value ?? "").join(", ")}
                              onChange={(e) => updateTeachingSubjects(e.target.value)}
                              className="w-full text-xs font-sans"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
  );
}
