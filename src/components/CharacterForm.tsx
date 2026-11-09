/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import Cropper from "react-easy-crop";
import {
  Save,
  X,
  Sparkles,
  ShieldAlert,
  User,
  Activity,
  Award,
  BookOpen,
  PawPrint
} from "lucide-react";
import { FamiliarEditor } from "./FamiliarEditor";
import type { CharacterFormProps } from "../account/screens";

import { useCharacterForm } from "./form/useCharacterForm";
import { FormProfileTab } from "./form/FormProfileTab";
import { FormAspectsTab } from "./form/FormAspectsTab";
import { FormHouseTab } from "./form/FormHouseTab";
import { FormSkillsTab } from "./form/FormSkillsTab";
import { FormStressTab } from "./form/FormStressTab";
import { Slider } from "./Slider";

export type { CharacterFormProps };

export const CharacterForm: React.FC<CharacterFormProps> = (screenProps) => {
  const ctx = useCharacterForm(screenProps);
  const {
    lang, onCancel, t, activeFormTab, setActiveFormTab, characterType, formError, showDiscardModal, setShowDiscardModal,
    showFamiliarEditorModal, setShowFamiliarEditorModal, cropImageSrc, setCropImageSrc, isCropperOpen, setIsCropperOpen,
    crop, setCrop, zoom, setZoom, onCropComplete, handleConfirmCrop, handleSave, handleCreateFamiliar, handleCancelClick,
    houseMotto, theme, houseTabBtnStyle, houseIconColor,
  } = ctx;

  return (
    <div className="w-full max-w-6xl mx-auto px-2 py-4 sm:py-6" id="character-form-container">
      
      {/* Dynamic Styled Banner Decor matching academic theme */}
      <div className={`p-6 rounded-2xl bg-gradient-to-r ${theme.bgClass} border border-violet-500/10 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-2xl transition-all duration-300`}>
        {/* Ambient Magic Grid backdrops */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(124,58,237,0.1),transparent_50%)] pointer-events-none" />
        
        <div className="z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{theme.icon}</span>
            <h2 className="font-magic text-xl md:text-2xl text-neutral-100 uppercase tracking-widest glow-amber">
              {characterType === "adult_wizard" ? t.adultWizardRegistration : t.studentRegistration}
            </h2>
          </div>
          <p className="text-xs text-neutral-300 italic font-serif">
            {houseMotto ? `« ${houseMotto} »` : t.tagline}
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
            ...(characterType !== "adult_wizard" ? [{ id: "afiliacion", label: t.tabHouseMotto, icon: Award }] : []),
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
                <span className="whitespace-nowrap">{formTab.label}</span>
              </button>
            );
          })}

          {characterType !== "adult_wizard" && (
            <button
              id="btn-form-open-familiar-editor-nav"
              type="button"
              onClick={() => setShowFamiliarEditorModal(true)}
              className="flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-xl border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-950/60 text-emerald-300 transition-all text-left shrink-0 snap-center cursor-pointer select-none lg:w-full lg:mt-2"
            >
              <PawPrint className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="whitespace-nowrap">{t.familiarEditorCardTitle}</span>
            </button>
          )}
        </div>

        {/* Right column: Form Fields Sheet inside single gorgeous Panel */}
        <div className="glass-panel p-5 sm:p-7 rounded-2xl border border-violet-500/10 min-h-[480px]">
          
          {/* TAB 1: IDENTIFICATION */}
          {activeFormTab === "perfil" && <FormProfileTab ctx={ctx} />}

          {/* TAB 2: CASA Y LEMA */}
          {activeFormTab === "afiliacion" && <FormHouseTab ctx={ctx} />}



          {/* TAB 4: STRESS TRACKS */}
          {activeFormTab === "estres" && <FormStressTab ctx={ctx} />}

          {/* TAB 6: ACADEMIC SKILLS */}
          {activeFormTab === "habilidades" && <FormSkillsTab ctx={ctx} />}

          {/* TAB 5: ASPECTS & BELONGINGS */}
          {activeFormTab === "aspectos" && <FormAspectsTab ctx={ctx} />}

        </div>

      </div>

      {/* Primary bottom controller buttons */}
      <div className="mt-8 flex justify-end gap-3 border-t border-violet-500/10 pt-4">
        <button
          id="btn-form-bottom-cancel"
          type="button"
          onClick={handleCancelClick}
          className="px-5 py-2.5 border border-neutral-700 bg-neutral-950/70 hover:bg-neutral-900 rounded-xl text-xs sm:text-sm font-semibold transition-all text-neutral-300 font-mono cursor-pointer"
        >
          {t.cancel}
        </button>
        <button
          id="btn-form-bottom-save"
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-7 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-neutral-950 transition-all font-sans cursor-pointer shadow-lg hover:scale-[1.01] bg-amber-500 hover:bg-amber-400"
        >
          <Save className="w-4 h-4" />
          {t.save}
        </button>
      </div>

      {/* Discard Draft Confirmation Modal (replaces window.confirm) */}
      {showDiscardModal && (
        <div
          id="modal-discard-draft"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-amber-500/30 bg-[#0e0a16] shadow-2xl space-y-4">
            <h3 className="font-magic text-base text-amber-400 font-bold border-b border-amber-500/10 pb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              {t.discardDraftTitle}
            </h3>
            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
              {t.draftDiscardConfirm}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="btn-discard-draft-cancel"
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                id="btn-discard-draft-confirm"
                type="button"
                onClick={() => {
                  setShowDiscardModal(false);
                  onCancel();
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {t.discardDraftConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full cropped portrait modal display */}
      {isCropperOpen && cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in" id="crop-avatar-modal">
          <div className="bg-neutral-900 border border-violet-500/25 rounded-2xl w-full max-w-md p-6 flex flex-col space-y-4 shadow-2xl">
            
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
                <span>🔍 {t.cropZoom}</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <Slider label={t.cropZoom} min={1} max={3} step={0.05} value={zoom} onChange={setZoom} />
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
                className="w-full py-2.5 bg-violet-900 hover:bg-violet-800 border border-violet-600 text-violet-100 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {t.cropConfirm}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Embedded Modal for Familiar Editor during character creation */}
      {showFamiliarEditorModal && (
        <div
          id="modal-familiar-editor"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-2 sm:p-6 animate-fade-in flex items-start justify-center"
        >
          <div className="w-full max-w-6xl my-auto">
            <FamiliarEditor
              lang={lang}
              onCreate={handleCreateFamiliar}
              onUploadImage={async () => {}}
              onBack={() => setShowFamiliarEditorModal(false)}
              onShowToast={() => {}}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
