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
  Upload, 
  Trash2, 
  Info, 
  Languages, 
  Database, 
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Skull
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

  // Import flow states
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  useEffect(() => {
    updateStorageStats();
  }, []);

  const updateStorageStats = async () => {
    const stats = await getStorageEstimate();
    setStorageUsed(stats.usedMB);
    setStorageQuota(stats.quotaMB);
  };

  const handleExport = async () => {
    try {
      const allCharacters = await db.characters.toArray();
      const backup: BackupData = {
        backupVersion: "1.0",
        app: "Magistri Scholae",
        exportedAt: new Date().toISOString(),
        characters: allCharacters,
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `magistri_scholae_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({ type: "success", text: t.backupDownloadedMsg });
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: "error", text: t.backupErrorExportMsg });
    }
  };

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
          setStatusMessage({ type: "error", text: t.importError });
          return;
        }

        setPendingBackup(backupData);
        setShowImportModal(true);
      } catch (err) {
        console.error(err);
        setStatusMessage({ type: "error", text: t.importError });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = "";
  };

  // Import Action: REPLACE
  const handleImportReplace = async () => {
    if (!pendingBackup) return;
    try {
      await db.characters.clear();
      // Insert all
      const toInsert = pendingBackup.characters.map(({ id, ...rest }) => rest);
      await db.characters.bulkAdd(toInsert as Character[]);
      
      setShowImportModal(false);
      setPendingBackup(null);
      await updateStorageStats();
      setStatusMessage({ type: "success", text: t.importSuccess });
      onReloadRequested();
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: "error", text: t.backupErrorOverwriteMsg });
    }
  };

  // Import Action: ADD (Merge)
  const handleImportAdd = async () => {
    if (!pendingBackup) return;
    try {
      const toInsert = pendingBackup.characters.map(({ id, ...rest }) => rest);
      await db.characters.bulkAdd(toInsert as Character[]);

      setShowImportModal(false);
      setPendingBackup(null);
      await updateStorageStats();
      setStatusMessage({ type: "success", text: t.importSuccess });
      onReloadRequested();
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: "error", text: t.backupErrorMergeMsg });
    }
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
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15" id="settings-card-backup">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-amber-500" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {t.settingsTitleDatabaseTools}
            </h2>
          </div>

          <p className="text-xs text-neutral-400 mb-4 font-sans leading-relaxed">
            {t.settingsDDBBExplanation}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Export Backup Action */}
            <button
              id="btn-export-backup"
              onClick={handleExport}
              className="flex items-center justify-center gap-2 bg-violet-950/60 hover:bg-violet-900 border border-violet-500/35 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] text-violet-200 cursor-pointer"
            >
              <Download className="w-4 h-4 text-violet-400" />
              {t.exportBackup}
            </button>

            {/* Import Backup Trigger */}
            <label
              id="lbl-import-backup"
              className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-neutral-300"
            >
              <Upload className="w-4 h-4 text-neutral-400" />
              <span className="truncate">{t.importBackup}</span>
              <input 
                id="input-import-backup-file"
                type="file" 
                accept=".json" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
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

        {/* About App */}
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15" id="settings-card-about">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {t.about} — Magistri Scholae v1.0
            </h2>
          </div>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-3">
            {t.aboutDescription}
          </p>
          <div className="text-[11px] text-neutral-500 font-mono text-center pt-2 border-t border-violet-500/10">
            {t.schoolSealPrefix}
          </div>
        </div>

        {/* Severe Destructive Reset Action */}
        <div className="glass-panel p-6 rounded-xl border border-rose-900/25 bg-rose-950/5 md:col-span-2" id="settings-card-reset">
          <div className="flex items-center gap-2 mb-4 text-rose-400">
            <Trash2 className="w-5 h-5" />
            <h2 className="font-magic text-md uppercase tracking-wider">
              {t.resetData}
            </h2>
          </div>

          <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
            {t.settingsConfirmWipeDDBBDescription}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center bg-neutral-950/70 p-4 border border-rose-900/30 rounded-lg">
            <div className="w-full sm:w-auto flex-1">
              <input
                id="input-reset-confirm"
                type="text"
                placeholder={t.resetDataConfirmPlaceholder}
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full font-mono text-sm bg-neutral-900 border border-neutral-700 focus:border-rose-500 focus:ring-rose-500/20 text-center"
              />
            </div>

            <button
              id="btn-submit-reset"
              onClick={handleFullReset}
              disabled={resetConfirmText.trim().toUpperCase() !== wipePhrase}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-mono font-bold uppercase transition-all flex items-center justify-center gap-2 border ${
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

      </div>

      {/* Dual Import Choice Modal / Overlay */}
      {showImportModal && pendingBackup && (
        <div 
          id="backup-import-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border-2 border-amber-500/30 shadow-2xl animate-fade-in text-neutral-200">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <CheckCircle className="w-7 h-7" />
              <h3 className="font-magic text-lg md:text-xl uppercase tracking-wider">
                {t.importMergeRequestTitle}
              </h3>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed mb-6 font-sans">
              {t.importMergeRequestText}
            </p>

            <div className="bg-neutral-950/70 p-4 rounded-lg border border-neutral-800 mb-6 text-xs font-mono text-neutral-400 space-y-1">
              <div>• {t.backupTotalStudentsInFile}: <span className="text-amber-400 font-bold">{pendingBackup.characters.length}</span></div>
              <div>• {t.backupExportedOn}: {new Date(pendingBackup.exportedAt).toLocaleString()}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Replace Option */}
              <button
                id="btn-import-replace"
                onClick={handleImportReplace}
                className="bg-rose-900/80 hover:bg-rose-900 border border-rose-600/40 text-rose-100 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                🗑️ {t.importReplace}
              </button>

              {/* Add/Merge Option */}
              <button
                id="btn-import-merge"
                onClick={handleImportAdd}
                className="bg-violet-950 hover:bg-violet-900 border border-violet-500/40 text-violet-100 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                ➕ {t.importAdd}
              </button>

              {/* Cancel Option */}
              <button
                id="btn-import-cancel"
                onClick={() => {
                  setPendingBackup(null);
                  setShowImportModal(false);
                }}
                className="bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-400 py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
