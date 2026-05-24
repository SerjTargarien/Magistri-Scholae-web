/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Character, BackupData, CharacterType } from "./types";
import { db } from "./db";
import { Language, TRANSLATIONS } from "./localization";
import { CharacterList } from "./components/CharacterList";
import { CharacterDetail } from "./components/CharacterDetail";
import { CharacterForm } from "./components/CharacterForm";
import { CharacterTypeSelect } from "./components/CharacterTypeSelect";
import { SettingsScreen } from "./components/SettingsScreen";
import { Sparkles, Loader, CheckCircle } from "lucide-react";

export default function App() {
  // Screens: LIST, DETAIL, TYPE_SELECT, FORM, SETTINGS
  const [screen, setScreen] = useState<"LIST" | "DETAIL" | "TYPE_SELECT" | "FORM" | "SETTINGS">("LIST");
  
  // Storage arrays & selections
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [newCharacterType, setNewCharacterType] = useState<CharacterType>("student");
  const [loading, setLoading] = useState<boolean>(true);

  // Localization Language State (Spanish default)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("magistri_scholae_lang");
    return (saved === "es" || saved === "en") ? saved : "es";
  });

  // Import Flow States
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const t = TRANSLATIONS[lang];

  // Load characters on boot or reload
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    setLoading(true);
    try {
      const all = await db.characters.reverse().sortBy("createdAt");
      setCharacters(all);
    } catch (e) {
      console.error("Failed to load records from IndexedDB:", e);
    } finally {
      setLoading(false);
    }
  };

  // Persist language choices
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("magistri_scholae_lang", newLang);
  };

  // Find currently active chosen character
  const activeCharacter = characters.find((c) => c.id === selectedCharId) || null;

  // Actions
  const handleSelectCharacter = (id: number) => {
    setSelectedCharId(id);
    setScreen("DETAIL");
  };

  const handleAddCharacterClick = () => {
    setEditingCharacter(null); // Indicates fresh new character
    setScreen("TYPE_SELECT");
  };

  const handleEditCharacterClick = () => {
    setEditingCharacter(activeCharacter);
    setScreen("FORM");
  };

  const handleSaveForm = async (savedChar: Character) => {
    try {
      if (savedChar.id) {
        // Updating existing character
        await db.characters.put(savedChar);
      } else {
        // Adding new character
        const newId = await db.characters.add(savedChar);
        savedChar.id = newId;
      }
      
      // Re-fetch and route
      await loadCharacters();
      setSelectedCharId(savedChar.id || null);
      setScreen("DETAIL");
    } catch (error) {
      console.error("IndexedDB Save Blocked:", error);
      alert(t.errorStoringStudent);
    }
  };

  const handleDeleteCharacter = async (id: number) => {
    try {
      await db.characters.delete(id);
      await loadCharacters();
      setSelectedCharId(null);
      setScreen("LIST");
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  // Live in-page reactive propagation helper
  const handleUpdateActiveCharacterState = (updatedChar: Character) => {
    setCharacters((prev) => prev.map((c) => (c.id === updatedChar.id ? updatedChar : c)));
  };

  // Clear toast feedback automatically
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleImportBackup = (backup: BackupData) => {
    setPendingBackup(backup);
    setShowImportModal(true);
  };

  const handleImportReplace = async () => {
    if (!pendingBackup) return;
    try {
      await db.characters.clear();
      const toInsert = pendingBackup.characters.map(({ id, ...rest }) => rest);
      await db.characters.bulkAdd(toInsert as Character[]);
      
      setShowImportModal(false);
      setPendingBackup(null);
      await loadCharacters();
      setToastMessage({ type: "success", text: t.importSuccess });
    } catch (e) {
      console.error(e);
      setToastMessage({ type: "error", text: t.backupErrorOverwriteMsg });
    }
  };

  const handleImportAdd = async () => {
    if (!pendingBackup) return;
    try {
      const toInsert = pendingBackup.characters.map(({ id, ...rest }) => rest);
      await db.characters.bulkAdd(toInsert as Character[]);

      setShowImportModal(false);
      setPendingBackup(null);
      await loadCharacters();
      setToastMessage({ type: "success", text: t.importSuccess });
    } catch (e) {
      console.error(e);
      setToastMessage({ type: "error", text: t.backupErrorMergeMsg });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0514] text-neutral-200 font-sans selection:bg-violet-900/50 selection:text-amber-300 pb-12" id="academy-app-root">
      
      {/* Dynamic Ambient Background Canvas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0a0514]">
        {/* Indigo glow top left */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px]"></div>
        {/* Violet glow bottom right */}
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-violet-900/30 rounded-full blur-[120px]"></div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-screen gap-4" id="app-loading-screen">
          <Loader className="w-10 h-10 text-amber-500 animate-spin" />
          <span className="font-magic text-sm tracking-widest text-neutral-400 uppercase animate-pulse">
            {t.loadingMessage}
          </span>
        </div>
      ) : (
        <main className="relative z-10 w-full">
          {screen === "LIST" && (
            <CharacterList
              lang={lang}
              characters={characters}
              onSelectCharacter={handleSelectCharacter}
              onAddCharacter={handleAddCharacterClick}
              onOpenSettings={() => setScreen("SETTINGS")}
              onLanguageChange={handleLanguageChange}
              onImportBackup={handleImportBackup}
            />
          )}

          {screen === "DETAIL" && activeCharacter && (
            <CharacterDetail
              lang={lang}
              character={activeCharacter}
              onBack={() => {
                setSelectedCharId(null);
                setScreen("LIST");
              }}
              onEdit={handleEditCharacterClick}
              onDelete={handleDeleteCharacter}
              onUpdateCharacter={handleUpdateActiveCharacterState}
            />
          )}

          {screen === "TYPE_SELECT" && (
            <CharacterTypeSelect
              lang={lang}
              onSelectType={(type) => {
                setNewCharacterType(type);
                setScreen("FORM");
              }}
              onCancel={() => {
                setScreen("LIST");
              }}
            />
          )}

          {screen === "FORM" && (
            <CharacterForm
              lang={lang}
              initialCharacter={editingCharacter}
              newCharacterType={newCharacterType}
              onSave={handleSaveForm}
              onCancel={() => {
                setScreen(editingCharacter ? "DETAIL" : "LIST");
              }}
            />
          )}

          {screen === "SETTINGS" && (
            <SettingsScreen
              lang={lang}
              onLanguageChange={handleLanguageChange}
              onBack={() => setScreen("LIST")}
              onReloadRequested={loadCharacters}
            />
          )}
        </main>
      )}

      {/* Dual Import Choice Modal / Overlay */}
      {showImportModal && pendingBackup && (
        <div 
          id="backup-import-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md text-neutral-200"
        >
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border-2 border-amber-500/30 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <CheckCircle className="w-7 h-7 shrink-0" />
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
                className="bg-rose-900/80 hover:bg-rose-900 border border-rose-600/40 text-rose-100 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center uppercase"
              >
                🗑️ {lang === "es" ? "Reemplazar" : "Replace"}
              </button>

              {/* Add/Merge Option */}
              <button
                id="btn-import-merge"
                onClick={handleImportAdd}
                className="bg-violet-950 hover:bg-violet-900 border border-violet-500/40 text-violet-100 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center uppercase"
              >
                ➕ {lang === "es" ? "Combinar" : "Merge"}
              </button>

              {/* Cancel Option */}
              <button
                id="btn-import-cancel"
                onClick={() => {
                  setPendingBackup(null);
                  setShowImportModal(false);
                }}
                className="bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-400 py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-center uppercase font-bold"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toast / Feedback Alert */}
      {toastMessage && (
        <div 
          id="app-global-toast"
          className={`fixed bottom-5 right-5 z-50 max-w-sm p-4 rounded-xl border-2 shadow-2xl animate-fade-in flex items-start gap-3 text-xs leading-relaxed ${
            toastMessage.type === "success" 
              ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-200" 
              : "bg-rose-950/95 border-rose-500/40 text-rose-200"
          }`}
        >
          <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${toastMessage.type === "success" ? "text-emerald-400" : "text-rose-400"}`} />
          <div className="flex-1 font-sans font-medium">{toastMessage.text}</div>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-base font-mono hover:text-amber-400 opacity-60 hover:opacity-100 transition-opacity ml-2 shrink-0 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
