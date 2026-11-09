/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The creation form's "habilidades" tab, moved verbatim out of CharacterForm.tsx (R3.4).
import React from "react";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { catalogueName, missingSkills, skillName, skillsByCategory, type SkillCategory } from "../../model/catalogue";
import { SkillPicker } from "../SkillPicker";
import { KnowledgeLevel } from "../KnowledgeLevel";

import type { FormContext } from "./useCharacterForm";

/** The emoji before each category heading (the old app's, for the categories it had). */
const CATEGORY_EMOJI: Record<string, string> = {
  fisicas: "🛡️ ",
  mentales: "🧠 ",
  sociales: "🗣️ ",
  "conocimientos-magicos": "📐 ",
};
const categoryHeading = (category: SkillCategory, lang: "es" | "en") =>
  (CATEGORY_EMOJI[category.id] ?? "🔮 ") + catalogueName(category.nombre, lang);

export function FormSkillsTab({ ctx }: { ctx: FormContext }) {
  const {
    lang, catalogue, t, characterState, characterType, inlineSkillNames, setInlineSkillNames, isGM,
    adjustSkillValue, skillError, setSkillError, handleAddInlineSkill, handleRemoveSkill, handlePickSkill, setSkillKnowledge,
    houseIconColor,
  } = ctx;
  const character = { characterType, edad: characterState.edad };
  const groups = skillsByCategory(characterState.habilidades ?? [], catalogue, { characterType, edad: characterState.edad });
  return (
            <div className="space-y-6 animate-fade-in" id="form-tabpanel-habilidades">
              <div className="flex items-center justify-between border-b border-violet-500/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <BookOpen className={`w-5 h-5 ${houseIconColor}`} />
                  <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                    {t.titleSkillsExpedient}
                  </h3>
                </div>
                <div className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
                  {t.labelCreationRange}
                </div>
              </div>

              {/* Grouped sections vertically */}
              {groups.map(({ category, skills: skillsInCategory }) => {
                const missing = missingSkills(characterState.habilidades ?? [], catalogue, character, category.id);
                return (
                  <div key={category.id} className="space-y-3 bg-neutral-950/30 p-4 border border-violet-500/5 rounded-xl">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-extrabold border-b border-neutral-800 pb-1">
                      {categoryHeading(category, lang)}
                    </h4>

                    {skillsInCategory.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {skillsInCategory.map((sk) => {
                          const displaySkillName = skillName(sk, catalogue, lang);
                          return (
                            <div
                              key={sk.id}
                              className="flex flex-col gap-1 bg-neutral-900/40 border border-neutral-800 px-3 py-1.5 rounded-lg hover:border-violet-500/10 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(sk.id)}
                                  className="text-neutral-500 hover:text-rose-400 p-0.5 transition-colors shrink-0 cursor-pointer"
                                  title={t.removeSkill}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[11px] font-sans text-neutral-300 font-bold break-words min-w-0 pr-1">
                                  {displaySkillName}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Decrement */}
                                <button
                                  type="button"
                                  onClick={() => adjustSkillValue(sk.id, -1)}
                                  disabled={(sk.valor ?? 0) <= 0}
                                  className="w-5 h-5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-800 text-[10px] font-mono text-neutral-400 flex items-center justify-center rounded cursor-pointer select-none"
                                >
                                  -
                                </button>
                                
                                {/* Score displaying filled points */}
                                <span className="text-[11px] min-w-[28px] font-mono font-bold text-center text-amber-400 bg-neutral-950 px-1 py-0.5 rounded border border-neutral-800">
                                  {sk.valor ?? 0}
                                </span>

                                {/* Increment */}
                                <button
                                  type="button"
                                  onClick={() => adjustSkillValue(sk.id, 1)}
                                  disabled={(sk.valor ?? 0) >= 5}
                                  className="w-5 h-5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-800 text-[10px] font-mono text-neutral-400 flex items-center justify-center rounded cursor-pointer select-none"
                                >
                                  +
                                </button>
                              </div>
                              </div>
                              {category.esoterica && (
                                <KnowledgeLevel skillId={sk.id} value={sk.conocimiento} lang={lang} editable onChange={level => setSkillKnowledge(sk.id, level)} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-500 italic">
                        {t.noSkillsInCategory}
                      </p>
                    )}

                    {/* Adding: the + list for everyone; typing a new skill is the GM's (owner decision, 8 November 2026) */}
                    {(isGM || missing.length > 0) && (
                    <div className="mt-4 pt-3 border-t border-neutral-900/40 flex flex-col gap-2 max-w-md">
                      {isGM && (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder={t.placeholderNewSkillCategory}
                          value={inlineSkillNames[category.id] || ""}
                          onChange={(e) => {
                            setInlineSkillNames(prev => ({ ...prev, [category.id]: e.target.value }));
                            if (skillError) setSkillError(null);
                          }}
                          className="flex-1 text-[11px] font-sans py-1 px-2.5 bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddInlineSkill(category);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddInlineSkill(category)}
                          className="p-1 px-3 bg-violet-900/60 hover:bg-violet-800 border border-violet-600/30 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-95"
                          title={t.addSkill}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      )}
                      <SkillPicker categoryId={category.id} lang={lang} label={t.addSkillFromList} missing={missing} onPick={handlePickSkill} />
                    </div>
                    )}
                  </div>
                );
              })}

              {/* Unique skill input active error display */}
              {skillError && (
                <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-rose-400 text-[10.5px] font-mono animate-fade-in">
                  ⚠️ {skillError}
                </div>
              )}
            </div>
  );
}
