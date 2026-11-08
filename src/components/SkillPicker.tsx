// The + list of a skill category (owner decision, 8 November 2026): players add
// skills only from the campaign's catalogue; only the GM types new ones. Lists
// the category's catalogue skills the character does not have yet; picking one
// adds it at 0. Shared by the creation form and the character sheet.
import { useState } from "react";
import { Plus } from "lucide-react";
import { catalogueName, type CatalogueSkill } from "../model/catalogue";
import type { Language } from "../localization";

export function SkillPicker({ categoryId, missing, lang, label, onPick }: {
  categoryId: string; missing: CatalogueSkill[]; lang: Language; label: string; onPick: (skillId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!missing.length) return null;
  return (
    <div className="space-y-2">
      <button
        id={`btn-open-skill-list-${categoryId}`}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="px-3 py-1.5 bg-violet-900/60 hover:bg-violet-800 border border-violet-600/30 text-violet-100 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-3 h-3" />
        <span>{label}</span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5" id={`skill-list-${categoryId}`}>
          {missing.map(skill => (
            <button
              key={skill.id}
              id={`btn-pick-skill-${skill.id}`}
              type="button"
              onClick={() => onPick(skill.id)}
              className="px-2.5 py-1 bg-neutral-950/60 hover:bg-violet-950/60 border border-neutral-800 hover:border-violet-500/40 text-neutral-200 rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              {catalogueName(skill.nombre, lang)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
