/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Character, HOUSES, HOUSE_ICONS, BackupData } from "../types";
import { Language, TRANSLATIONS } from "../localization";
import { 
  Plus, 
  Settings, 
  Search, 
  Sparkles, 
  BadgeHelp,
  BookOpen, 
  Coins, 
  Award,
  CircleDot,
  Upload
} from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";

interface CharacterListProps {
  lang: Language;
  characters: Character[];
  onSelectCharacter: (id: number) => void;
  onAddCharacter: () => void;
  onOpenSettings: () => void;
  onLanguageChange: (lang: Language) => void;
  onImportBackup: (backup: BackupData) => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  lang,
  characters,
  onSelectCharacter,
  onAddCharacter,
  onOpenSettings,
  onLanguageChange,
  onImportBackup,
}) => {
  const t = TRANSLATIONS[lang];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHouseFilter, setSelectedHouseFilter] = useState<string>("ALL");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawText = event.target?.result as string;
        const backupData = JSON.parse(rawText) as BackupData;

        // Validation
        if (!backupData || backupData.app !== "Magistri Scholae" || !Array.isArray(backupData.characters)) {
          alert(t.importError);
          return;
        }

        onImportBackup(backupData);
      } catch (err) {
        console.error(err);
        alert(t.importError);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = "";
  };

  // Filter & Search Logic
  const filteredCharacters = characters.filter((c) => {
    // House filter
    if (selectedHouseFilter !== "ALL" && c.casa.toUpperCase() !== selectedHouseFilter) {
      return false;
    }

    // Search query matches name, concept, or player
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchName = c.nombre.toLowerCase().includes(query);
      const matchJugador = c.jugador.toLowerCase().includes(query);
      const matchConcept = c.concepto.toLowerCase().includes(query);
      return matchName || matchJugador || matchConcept;
    }

    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6" id="character-list-container">
      {/* Top Header with App Branding and global controllers */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 border-b border-violet-500/15 pb-6">
        <div className="flex items-center gap-3 text-center md:text-left">
          {/* School Crest */}
<img
  src="/icon.svg"
  alt="Crest"
  className="w-14 h-14 object-contain drop-shadow-lg"
  referrerPolicy="no-referrer"
/>
          <div>
            <h1 className="font-magic text-2xl md:text-3xl text-neutral-100 uppercase tracking-widest glow-amber">
              {t.appName}
            </h1>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-400 tracking-wider">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Header Right menu with languages and configuration */}
        <div className="flex items-center gap-3">

          <button
            id="btn-settings"
            onClick={onOpenSettings}
            className="flex items-center justify-center p-2 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 border border-violet-500/25 text-violet-400 hover:text-amber-400 transition-all font-mono text-xs cursor-pointer"
            title={t.settings}
          >
            <Settings className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">{t.settings}</span>
          </button>

          {/* Import Backup Trigger */}
          <button
            id="btn-import-header"
            type="button"
            onClick={() => document.getElementById("file-input-header")?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900/60 hover:bg-neutral-800 border border-violet-500/20 text-neutral-300 hover:text-amber-400 font-mono text-xs rounded-lg transition-all cursor-pointer min-h-[36px]"
            title={t.importBackup}
          >
            <Upload className="w-4 h-4 text-violet-400" />
            <span className="hidden sm:inline">{lang === "es" ? "Importar" : "Import"}</span>
          </button>
          <input 
            id="file-input-header"
            type="file" 
            accept=".json" 
            onChange={handleFileChange} 
            className="hidden" 
          />

          <button
            id="btn-add-character-header"
            onClick={onAddCharacter}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-600 hover:to-indigo-600 text-neutral-100 font-extrabold rounded-lg text-xs md:text-sm border border-violet-500/40 shadow-lg shadow-violet-950/40 hover:scale-[1.03] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addCharacter}</span>
          </button>
        </div>
      </div>

      {/* Query Bar and House filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
            <input
              id="search-input"
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-950/40 border border-violet-500/15 focus:border-amber-500/60 rounded-xl text-sm"
            />
          </div>

        </div>

        {/* Quick house badge filter strip (Desktop & Mobile tap grid) */}
        <div className="flex flex-wrap gap-2 justify-center py-1">
          <button
            id="filter-badge-all"
            onClick={() => setSelectedHouseFilter("ALL")}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all border ${
              selectedHouseFilter === "ALL"
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {t.filterAllHouses}
          </button>
          {Object.keys(HOUSES).map((hKey) => {
            const h = HOUSES[hKey];
            const isSelected = selectedHouseFilter === hKey;
            return (
              <button
                id={`filter-badge-${hKey}`}
                key={hKey}
                onClick={() => setSelectedHouseFilter(hKey)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-violet-950 border-amber-500 text-amber-300"
                    : "bg-neutral-900/60 border-neutral-700/20 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  hKey === "IRATI" ? "bg-emerald-500" :
                  hKey === "URANIA" ? "bg-amber-500" :
                  hKey === "AL-KHWARIZMI" ? "bg-violet-500" :
                  hKey === "CALANTES" ? "bg-indigo-500" : "bg-rose-500"
                }`}></span>
                {h.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Characters list grid display */}
      {filteredCharacters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="characters-grid">
          {filteredCharacters.map((c) => {
            const hInfo = HOUSES[c.casa.toUpperCase()] || HOUSES.IRATI;
            
            return (
              <div
                id={`character-card-${c.id}`}
                key={c.id}
                onClick={() => c.id && onSelectCharacter(c.id)}
                className="group relative cursor-pointer rounded-2xl overflow-hidden glass-panel border border-violet-500/15 flex flex-col hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300 select-none shadow-xl shadow-neutral-950/50"
              >
                {/* Colored Top Crest-Accent Strip */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${
                  c.casa.toUpperCase() === "IRATI" ? "from-emerald-500 to-emerald-950" :
                  c.casa.toUpperCase() === "URANIA" ? "from-amber-500 to-amber-950" :
                  c.casa.toUpperCase() === "AL-KHWARIZMI" ? "from-violet-500 to-violet-950" :
                  c.casa.toUpperCase() === "CALANTES" ? "from-indigo-500 to-indigo-950" :
                  "from-rose-500 to-rose-950"
                }`}></div>

                {/* Card Top - Image and Badge */}
                <div className="relative aspect-[3/4] w-full bg-neutral-950 overflow-hidden flex items-center justify-center">
                  {c.avatarImage ? (
                    <img 
                      src={c.avatarImage} 
                      alt={c.nombre} 
                      className={`w-full h-full transition-all duration-500 group-hover:scale-105 ${c.avatarFit === "contain" ? "object-contain bg-[#11091f]" : "object-cover"}`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-900/40 group-hover:bg-neutral-900/60 transition-colors flex flex-col justify-center items-center text-neutral-600 select-none p-4">
                      <Sparkles className="w-10 h-10 mb-2 opacity-50 text-violet-400 animate-pulse" />
                      <span className="text-[9px] font-mono uppercase tracking-widest">{t.studentPrefix} • {hInfo.nombre.toUpperCase()}</span>
                    </div>
                  )}

                  {/* House Ribbon Tag */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${hInfo.accentClass}`}>
                    {hInfo.nombre}
                  </div>

                  {/* Year Tag */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-900/90 text-neutral-300 border border-neutral-700/50 rounded">
                    {c.curso}
                  </div>
                </div>

                {/* Card Body - Bio Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-magic text-sm font-bold text-neutral-100 uppercase tracking-wider group-hover:text-amber-400 transition-colors truncate">
                      {c.nombre || t.noName}
                    </h3>

                    {c.concepto ? (
                      <p className="text-xs text-neutral-400 mt-1 italic line-clamp-2 min-h-[2rem]">
                        “{c.concepto}”
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-600 mt-1 font-mono min-h-[2rem]">
                        {t.noConceptDefined}
                      </p>
                    )}
                  </div>

                  {/* Summary row */}
                  <div className="mt-4 pt-3 border-t border-violet-500/10 grid grid-cols-3 gap-1 text-center font-mono">
                    <div>
                      <div className="text-[8px] text-neutral-500 uppercase tracking-tight">{t.lblDestino}</div>
                      <div className="text-xs text-amber-500 font-bold flex items-center justify-center gap-0.5">
                        <Coins className="w-3 h-3 text-amber-500 shrink-0" />
                        {c.puntosDestino}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] text-neutral-500 uppercase tracking-tight">{t.lblExp}</div>
                      <div className="text-xs text-violet-400 font-bold flex items-center justify-center gap-0.5">
                        <Award className="w-3 h-3 text-violet-400 shrink-0" />
                        {c.pxs}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] text-neutral-500 uppercase tracking-tight">{t.jugador}</div>
                      <div className="text-[10px] text-neutral-300 font-semibold truncate max-w-full">
                        {c.jugador || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel p-12 text-center rounded-2xl border border-violet-500/15 max-w-lg mx-auto mt-12" id="empty-list-state">
          <BadgeHelp className="w-16 h-16 text-violet-400/50 mx-auto mb-4 animate-bounce" />
          <h3 className="font-magic text-lg text-neutral-200 uppercase tracking-widest glow-violet">
            {t.emptyRecords}
          </h3>
          <p className="text-sm text-neutral-400 font-sans mt-2">
            {t.noCharacters}
          </p>
          <button
            id="btn-add-character-empty"
            onClick={onAddCharacter}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-500/90 text-neutral-950 font-black rounded-xl text-sm transition-all focus:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.addCharacter}
          </button>
        </div>
      )}
    </div>
  );
};
