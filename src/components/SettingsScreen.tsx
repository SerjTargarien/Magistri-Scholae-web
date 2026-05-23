/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Language, TRANSLATIONS } from "../localization";
import { db, getStorageEstimate } from "../db";
import { Character, BackupData } from "../types";
import { 
  Download, 
  Trash2, 
  Info, 
  Languages, 
  Database, 
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Skull,
  Users,
  Search,
  X
} from "lucide-react";

interface SettingsScreenProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onReloadRequested: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  lang,
  onLanguageChange,
  onBack,
  onReloadRequested,
}) => {
  const t = TRANSLATIONS[lang];
  const wipePhrase = t.resetConfirmPhrase;

  const [storageUsed, setStorageUsed] = useState<string>("0");
  const [storageQuota, setStorageQuota] = useState<string>("0");
  const [resetConfirmText, setResetConfirmText] = useState<string>("");
  const [isResetApproved, setIsResetApproved] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // States for selective character backups
  const [dbCharacters, setDbCharacters] = useState<Character[]>([]);
  const [selectedCharIds, setSelectedCharIds] = useState<number[]>([]);
  const [showExportSelectModal, setShowExportSelectModal] = useState<boolean>(false);
  const [backupSearchQuery, setBackupSearchQuery] = useState<string>("");

  useEffect(() => {
    updateStorageStats();
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const chars = await db.characters.toArray();
      setDbCharacters(chars);
      // Automatically pre-select all characters when loading/opening selective backup
      setSelectedCharIds(chars.map(c => c.id).filter((id): id is number => typeof id === "number"));
    } catch (e) {
      console.error("Failed to load students for backup list:", e);
    }
  };

  const updateStorageStats = async () => {
    const stats = await getStorageEstimate();
    setStorageUsed(stats.usedMB);
    setStorageQuota(stats.quotaMB);
  };

  const getExportTimestamp = () => {
    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  };

  const triggerExport = (charsToExport: Character[], isFullBackup: boolean) => {
    try {
      if (charsToExport.length === 0) {
        setStatusMessage({ type: "error", text: t.studentListEmptyBackup });
        return;
      }

      const backup: BackupData = {
        backupVersion: "1.0",
        app: "Magistri Scholae",
        exportedAt: new Date().toISOString(),
        characters: charsToExport,
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      let filename = "";
      const timestamp = getExportTimestamp();

      if (isFullBackup) {
        filename = `${timestamp}_magistri_scholae_fullbackup.json`;
      } else if (charsToExport.length === 1) {
        const cleanName = (charsToExport[0].nombre || "student")
          .trim()
          .replace(/[^a-zA-Z0-9]/g, "_")
          .toUpperCase();
        filename = `${timestamp}_magistri_scholae_${cleanName}.json`;
      } else {
        filename = `${timestamp}_magistri_scholae_students.json`;
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({ type: "success", text: t.backupDownloadedMsg });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: t.backupErrorExportMsg });
    }
  };

  const handleExportAll = async () => {
    try {
      const allCharacters = await db.characters.toArray();
      if (allCharacters.length === 0) {
        setStatusMessage({ type: "error", text: t.studentListEmptyBackup });
        return;
      }
      triggerExport(allCharacters, true);
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: "error", text: t.backupErrorExportMsg });
    }
  };

  const handleExportSelected = () => {
    const selectedChars = dbCharacters.filter(c => c.id !== undefined && selectedCharIds.includes(c.id));
    if (selectedChars.length === 0) {
      setStatusMessage({ 
        type: "error", 
        text: lang === "es" ? "Por favor, selecciona al menos un alumno para exportar." : "Please select at least one student to export." 
      });
      return;
    }
    const isFullBackup = selectedChars.length === dbCharacters.length && dbCharacters.length > 1;
    triggerExport(selectedChars, isFullBackup);
    setShowExportSelectModal(false);
  };

  // Database Hard Reset
  const handleFullReset = async () => {
    if (resetConfirmText.trim().toUpperCase() !== wipePhrase) {
      setStatusMessage({ type: "error", text: t.resetDataConfirmError });
      return;
    }

    try {
      await db.characters.clear();
      setResetConfirmText("");
      await updateStorageStats();
      setStatusMessage({ type: "success", text: t.resetSuccess });
      onReloadRequested();
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: "error", text: t.backupErrorWipeMsg });
    }
  };

  const filteredChars = dbCharacters.filter((c) => {
    if (!backupSearchQuery.trim()) return true;
    const query = backupSearchQuery.toLowerCase();
    const nameMatch = (c.nombre || "").toLowerCase().includes(query);
    const houseMatch = (c.casa || "").toLowerCase().includes(query);
    const conceptMatch = (c.concepto || "").toLowerCase().includes(query);
    return nameMatch || houseMatch || conceptMatch;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" id="settings-screen">
      {/* Top Bar Navigation */}
      <div className="flex justify-between items-center mb-8 border-b border-violet-500/15 pb-4">
        <button 
          id="btn-settings-back"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-amber-400 bg-neutral-900/60 hover:bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/40 transition-all font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </button>
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          <h1 className="font-magic text-xl md:text-2xl text-neutral-100 uppercase tracking-widest glow-amber">
            {t.settings}
          </h1>
        </div>
      </div>

      {statusMessage && (
        <div 
          id="settings-status-banner"
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 border ${
            statusMessage.type === "success" 
              ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-300" 
              : "bg-rose-950/40 border-rose-500/20 text-rose-300"
          }`}
        >
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            {statusMessage.text}
          </div>
          <button 
            className="ml-auto text-xs opacity-65 hover:opacity-100"
            onClick={() => setStatusMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Localization & Preferences Card */}
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15" id="settings-card-lang">
          <div className="flex items-center gap-2 mb-4">
            <Languages className="w-5 h-5 text-amber-500" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {t.languageSelector}
            </h2>
          </div>
          
          <p className="text-xs text-neutral-400 mb-4 font-sans leading-relaxed">
            {t.settingsLanguageExplanation}
          </p>

          <div className="flex items-center gap-4 bg-neutral-950/40 p-4 border border-violet-500/10 rounded-lg">
            <span className="text-sm text-neutral-300 font-medium">
              {t.settingsCurrentLanguage}:
            </span>
            <select
              id="settings-language-dropdown"
              value={lang}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-neutral-900 border border-violet-500/30 text-amber-300 p-2 rounded-md font-medium font-mono text-sm cursor-pointer ml-auto"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>

        {/* Offline & Backup Systems */}
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15 animate-fade-in" id="settings-card-backup">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-amber-500" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {t.settingsTitleDatabaseTools}
            </h2>
          </div>

          <p className="text-xs text-neutral-400 mb-4 font-sans leading-relaxed">
            {t.settingsDDBBExplanation}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. Full Backup Action */}
            <button
              id="btn-export-backup-all"
              onClick={handleExportAll}
              className="flex items-center justify-center gap-2 bg-violet-950/60 hover:bg-violet-900 border border-violet-500/35 py-3 px-3 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] text-violet-100 cursor-pointer"
            >
              <Download className="w-4 h-4 text-violet-400 shrink-0" />
              <span className="truncate">{t.exportFullBackup}</span>
            </button>

            {/* 2. Opening the Selective Export Modal */}
            <button
              id="btn-export-selective"
              onClick={() => {
                loadCharacters();
                setBackupSearchQuery(""); // Clear old search
                setShowExportSelectModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/25 py-3 px-3 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] text-indigo-255 cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{t.exportSelect}</span>
            </button>
          </div>
        </div>

        {/* Storage Details */}
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15" id="settings-card-storage">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {t.storageInfo}
            </h2>
          </div>

          <div className="space-y-3 text-xs text-neutral-300 leading-relaxed bg-neutral-950/30 p-4 border border-violet-900/10 rounded-lg">
            <p>{t.storageInfoText}</p>
            <div className="grid grid-cols-2 gap-2 font-mono text-neutral-400 text-[11px] pt-1">
              <div>{t.estimatedUsage}</div>
              <div className="text-amber-300 text-right">{storageUsed} MB</div>
               <div>{t.totalQuota}</div>
              <div className="text-neutral-400 text-right">{storageQuota} MB</div>
            </div>
          </div>
        </div>

        {/* Severe Destructive Reset Action - Parallel to Storage Info */}
        <div className="glass-panel p-6 rounded-xl border border-rose-900/25 bg-rose-950/5" id="settings-card-reset">
          <div className="flex items-center gap-2 mb-4 text-rose-400">
            <Trash2 className="w-5 h-5" />
            <h2 className="font-magic text-md uppercase tracking-wider">
              {t.resetData}
            </h2>
          </div>

          <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
            {t.settingsConfirmWipeDDBBDescription}
          </p>

          <div className="flex flex-col gap-3 bg-neutral-950/70 p-4 border border-rose-900/30 rounded-lg">
            <input
              id="input-reset-confirm"
              type="text"
              placeholder={t.resetDataConfirmPlaceholder}
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              className="w-full font-mono text-xs bg-neutral-900 border border-neutral-700 focus:border-rose-500 focus:ring-rose-500/20 text-center p-2 rounded-lg focus:outline-none"
            />

            <button
              id="btn-submit-reset"
              onClick={handleFullReset}
              disabled={resetConfirmText.trim().toUpperCase() !== wipePhrase}
              className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-2 border ${
                resetConfirmText.trim().toUpperCase() === wipePhrase
                  ? "bg-rose-900 border-rose-600 text-rose-100 hover:bg-rose-800 cursor-pointer"
                  : "bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
            >
              <Skull className="w-4 h-4" />
              {t.settingsExecutePurge}
            </button>
          </div>
        </div>

        {/* About App - Bottom-most section in full width */}
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2" id="settings-card-about">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {t.about} {t.appName}
            </h2>
          </div>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-3">
            {t.aboutDescription}
          </p>
          <div className="text-[11px] text-neutral-500 font-mono text-center pt-2 border-t border-violet-500/10">
            {t.schoolSealPrefix}
          </div>
        </div>

      </div>

      {/* Selective Export Modal / Overlay */}
      {showExportSelectModal && (
        <div 
          id="backup-export-selective-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border-2 border-indigo-500/30 shadow-2xl animate-fade-in text-neutral-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3 text-indigo-400">
                <Users className="w-6 h-6 text-indigo-400" />
                <h3 className="font-magic text-lg md:text-xl uppercase tracking-wider">
                  {t.exportSelectTitle}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowExportSelectModal(false)}
                className="p-1.5 hover:bg-neutral-900 rounded-lg text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Description */}
            <p className="text-xs text-neutral-400 mb-4 font-sans leading-relaxed">
              {t.exportSelectDescription}
            </p>

            {/* Search Input Bar */}
            <div className="relative mb-3.5">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-500" />
              </span>
              <input
                type="text"
                placeholder={t.searchBackupStudents}
                value={backupSearchQuery}
                onChange={(e) => setBackupSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-905 border border-neutral-805 text-neutral-200 rounded-lg text-xs font-sans placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Select Helpers & Counters */}
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-bold text-neutral-300 font-sans uppercase tracking-wider">
                {t.exportSelectedCount.replace("{n}", String(selectedCharIds.length))}
              </span>
              {filteredChars.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const filteredIds = filteredChars.map(c => c.id).filter((id): id is number => id !== undefined);
                      const union = Array.from(new Set([...selectedCharIds, ...filteredIds]));
                      setSelectedCharIds(union);
                    }}
                    className="text-[9px] font-mono hover:text-amber-400 text-neutral-300 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 transition-all cursor-pointer"
                  >
                    {t.selectAll}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const filteredIds = filteredChars.map(c => c.id).filter((id): id is number => id !== undefined);
                      const diff = selectedCharIds.filter(id => !filteredIds.includes(id));
                      setSelectedCharIds(diff);
                    }}
                    className="text-[9px] font-mono hover:text-amber-400 text-neutral-300 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 transition-all cursor-pointer"
                  >
                    {t.deselectAll}
                  </button>
                </div>
              )}
            </div>

            {/* Floating list scroll box with dynamic height bounds */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 py-1.5 custom-scrollbar bg-neutral-950/40 rounded-lg p-2.5 border border-neutral-900">
              {dbCharacters.length === 0 ? (
                <p className="text-[11px] text-neutral-500 font-mono text-center py-6 italic">
                  {t.studentListEmptyBackup}
                </p>
              ) : filteredChars.length === 0 ? (
                <p className="text-[11px] text-neutral-500 font-mono text-center py-6 italic">
                  {lang === "es" ? "No se encontraron alumnos para esta búsqueda." : "No matching students found."}
                </p>
              ) : (
                filteredChars.map((c) => {
                  const isChecked = c.id !== undefined && selectedCharIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                        isChecked 
                          ? "bg-violet-950/20 border-violet-500/15 text-neutral-200" 
                          : "bg-neutral-900/10 border-transparent text-neutral-500 hover:text-neutral-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (c.id === undefined) return;
                          if (isChecked) {
                            setSelectedCharIds(selectedCharIds.filter(id => id !== c.id));
                          } else {
                            setSelectedCharIds([...selectedCharIds, c.id]);
                          }
                        }}
                        className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500/30 w-4 h-4 cursor-pointer"
                      />
                      <div className="truncate flex flex-col min-w-0">
                        <span className="truncate font-sans font-medium text-neutral-200">{c.nombre || t.noName}</span>
                        {c.concepto && (
                          <span className="truncate text-[9px] font-mono text-neutral-505 mt-0.5 uppercase tracking-wider">
                            {c.concepto}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                id="btn-export-selective-cancel"
                onClick={() => setShowExportSelectModal(false)}
                className="bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-400 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="btn-export-selective-download"
                onClick={handleExportSelected}
                disabled={selectedCharIds.length === 0}
                className={`py-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 border uppercase ${
                  selectedCharIds.length > 0
                    ? "bg-violet-900 hover:bg-violet-800 text-violet-100 border-violet-600/50 cursor-pointer"
                    : "bg-neutral-900 text-neutral-650 border-neutral-800 cursor-not-allowed"
                }`}
              >
                <Download className="w-4 h-4 text-violet-450 shrink-0" />
                {lang === "es" ? "Descargar" : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
