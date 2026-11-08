/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The creation form's "estres" tab, moved verbatim out of CharacterForm.tsx (R3.4).
import React from "react";
import { Activity } from "lucide-react";

import type { FormContext } from "./useCharacterForm";

export function FormStressTab({ ctx }: { ctx: FormContext }) {
  const { t, characterState, setStressMax, houseIconColor } = ctx;
  return (
            <div className="space-y-6 animate-fade-in" id="form-tabpanel-estres">
              <div className="flex items-center gap-1.5 border-b border-violet-500/10 pb-3">
                <Activity className={`w-5 h-5 ${houseIconColor}`} />
                <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                  {t.titleMaxStress}
                </h3>
              </div>

              {/* Stress track ranges controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Physical Limit block */}
                <div className="bg-neutral-950/45 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-1">
                    <span className="text-rose-400">💪</span>
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresFisico} ({t.labelMaximo})</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStressMax("estresFisicoMax", n => n - 1)}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      -
                    </button>
                    <input
                      id="input-range-phys-max"
                      type="number"
                      min="1"
                      max="10"
                      value={characterState.estresFisicoMax ?? ""}
                      onChange={(e) => setStressMax("estresFisicoMax", () => parseInt(e.target.value) || 5)}
                      className="flex-1 text-center font-mono font-bold text-amber-500 bg-neutral-900 text-xs py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setStressMax("estresFisicoMax", n => n + 1)}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Mental Limit block */}
                <div className="bg-neutral-950/45 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-1">
                    <span className="text-violet-400">🧠</span>
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresMental} ({t.labelMaximo})</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStressMax("estresMentalMax", n => n - 1)}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      -
                    </button>
                    <input
                      id="input-range-ment-max"
                      type="number"
                      min="1"
                      max="10"
                      value={characterState.estresMentalMax ?? ""}
                      onChange={(e) => setStressMax("estresMentalMax", () => parseInt(e.target.value) || 5)}
                      className="flex-1 text-center font-mono font-bold text-amber-500 bg-neutral-900 text-xs py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setStressMax("estresMentalMax", n => n + 1)}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Social Limit block */}
                <div className="bg-neutral-950/45 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-1">
                    <span className="text-indigo-400">🗣️</span>
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresSocial} ({t.labelMaximo})</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStressMax("estresSocialMax", n => n - 1)}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      -
                    </button>
                    <input
                      id="input-range-soc-max"
                      type="number"
                      min="1"
                      max="10"
                      value={characterState.estresSocialMax ?? ""}
                      onChange={(e) => setStressMax("estresSocialMax", () => parseInt(e.target.value) || 5)}
                      className="flex-1 text-center font-mono font-bold text-amber-500 bg-neutral-900 text-xs py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setStressMax("estresSocialMax", n => n + 1)}
                      className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700 cursor-pointer text-neutral-400"
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>

            </div>
  );
}
