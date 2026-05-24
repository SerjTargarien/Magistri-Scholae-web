/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CharacterType, CHARACTER_TYPES } from "../types";
import { Language, TRANSLATIONS } from "../localization";
import { ArrowLeft, Sparkles } from "lucide-react";

interface CharacterTypeSelectProps {
  lang: Language;
  onSelectType: (type: CharacterType) => void;
  onCancel: () => void;
}

export const CharacterTypeSelect: React.FC<CharacterTypeSelectProps> = ({
  lang,
  onSelectType,
  onCancel,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div 
      className="w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh] animate-fade-in"
      id="character-type-select-container"
    >
      <div className="w-full max-w-2xl bg-neutral-900/70 border border-violet-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative">
        {/* Magic spark decorations */}
        <div className="absolute top-4 right-4 text-amber-500/40 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-magic text-xl md:text-2xl text-neutral-100 uppercase tracking-widest glow-amber mb-2">
            {t.characterTypeSelectTitle}
          </h2>
          <p className="text-xs font-mono text-neutral-400 max-w-md mx-auto">
            {t.characterTypeSelectDescription}
          </p>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Student archetype */}
          <button
            type="button"
            id="type-select-student"
            onClick={() => onSelectType("student")}
            className="group flex flex-col items-center p-6 bg-neutral-950/40 hover:bg-neutral-950/80 border border-violet-500/10 hover:border-amber-500/50 rounded-xl cursor-pointer text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-950/30"
          >
            <div className="w-16 h-16 rounded-full bg-violet-950/50 group-hover:bg-amber-500/20 border border-violet-500/20 group-hover:border-amber-500/30 flex items-center justify-center text-3xl mb-4 transition-colors">
              {CHARACTER_TYPES.student.icon}
            </div>
            <h3 className="font-sans font-bold text-neutral-200 group-hover:text-amber-400 text-lg transition-colors mb-2">
              {t.characterTypeStudent}
            </h3>
            <p className="text-xs text-neutral-400 group-hover:text-neutral-300 leading-relaxed font-sans">
              {t.characterTypeStudentDescription}
            </p>
          </button>

          {/* Adult wizard archetype */}
          <button
            type="button"
            id="type-select-adult-wizard"
            onClick={() => onSelectType("adult_wizard")}
            className="group flex flex-col items-center p-6 bg-neutral-950/40 hover:bg-neutral-950/80 border border-violet-500/10 hover:border-amber-500/50 rounded-xl cursor-pointer text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-950/30"
          >
            <div className="w-16 h-16 rounded-full bg-violet-950/50 group-hover:bg-amber-500/20 border border-violet-500/20 group-hover:border-amber-500/30 flex items-center justify-center text-3xl mb-4 transition-colors">
              {CHARACTER_TYPES.adult_wizard.icon}
            </div>
            <h3 className="font-sans font-bold text-neutral-200 group-hover:text-amber-400 text-lg transition-colors mb-2">
              {t.characterTypeAdultWizard}
            </h3>
            <p className="text-xs text-neutral-400 group-hover:text-neutral-300 leading-relaxed font-sans">
              {t.characterTypeAdultWizardDescription}
            </p>
          </button>
        </div>

        {/* Footer actions */}
        <div className="flex justify-center border-t border-violet-500/15 pt-6">
          <button
            type="button"
            id="btn-type-select-cancel"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-950/60 hover:bg-neutral-850 hover:text-neutral-200 border border-neutral-800 text-neutral-400 font-mono text-xs rounded-lg transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
