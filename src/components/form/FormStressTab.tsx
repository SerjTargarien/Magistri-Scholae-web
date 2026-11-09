/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The creation form's "estres" tab, moved verbatim out of CharacterForm.tsx (R3.4).
import React from "react";
import { Activity } from "lucide-react";

import type { FormContext } from "./useCharacterForm";
import { Stepper } from "../Stepper";
import { ruleAt } from "../../model/rules";

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
                  <div className="flex justify-center"><Stepper id="input-range-phys-max" label={`${t.estresFisico} (${t.labelMaximo})`} min={1} max={ruleAt("character", "estresFisicoMax")?.maximum ?? 10} value={characterState.estresFisicoMax ?? 3} onChange={(v) => setStressMax("estresFisicoMax", () => v)} /></div>
                </div>

                {/* Mental Limit block */}
                <div className="bg-neutral-950/45 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-1">
                    <span className="text-violet-400">🧠</span>
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresMental} ({t.labelMaximo})</h4>
                  </div>
                  <div className="flex justify-center"><Stepper id="input-range-ment-max" label={`${t.estresMental} (${t.labelMaximo})`} min={1} max={ruleAt("character", "estresMentalMax")?.maximum ?? 10} value={characterState.estresMentalMax ?? 3} onChange={(v) => setStressMax("estresMentalMax", () => v)} /></div>
                </div>

                {/* Social Limit block */}
                <div className="bg-neutral-950/45 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-1">
                    <span className="text-indigo-400">🗣️</span>
                    <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase">{t.estresSocial} ({t.labelMaximo})</h4>
                  </div>
                  <div className="flex justify-center"><Stepper id="input-range-soc-max" label={`${t.estresSocial} (${t.labelMaximo})`} min={1} max={ruleAt("character", "estresSocialMax")?.maximum ?? 10} value={characterState.estresSocialMax ?? 3} onChange={(v) => setStressMax("estresSocialMax", () => v)} /></div>
                </div>

              </div>

            </div>
  );
}
