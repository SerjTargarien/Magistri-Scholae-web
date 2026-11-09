/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "habilidades" tab, moved verbatim out of CharacterDetail.tsx (R3.4).
import React from "react";
import { catalogueName, missingSkills, skillName, skillsByCategory } from "../../model/catalogue";
import { Plus, X } from "lucide-react";
import { SkillPicker } from "../SkillPicker";
import { KnowledgeLevel } from "../KnowledgeLevel";

import type { SheetContext } from "./useCharacterSheet";

export function SkillsTab({ ctx }: { ctx: SheetContext }) {
  const {
    lang, catalogue, character, t, writable, canAdd, canRemove, isQuickEditing, newSkillNames, skillErrorCat,
    isGM, changeSkillValue, handleNewSkillNameChange, handleAddSkill, handleRemoveSkill, handlePickSkill, setSkillKnowledge,
  } = ctx;
  // The campaign catalogue's categories, in order; skills that do not apply (Magia intuitiva above 14) are left out.
  const groups = skillsByCategory(character.habilidades ?? [], catalogue, character);
  return (
          <div className="space-y-6 animate-fade-in" id="detail-tab-habilidades">
            {/* Split Skills by structural headings */}
            {groups.map(({ category, skills: matchedSkills }) => {
              const catKey = category.id;

              return (
                <div key={catKey} className="glass-panel p-6 rounded-xl border border-violet-500/15" id={`skill-block-${catKey}`}>
                  <div className="flex justify-between items-center border-b border-violet-500/10 pb-2 mb-4">
                    <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest flex items-center gap-2">
                      🛡️ {catalogueName(category.nombre, lang)}
                    </h3>
                  </div>

                  {/* Adding: the + list for everyone; typing a new skill is the GM's (owner decision, 8 November 2026) */}
                  {isQuickEditing && canAdd("habilidades") && (
                    <div className="mb-4 space-y-2">
                      {isGM && (<>
                      <div className="bg-neutral-950/40 p-3 rounded-xl border border-violet-500/10 flex gap-2 items-center" id={`add-skill-form-${catKey}`}>
                        <input
                          id={`input-new-skill-name-${catKey}`}
                          type="text"
                          placeholder={t.placeholderNewSkillName}
                          value={newSkillNames[catKey] || ""}
                          onChange={(e) => handleNewSkillNameChange(catKey, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill(catKey);
                            }
                          }}
                          className="flex-1 text-xs bg-neutral-900 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200"
                        />
                        <button
                          id={`btn-add-skill-${catKey}`}
                          type="button"
                          onClick={() => handleAddSkill(catKey)}
                          className="px-3 py-1.5 bg-violet-900 border border-violet-500/35 hover:bg-violet-800 text-violet-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="text-[10px]">{t.add}</span>
                        </button>
                      </div>
                      {skillErrorCat === catKey && (
                        <p className="text-[10px] font-mono text-rose-400 px-1">
                          {t.errSkillExists.replace("{name}", newSkillNames[catKey] || "")}
                        </p>
                      )}
                      </>)}
                      <SkillPicker categoryId={catKey} lang={lang} label={t.addSkillFromList}
                        missing={missingSkills(character.habilidades ?? [], catalogue, character, catKey)} onPick={handlePickSkill} />
                    </div>
                  )}

                  {matchedSkills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {matchedSkills.map((sk) => {
                        const displaySkillName = skillName(sk, catalogue, lang);
                        // Element IDs keep the Spanish name, as before.
                        const skillKey = skillName(sk, catalogue, "es");
                        const valor = sk.valor ?? 0;
                        const canChangeValue = isQuickEditing && writable(`habilidades/${sk.id}/valor`);
                        const removeButton = isQuickEditing && canRemove("habilidades", sk.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(sk.id)}
                                  className="w-6 h-6 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer border border-rose-500/10 p-0 mr-1"
                                  title={`${t.delete} ${displaySkillName}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                        );
                        const nameText = <span className="text-xs font-semibold text-neutral-200 block break-words">{displaySkillName}</span>;
                        const pips = (
                          <div className="flex gap-1">
                            {/* Small glowing pips indicating score weights */}
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`w-2 h-2 rounded-full ${i < valor ? "bg-amber-500 shadow-sm shadow-amber-500/50" : "bg-neutral-800"}`}
                              ></span>
                            ))}
                          </div>
                        );
                        const value = (
                            <div className="flex items-center gap-2">
                              {/* Decrement Key */}
                              {canChangeValue && (
                                <button
                                  id={`btn-skill-${skillKey}-minus`}
                                  onClick={() => changeSkillValue(sk.id, -1)}
                                  disabled={valor === 0}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center border font-mono font-black text-xs transition-colors cursor-pointer ${valor === 0
                                      ? "bg-neutral-900 border-neutral-950 text-neutral-700 cursor-not-allowed"
                                      : "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-rose-400"
                                    }`}
                                >
                                  -
                                </button>
                              )}
                              <span className="w-4 text-center font-mono font-bold text-amber-300 text-sm">
                                +{valor}
                              </span>
                              {/* Increment key */}
                              {canChangeValue && (
                                <button
                                  id={`btn-skill-${skillKey}-plus`}
                                  onClick={() => changeSkillValue(sk.id, 1)}
                                  disabled={valor === 5}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center border font-mono font-black text-xs transition-colors cursor-pointer ${valor === 5
                                      ? "bg-neutral-900 border-neutral-950 text-neutral-700 cursor-not-allowed"
                                      : "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-emerald-400"
                                    }`}
                                >
                                  +
                                </button>
                              )}
                            </div>
                        );
                        const knowledge = category.esoterica && (
                          <KnowledgeLevel skillId={sk.id} value={sk.conocimiento} lang={lang} onChange={level => setSkillKnowledge(sk.id, level)}
                            editable={isQuickEditing && writable(`habilidades/${sk.id}/conocimiento`)} />
                        );
                        // With a knowledge level chosen, two aligned lines: name and level, then dots and value
                        // (owner, 9 November 2026). Other skills keep the name and dots beside a centred value.
                        const leveled = category.esoterica && !!sk.conocimiento;
                        return (
                          <div
                            id={`skill-row-${skillKey}`}
                            key={sk.id}
                            className="bg-neutral-950/30 border border-neutral-900 px-3 py-2.5 rounded-xl flex items-center gap-1.5 shadow-inner"
                          >
                            {removeButton}
                            {leveled ? (
                              <div className="min-w-0 flex-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
                                {nameText}
                                <div className="justify-self-end">{knowledge}</div>
                                {pips}
                                <div className="justify-self-end">{value}</div>
                              </div>
                            ) : (
                              <>
                                <div className="min-w-0 flex-1">
                                  {nameText}
                                  <div className="mt-1">{pips}</div>
                                </div>
                                {/* An esoteric skill without a level offers «Ninguno» under the value in edit mode. */}
                                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                                  {value}
                                  {knowledge}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] font-mono text-neutral-500 text-center py-4 italic select-none">
                      {t.noSkillsInCategory}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
  );
}
