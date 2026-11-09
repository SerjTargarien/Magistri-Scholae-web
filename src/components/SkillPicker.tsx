// The + list of a skill category (owner decision, 8 November 2026): players add
// skills only from the campaign's catalogue; only the GM types new ones. Lists
// the category's catalogue skills the character does not have yet; picking one
// adds it at 0. Shared by the creation form and the character sheet.
import { useState } from "react";
import { Plus } from "lucide-react";
import { catalogueName, type CatalogueSkill } from "../model/catalogue";
import { TRANSLATIONS, type Language } from "../localization";
import { Picker, pickerTexts } from "./Picker";

export function SkillPicker({ categoryId, missing, lang, label, onPick }: {
  categoryId: string; missing: CatalogueSkill[]; lang: Language; label: string; onPick: (skillId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!missing.length) return null;
  const t = TRANSLATIONS[lang];
  return (
    <>
      <button
        id={`btn-open-skill-list-${categoryId}`}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-violet-900/60 hover:bg-violet-800 border border-violet-600/30 text-violet-100 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-3 h-3" />
        <span>{label}</span>
      </button>
      {open && (
        <Picker
          id={`skill-list-${categoryId}`}
          title={label}
          multiple
          items={missing.map((skill) => ({ id: skill.id, label: catalogueName(skill.nombre, lang) }))}
          onDone={(ids) => { ids.forEach(onPick); setOpen(false); }}
          onClose={() => setOpen(false)}
          texts={pickerTexts(t)}
        />
      )}
    </>
  );
}
