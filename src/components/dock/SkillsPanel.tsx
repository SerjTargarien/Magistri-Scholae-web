/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Habilidades de la campaña» as a side panel (owner, 16 November 2026; product-design.md 10e):
// the campaign's skill list to consult beside a sheet, by category, with «Inicial» and age limits.
// Changing the list stays on its own screen («Editar la lista»), where changes are saved together.
import React from "react";
import { Pencil } from "lucide-react";
import { catalogueName, type SkillCatalogue } from "../../model/catalogue";
import { CAMPAIGN_SKILLS_TEXT, type Language } from "../../localization";

export function SkillsPanel({ lang, catalogue, editLabel, onEdit }: { lang: Language; catalogue: SkillCatalogue; editLabel: string; onEdit?: () => void }) {
  const s = CAMPAIGN_SKILLS_TEXT[lang];
  const categories = catalogue.categorias.filter(c => !c.archivada);
  return (
    <>
      <div className="grid gap-0.5 max-h-[55vh] overflow-y-auto pr-1" id="skills-panel-list">
        {categories.map(category => {
          const skills = catalogue.habilidades.filter(skill => skill.categoria === category.id && !skill.archivada);
          if (!skills.length) return null;
          return (
            <div key={category.id} className="grid">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-400 px-1 pt-2.5 pb-1">{catalogueName(category.nombre, lang)}</div>
              {skills.map(skill => (
                <div key={skill.id} className="flex items-baseline justify-between gap-2 px-1 py-1.5 border-b border-violet-500/10 text-[13px] text-neutral-100">
                  <span className="min-w-0 break-words">{catalogueName(skill.nombre, lang)}</span>
                  <span className="shrink-0 font-mono text-[10px] text-neutral-400 text-right">
                    {[skill.inicial !== false ? s.initial : "", skill.edadMaxima ? s.ageLimit.replace("{age}", String(skill.edadMaxima)) : ""].filter(Boolean).join(" · ")}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {onEdit && (
        <div>
          <button type="button" id="btn-skills-panel-edit" onClick={onEdit}
            className="inline-flex items-center gap-1.5 min-h-8 px-2.5 rounded-lg border border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-neutral-200 text-[11px] font-bold cursor-pointer hover:border-[#f3d88c]">
            <Pencil className="w-3.5 h-3.5 text-amber-400" />{editLabel}
          </button>
        </div>
      )}
    </>
  );
}
