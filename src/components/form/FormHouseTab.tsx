/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The creation form's "afiliacion" tab, moved verbatim out of CharacterForm.tsx (R3.4).
import React from "react";
import { HOUSES } from "../../data/gameData";
import { getLocalizedHouseLore } from "../../localization";
import { Award } from "lucide-react";
import { HouseCrest } from "../HouseCrest";
import type { House } from "../../model/sheet";

import type { FormContext } from "./useCharacterForm";

export function FormHouseTab({ ctx }: { ctx: FormContext }) {
  const { lang, t, characterState, handleHouseChange, houseIconColor } = ctx;
  return (
            <div className="space-y-6 animate-fade-in" id="form-tabpanel-afiliacion">
              <div className="flex items-center gap-1.5 border-b border-violet-500/10 pb-3">
                <Award className={`w-5 h-5 ${houseIconColor}`} />
                <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                  {t.titleHouseHeraldry}
                </h3>
              </div>

              {/* House select & mottos */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    {t.casa}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="grid-house-select">
                    {Object.keys(HOUSES).map((hKey) => {
                      const hInfo = HOUSES[hKey];
                      const hLore = getLocalizedHouseLore(hKey, lang);
                      const isChosen = (characterState.casa ?? "") === hKey;
                      return (
                        <button
                          id={`house-btn-${hKey}`}
                          key={hKey}
                          type="button"
                          onClick={() => handleHouseChange(hKey as House)}
                          className={`flex flex-col items-start p-4 bg-neutral-950/55 rounded-xl border text-left cursor-pointer transition-all ${
                            isChosen 
                              ? "border-amber-500/60 bg-violet-950/20 shadow-md ring-1 ring-amber-500/35" 
                              : "border-neutral-800 hover:border-neutral-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <HouseCrest house={hKey} className="w-7 h-8 shrink-0" />
                            <span className="font-magic font-bold text-xs uppercase tracking-wider text-amber-300">{hInfo.nombre}</span>
                          </div>
                          <span className="text-[9.5px]/relaxed font-mono mt-2 text-neutral-300 w-full block">
                            <strong>{t.labelProvenance}:</strong> {hLore.procedencia}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400 block mt-1">
                            <strong>{t.labelColors}:</strong> {hLore.colores}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400 block mt-1">
                            <strong>{t.labelElement}:</strong> {hLore.elemento} · <strong>{t.labelTotem}:</strong> {hLore.totem}
                          </span>
                          <span className="text-[9.5px]/relaxed font-serif text-amber-300/90 italic block mt-2 border-t border-neutral-800/70 pt-2 w-full">
                            {t.labelMotto}: “{hLore.lema}”
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
  );
}
