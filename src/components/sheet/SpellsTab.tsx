/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "hechizos" tab, moved verbatim out of CharacterDetail.tsx (R3.4).
import React from "react";
import { Trash } from "lucide-react";

import type { SheetContext } from "./useCharacterSheet";
import { limitAttrs } from "../LimitHint";
import { Switch } from "../Toggle";

export function SpellsTab({ ctx }: { ctx: SheetContext }) {
  const {
    character, t, canAdd, canRemove, newSpellName, setNewSpellName, newSpellVal, setNewSpellVal, newSpellSpec,
    setNewSpellSpec, newPotionName, setNewPotionName, newPotionVal, setNewPotionVal, newPotionSpec, setNewPotionSpec,
    isQuickEditing, addSpell, removeSpell, addPotion, removePotion,
  } = ctx;
  return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" id="detail-tab-hechizos">

            {/* Spells Panel */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6">
              <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                ⚡ {t.grimoireOfSpells}
              </h3>

              {/* Spells list display */}
              <div className="space-y-2">
                {character.conjuros && character.conjuros.length > 0 ? (
                  character.conjuros.map((sp) => (
                    <div
                      key={sp.id}
                      className="flex justify-between items-center bg-neutral-950/20 px-3 py-2 border border-neutral-900 rounded-lg"
                    >
                      <div>
                        <span className="text-xs font-semibold text-neutral-200">{sp.nombre}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-mono uppercase bg-neutral-800 text-neutral-400 px-1 py-0.5 rounded">
                            {t.labelDificultad} {sp.valor}
                          </span>
                          {sp.specialized && (
                            <span className="text-[9px] font-mono uppercase bg-violet-950 text-violet-300 font-bold px-1 py-0.5 rounded border border-violet-500/10">
                              {t.specialized}
                            </span>
                          )}
                        </div>
                      </div>
                      {isQuickEditing && canRemove("conjuros", sp.id) && (
                        <button
                          id={`btn-del-spell-${sp.id}`}
                          onClick={() => removeSpell(sp.id)}
                          className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-mono text-neutral-600 text-center select-none py-6">
                    {t.labelSpellsEmpty}
                  </p>
                )}
              </div>

              {/* Add form */}
              {isQuickEditing && canAdd("conjuros") && (
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3 animate-fade-in">
                  <h4 className="text-[10px] font-mono text-neutral-400 uppercase font-black tracking-wide flex items-center gap-1.5">
                    <span>✨</span> {t.registerNewSpell}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      {...limitAttrs("character", "conjuros/x/nombre", { path: "conjuros", count: (character.conjuros ?? []).length })}
                      id="input-spell-name"
                      type="text"
                      placeholder={t.placeholderConjuroName}
                      value={newSpellName}
                      onChange={(e) => setNewSpellName(e.target.value)}
                      className="text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    />
                    <select
                      id="select-spell-val"
                      value={newSpellVal}
                      onChange={(e) => setNewSpellVal(parseInt(e.target.value) || 1)}
                      className="text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    >
                      <option value="1">{t.labelDificultad} I</option>
                      <option value="2">{t.labelDificultad} II</option>
                      <option value="3">{t.labelDificultad} III</option>
                      <option value="4">{t.labelDificultad} IV</option>
                      <option value="5">{t.labelDificultad} V</option>
                    </select>
                    <Switch id="checkbox-spell-spec" inline checked={newSpellSpec} onChange={setNewSpellSpec}
                      label={t.specialized} labelClassName="text-xs text-neutral-300" />
                  </div>
                  <button
                    id="btn-add-spell"
                    onClick={addSpell}
                    className="w-full py-1.5 bg-violet-900 hover:bg-violet-800 border border-violet-600 text-violet-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                  >
                    {t.register}
                  </button>
                </div>
              )}
            </div>

            {/* Potions Panel */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6">
              <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                🧪 {t.catalogOfPotions}
              </h3>

              {/* Potions list display */}
              <div className="space-y-2">
                {character.pociones && character.pociones.length > 0 ? (
                  character.pociones.map((po) => (
                    <div
                      key={po.id}
                      className="flex justify-between items-center bg-neutral-950/20 px-3 py-2 border border-neutral-900 rounded-lg"
                    >
                      <div>
                        <span className="text-xs font-semibold text-neutral-200">{po.nombre}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-mono uppercase bg-neutral-800 text-neutral-400 px-1 py-0.5 rounded">
                            {t.labelDificultad} {po.valor}
                          </span>
                          {po.specialized && (
                            <span className="text-[9px] font-mono uppercase bg-violet-950 text-violet-300 font-bold px-1 py-0.5 rounded border border-violet-500/10">
                              {t.specialized}
                            </span>
                          )}
                        </div>
                      </div>
                      {isQuickEditing && canRemove("pociones", po.id) && (
                        <button
                          id={`btn-del-potion-${po.id}`}
                          onClick={() => removePotion(po.id)}
                          className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-mono text-neutral-600 text-center select-none py-6">
                    {t.labelPotionsEmpty}
                  </p>
                )}
              </div>

              {/* Add form */}
              {isQuickEditing && canAdd("pociones") && (
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3 animate-fade-in">
                  <h4 className="text-[10px] font-mono text-neutral-400 uppercase font-black tracking-wide flex items-center gap-1.5">
                    <span>🧪</span> {t.registerNewPotion}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      {...limitAttrs("character", "pociones/x/nombre", { path: "pociones", count: (character.pociones ?? []).length })}
                      id="input-potion-name"
                      type="text"
                      placeholder={t.placeholderPocionName}
                      value={newPotionName}
                      onChange={(e) => setNewPotionName(e.target.value)}
                      className="text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    />
                    <select
                      id="select-potion-val"
                      value={newPotionVal}
                      onChange={(e) => setNewPotionVal(parseInt(e.target.value) || 1)}
                      className="text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
                    >
                      <option value="1">{t.labelDificultad} I</option>
                      <option value="2">{t.labelDificultad} II</option>
                      <option value="3">{t.labelDificultad} III</option>
                      <option value="4">{t.labelDificultad} IV</option>
                      <option value="5">{t.labelDificultad} V</option>
                    </select>
                    <Switch id="checkbox-potion-spec" inline checked={newPotionSpec} onChange={setNewPotionSpec}
                      label={t.specialized} labelClassName="text-xs text-neutral-300" />
                  </div>
                  <button
                    id="btn-add-potion"
                    onClick={addPotion}
                    className="w-full py-1.5 bg-violet-900 hover:bg-violet-800 border border-violet-600 text-violet-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                  >
                    {t.register}
                  </button>
                </div>
              )}
            </div>

          </div>
  );
}
