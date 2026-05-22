/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Character } from "./types";
import { db } from "./db";
import { Language, TRANSLATIONS } from "./localization";
import { CharacterList } from "./components/CharacterList";
import { CharacterDetail } from "./components/CharacterDetail";
import { CharacterForm } from "./components/CharacterForm";
import { SettingsScreen } from "./components/SettingsScreen";
import { Sparkles, Loader } from "lucide-react";

export default function App() {
  // Screens: LIST, DETAIL, FORM, SETTINGS
  const [screen, setScreen] = useState<"LIST" | "DETAIL" | "FORM" | "SETTINGS">("LIST");
  
  // Storage arrays & selections
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Localization Language State (Spanish default)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("magistri_scholae_lang");
    return (saved === "es" || saved === "en") ? saved : "es";
  });

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
    setScreen("FORM");
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
      alert(lang === "es" ? "Error al guardar el alumno en la base de datos." : "Error storing student in the database.");
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
            {lang === "es" ? "Abriendo grimorio de la escuela..." : "Decrypting School Tomes..."}
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

          {screen === "FORM" && (
            <CharacterForm
              lang={lang}
              initialCharacter={editingCharacter}
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
    </div>
  );
}
