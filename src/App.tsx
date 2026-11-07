/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Character, Familiar, BackupData, CharacterType, VisualStyle } from "./types";
import { storage } from "./storage";
import { Language, TRANSLATIONS } from "./localization";
import { CharacterList } from "./components/CharacterList";
import { CharacterDetail } from "./components/CharacterDetail";
import { CharacterForm } from "./components/CharacterForm";
import { CharacterTypeSelect } from "./components/CharacterTypeSelect";
import { FamiliarEditor } from "./components/FamiliarEditor";
import { FamiliarDetail } from "./components/FamiliarDetail";
import { SettingsScreen } from "./components/SettingsScreen";
import { AcademyBackground } from "./components/AcademyOrnaments";
import { Sparkles, Loader, CheckCircle } from "lucide-react";

export default function App() {
  // Screens: LIST, DETAIL, FAMILIAR_DETAIL, TYPE_SELECT, FORM, FAMILIAR_EDITOR, SETTINGS
  const [screen, setScreen] = useState<"LIST" | "DETAIL" | "FAMILIAR_DETAIL" | "TYPE_SELECT" | "FORM" | "FAMILIAR_EDITOR" | "SETTINGS">("LIST");
  
  // Storage arrays & selections
  const [characters, setCharacters] = useState<Character[]>([]);
  const [familiars, setFamiliars] = useState<Familiar[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [selectedFamiliarId, setSelectedFamiliarId] = useState<string | null>(null);
  const [familiarEditorOrigin, setFamiliarEditorOrigin] = useState<"LIST" | "TYPE_SELECT" | "DETAIL" | "FAMILIAR_DETAIL">("TYPE_SELECT");
  const [newCharacterType, setNewCharacterType] = useState<CharacterType>("student");
  const [loading, setLoading] = useState<boolean>(true);

  // Localization Language State (Spanish default)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("magistri_scholae_lang");
    return (saved === "es" || saved === "en") ? saved : "es";
  });

  // Visual Style State ("academy" default, "classic" original)
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(() => {
    const saved = localStorage.getItem("magistri_scholae_style");
    return (saved === "academy" || saved === "classic") ? saved : "academy";
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
      const [allChars, allFamiliars] = await Promise.all([
        storage.characters.list(),
        storage.familiars.list(),
      ]);
      setCharacters(allChars);
      setFamiliars(allFamiliars);
    } catch (e) {
      console.error("Failed to load records:", e);
      setToastMessage({ type: "error", text: t.storageLoadError });
    } finally {
      setLoading(false);
    }
  };

  // Persist language choices
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("magistri_scholae_lang", newLang);
  };

  // Persist visual style choices
  const handleStyleChange = (newStyle: VisualStyle) => {
    setVisualStyle(newStyle);
    localStorage.setItem("magistri_scholae_style", newStyle);
  };

  // Find currently active chosen character and familiar
  const activeCharacter = characters.find((c) => c.id === selectedCharId) || null;
  const activeFamiliar = familiars.find((f) => f.id === selectedFamiliarId) || null;

  // Actions
  const handleSelectCharacter = (id: number) => {
    setSelectedCharId(id);
    setScreen("DETAIL");
  };

  const handleSelectFamiliar = (famId: string) => {
    setSelectedFamiliarId(famId);
    setScreen("FAMILIAR_DETAIL");
  };

  const handleAddCharacterClick = () => {
    setScreen("TYPE_SELECT");
  };

  const handleSaveForm = async (savedChar: Character) => {
    try {
      const saved = await storage.characters.save(savedChar);
      
      // Re-fetch and route
      await loadCharacters();
      setSelectedCharId(saved.id);
      setScreen("DETAIL");
    } catch (error) {
      console.error("Save failed:", error);
      setToastMessage({ type: "error", text: t.errorStoringStudent });
    }
  };

  const handleDeleteCharacter = async (id: number) => {
    try {
      await storage.characters.remove(id);
      await loadCharacters();
      setSelectedCharId(null);
      setScreen("LIST");
    } catch (error) {
      console.error("Delete failed:", error);
      setToastMessage({ type: "error", text: t.errorStoringStudent });
    }
  };

  const handleDeleteFamiliar = async (id: string) => {
    try {
      await storage.familiars.remove(id);
      await loadCharacters();
      setSelectedFamiliarId(null);
      setScreen("LIST");
      setToastMessage({ type: "success", text: t.familiarDeletedToast });
    } catch (error) {
      console.error("Delete failed:", error);
      setToastMessage({ type: "error", text: t.errorStoringStudent });
    }
  };

  const handleBondFamiliar = async (characterId: number, familiarId: string | null) => {
    try {
      await storage.bonds.assignCharacter(characterId, familiarId);
      await loadCharacters();
      setToastMessage({ type: "success", text: t.familiarSavedToast });
    } catch (error) {
      console.error("Bond failed:", error);
      setToastMessage({ type: "error", text: t.errorStoringStudent });
    }
  };

  const handleBondMaster = async (familiarId: string, characterId: number | null) => {
    try {
      await storage.bonds.assignFamiliar(familiarId, characterId);
      await loadCharacters();
      setToastMessage({ type: "success", text: t.familiarSavedToast });
    } catch (error) {
      console.error("Bond failed:", error);
      setToastMessage({ type: "error", text: t.errorStoringStudent });
    }
  };

  // Live in-page reactive propagation helpers
  const handleUpdateActiveCharacterState = (updatedChar: Character) => {
    setCharacters((prev) => prev.map((c) => (c.id === updatedChar.id ? updatedChar : c)));
  };

  const handleUpdateActiveFamiliarState = (updatedFam: Familiar) => {
    setFamiliars((prev) => prev.map((f) => (f.id === updatedFam.id ? updatedFam : f)));
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

  const applyImport = async (action: "add" | "replace") => {
    if (!pendingBackup) return;
    try {
      const result = await storage.backups.import(pendingBackup, action);
      setShowImportModal(false);
      setPendingBackup(null);
      await loadCharacters();
      setToastMessage({ type: "success", text: result.warnings.length
        ? t.importBondWarnings.replace("{n}", String(result.warnings.length))
        : t.importSuccess });
    } catch (error) {
      console.error("Import failed:", error);
      setToastMessage({ type: "error", text: action === "replace" ? t.backupErrorOverwriteMsg : t.backupErrorMergeMsg });
    }
  };
  const handleImportReplace = () => applyImport("replace");
  const handleImportAdd = () => applyImport("add");

  return (
    <div
      className="min-h-screen bg-[#0a0514] text-neutral-200 font-sans selection:bg-violet-900/50 selection:text-amber-300 pb-12"
      id="academy-app-root"
      data-style={visualStyle}
    >
      {storage.mode === "mock" && (
        <div id="mock-mode-banner" role="status" className="relative z-40 bg-amber-950 text-amber-100 border-b border-amber-500/40 px-4 py-2 text-center text-sm">
          {t.mockModeBanner}
        </div>
      )}
      {/* Dynamic Ambient Background Canvas */}
      {visualStyle === "academy" ? (
        <AcademyBackground />
      ) : (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0a0514]">
          {/* Indigo glow top left */}
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px]"></div>
          {/* Violet glow bottom right */}
          <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-violet-900/30 rounded-full blur-[120px]"></div>
        </div>
      )}

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
              visualStyle={visualStyle}
              characters={characters}
              familiars={familiars}
              onSelectCharacter={handleSelectCharacter}
              onSelectFamiliar={handleSelectFamiliar}
              onAddCharacter={handleAddCharacterClick}
              onOpenSettings={() => setScreen("SETTINGS")}
              onImportBackup={handleImportBackup}
              onShowToast={(type, text) => setToastMessage({ type, text })}
            />
          )}

          {screen === "DETAIL" && activeCharacter && (
            <CharacterDetail
              lang={lang}
              visualStyle={visualStyle}
              character={activeCharacter}
              familiars={familiars}
              onBack={() => {
                setSelectedCharId(null);
                setScreen("LIST");
              }}
              onDelete={handleDeleteCharacter}
              onUpdateCharacter={handleUpdateActiveCharacterState}
              onSelectFamiliar={handleSelectFamiliar}
              onBondFamiliar={handleBondFamiliar}
              onOpenCreateFamiliar={() => {
                setSelectedFamiliarId(null);
                setFamiliarEditorOrigin("DETAIL");
                setScreen("FAMILIAR_EDITOR");
              }}
            />
          )}

          {screen === "FAMILIAR_DETAIL" && activeFamiliar && (
            <FamiliarDetail
              lang={lang}
              visualStyle={visualStyle}
              familiar={activeFamiliar}
              characters={characters}
              onBack={() => {
                setSelectedFamiliarId(null);
                setScreen("LIST");
              }}
              onEditInEditor={(famId) => {
                setSelectedFamiliarId(famId);
                setFamiliarEditorOrigin("FAMILIAR_DETAIL");
                setScreen("FAMILIAR_EDITOR");
              }}
              onDelete={handleDeleteFamiliar}
              onUpdateFamiliar={handleUpdateActiveFamiliarState}
              onSelectCharacter={handleSelectCharacter}
              onBondMaster={handleBondMaster}
              onShowToast={(type, text) => setToastMessage({ type, text })}
            />
          )}

          {screen === "TYPE_SELECT" && (
            <CharacterTypeSelect
              lang={lang}
              onSelectType={(type) => {
                setNewCharacterType(type);
                setScreen("FORM");
              }}
              onOpenFamiliarEditor={() => {
                setSelectedFamiliarId(null);
                setFamiliarEditorOrigin("TYPE_SELECT");
                setScreen("FAMILIAR_EDITOR");
              }}
              onCancel={() => {
                setScreen("LIST");
              }}
            />
          )}

          {screen === "FAMILIAR_EDITOR" && (
            <FamiliarEditor
              lang={lang}
              visualStyle={visualStyle}
              initialFamiliarId={selectedFamiliarId}
              onFamiliarSaved={() => {
                loadCharacters();
              }}
              onFamiliarDeleted={() => {
                loadCharacters();
              }}
              onBack={() => {
                loadCharacters();
                if (familiarEditorOrigin === "FAMILIAR_DETAIL" && selectedFamiliarId) {
                  setScreen("FAMILIAR_DETAIL");
                } else if (familiarEditorOrigin === "DETAIL" && selectedCharId) {
                  setScreen("DETAIL");
                } else if (familiarEditorOrigin === "TYPE_SELECT") {
                  setSelectedFamiliarId(null);
                  setScreen("TYPE_SELECT");
                } else {
                  setSelectedFamiliarId(null);
                  setScreen("LIST");
                }
              }}
              onShowToast={(type, text) => setToastMessage({ type, text })}
            />
          )}

          {screen === "FORM" && (
            <CharacterForm
              lang={lang}
              newCharacterType={newCharacterType}
              onSave={handleSaveForm}
              onCancel={() => {
                setScreen("LIST");
              }}
            />
          )}

          {screen === "SETTINGS" && (
            <SettingsScreen
              lang={lang}
              visualStyle={visualStyle}
              onStyleChange={handleStyleChange}
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
                🗑️ {t.importReplace}
              </button>

              {/* Add/Merge Option */}
              <button
                id="btn-import-merge"
                onClick={handleImportAdd}
                className="bg-violet-950 hover:bg-violet-900 border border-violet-500/40 text-violet-100 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center uppercase"
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
                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-center uppercase font-bold"
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
