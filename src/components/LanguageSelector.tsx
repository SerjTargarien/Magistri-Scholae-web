/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Language } from "../localization";
import { Languages } from "lucide-react";

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="relative inline-block text-left" id="lang-selector-container">
      <div className="flex items-center gap-2 bg-neutral-900/60 border border-violet-500/25 px-3 py-1.5 rounded-lg text-sm transition-all hover:border-amber-500/40">
        <Languages className="w-4 h-4 text-violet-400" />
        <select
          id="lang-select"
          value={currentLanguage}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="bg-transparent border-none p-0 pr-6 text-neutral-200 font-medium cursor-pointer focus:ring-0 focus:outline-none text-xs sm:text-sm"
          style={{ backgroundImage: "none" }} // remove default arrow styles if needed
        >
          <option value="es" className="bg-neutral-930 text-neutral-200">
            🇪🇸 Español
          </option>
          <option value="en" className="bg-neutral-930 text-neutral-200">
            🇬🇧 English
          </option>
        </select>
      </div>
    </div>
  );
};
