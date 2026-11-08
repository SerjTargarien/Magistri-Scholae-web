/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "sesion" tab, moved verbatim out of CharacterDetail.tsx (R3.4).
import React from "react";
import { Plus, Minus, Sparkles, Coins, X } from "lucide-react";

import type { SheetContext } from "./useCharacterSheet";

export function SessionTab({ ctx }: { ctx: SheetContext }) {
  const {
    character, t, writable, shown, canAdd, canRemove, newTempAspect, setNewTempAspect, newPhysicalConsequence,
    setNewPhysicalConsequence, newMentalConsequence, setNewMentalConsequence, newSocialConsequence,
    setNewSocialConsequence, isQuickEditing, changeStat, setDestinyPoints, setStress, changeMaxStress,
    handleAddTempAspect, handleRemoveTempAspect, handleAddPhysicalConsequence, handleRemovePhysicalConsequence,
    handleAddMentalConsequence, handleRemoveMentalConsequence, handleAddSocialConsequence, handleRemoveSocialConsequence,
  } = ctx;
  // Session controls work outside edit mode, for whoever may change the field.
  const canDestiny = writable("puntosDestino");
  const canPxs = writable("pxs");
  return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in" id="detail-tab-sesion">

            {/* Core Stats Adjustments */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-violet-400" />
                  {t.countersAndDestiny}
                </h3>

                {/* Destiny points control */}
                {shown("puntosDestino") && (
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl flex flex-col gap-3">
                  <div>
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">
                      {t.puntosDestino}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      id="btn-dest-minus"
                      disabled={!canDestiny}
                      onClick={() => setDestinyPoints((character.puntosDestino || 0) - 1)}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                      title={t.decreaseDestiny}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center justify-center gap-1.5 px-1.5 min-w-0" id="destiny-gems-container">
                      {[1, 2, 3, 4, 5].map((num) => {
                        const isActive = (character.puntosDestino || 0) >= num;
                        return (
                          <button
                            key={num}
                            type="button"
                            disabled={!canDestiny}
                            onClick={() => {
                              const currentPoints = character.puntosDestino || 0;
                              if (currentPoints === num) {
                                setDestinyPoints(num - 1);
                              } else {
                                setDestinyPoints(num);
                              }
                            }}
                            className={`transition-all duration-300 transform hover:scale-125 focus:outline-none cursor-pointer p-0.5 shrink-0 ${isActive
                                ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)] hover:text-amber-300"
                                : "text-neutral-800 hover:text-neutral-600"
                              }`}
                            title={`${t.puntosDestino}: ${num}`}
                          >
                            <Sparkles className={`w-5 h-5 ${isActive ? "fill-amber-400/20" : "fill-transparent"} transition-all`} />
                          </button>
                        );
                      })}
                    </div>

                    <button
                      id="btn-dest-plus"
                      disabled={!canDestiny}
                      onClick={() => setDestinyPoints((character.puntosDestino || 0) + 1)}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                      title={t.increaseDestiny}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                )}

                {/* Experience control */}
                {shown("pxs") && (
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl flex flex-col gap-3">
                  <div>
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">
                      {t.pxs}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      id="btn-exp-minus"
                      disabled={!canPxs}
                      onClick={() => changeStat("pxs", -1)}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-violet-400 cursor-pointer shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-8 text-center text-lg font-mono font-bold text-violet-400">
                      {character.pxs}
                    </span>

                    <button
                      id="btn-exp-plus"
                      disabled={!canPxs}
                      onClick={() => changeStat("pxs", 1)}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-violet-400 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                )}

                {/* Dynamic Temporary Aspects List */}
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{t.aspectoTemporal}</span>
                  </div>

                  {/* Aspects List */}
                  {(() => {
                    const tempAspects = character.aspectoTemporal ?? [];
                    return tempAspects.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {tempAspects.map((aspect) => (
                          <div
                            key={aspect.id}
                            className="flex items-center justify-between p-2 md:p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300"
                          >
                            <span className="break-words max-w-[85%]">“ {aspect.value} ”</span>
                            {canRemove("aspectoTemporal", aspect.id) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTempAspect(aspect.id)}
                              className="text-neutral-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title={t.deleteAspect}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-3 bg-neutral-950/10 border border-neutral-900/30 rounded-lg italic">
                        {t.labelAspectosTemporalesEmpty}
                      </p>
                    );
                  })()}

                  {/* Aspect Form */}
                  {canAdd("aspectoTemporal") && (
                  <div className="flex gap-2">
                    <input
                      id="input-session-new-temp-aspect"
                      type="text"
                      placeholder={t.placeholderAspectoTemporal}
                      value={newTempAspect}
                      onChange={(e) => setNewTempAspect(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTempAspect(newTempAspect);
                          setNewTempAspect("");
                        }
                      }}
                      className="flex-1 text-xs bg-neutral-900 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200"
                    />
                    <button
                      id="btn-session-add-temp-aspect"
                      type="button"
                      onClick={() => {
                        handleAddTempAspect(newTempAspect);
                        setNewTempAspect("");
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-violet-400 font-bold border border-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stress track Controls - Physical */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                  💪 {t.estresFisico}
                </h3>

                {/* Physical track box */}
                {shown("estresFisico") && (
                <div className="p-4 bg-neutral-950/40 rounded-xl border border-violet-900/10 space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-neutral-300">{t.estresFisico}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500">{character.estresFisico}/{character.estresFisicoMax}</span>
                      {isQuickEditing && writable("estresFisicoMax") && (
                        <div className="flex items-center gap-1 ml-1 bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800">
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresFisicoMax", "estresFisico", -1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            -
                          </button>
                          <span className="text-[10px] text-neutral-300">Max</span>
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresFisicoMax", "estresFisico", 1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Visual grid checkboxes */}
                  <div className="flex flex-wrap gap-2 justify-center items-center">
                    <button
                      id="stress-phys-box-0"
                      disabled={!writable("estresFisico")}
                      onClick={() => setStress("estresFisico", 0)}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${character.estresFisico === 0
                          ? "bg-rose-950/30 border-rose-500/40 text-rose-300 shadow-inner"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        }`}
                      title={t.noStress}
                    >
                      0
                    </button>
                    {Array.from({ length: character.estresFisicoMax ?? 0 }).map((_, idx) => {
                      const count = idx + 1;
                      const isChecked = (character.estresFisico ?? 0) >= count;
                      return (
                        <button
                          id={`stress-phys-box-${count}`}
                          key={idx}
                          disabled={!writable("estresFisico")}
                          onClick={() => setStress("estresFisico", count)}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${isChecked
                              ? "bg-rose-950/80 border-rose-500 text-rose-300 shadow-inner"
                              : "bg-neutral-900 border-neutral-800 text-neutral-600 hover:border-neutral-700"
                            }`}
                        >
                          {count}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                    <span>{t.labelSalud}</span>
                    <span className="text-rose-400 font-bold">{t.labelHerido}</span>
                  </div>
                </div>
                )}

                {/* Dynamic Physical Consequences */}
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{t.consecuenciasFisicas}</span>
                  </div>

                  {/* Consequences List */}
                  {(() => {
                    const physCons = character.consecuenciasFisicas ?? [];
                    return physCons.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {physCons.map((conseq) => (
                          <div
                            key={conseq.id}
                            className="flex items-center justify-between p-2 md:p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300"
                          >
                            <span className="break-words max-w-[85%]">“ {conseq.descripcion} ”</span>
                            {canRemove("consecuenciasFisicas", conseq.id) && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhysicalConsequence(conseq.id)}
                              className="text-neutral-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title={t.removeConsequence}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-3 bg-neutral-950/10 border border-neutral-900/30 rounded-lg italic">
                        {t.labelConsecuenciasFisicasEmpty}
                      </p>
                    );
                  })()}

                  {/* Consequence Form */}
                  {canAdd("consecuenciasFisicas") && (
                  <div className="flex gap-2">
                    <input
                      id="input-session-new-phys-consequence"
                      type="text"
                      placeholder={t.placeholderConsecuenciaFisica}
                      value={newPhysicalConsequence}
                      onChange={(e) => setNewPhysicalConsequence(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPhysicalConsequence(newPhysicalConsequence);
                          setNewPhysicalConsequence("");
                        }
                      }}
                      className="flex-1 text-xs bg-neutral-950 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200"
                    />
                    <button
                      id="btn-session-add-phys-consequence"
                      type="button"
                      onClick={() => {
                        handleAddPhysicalConsequence(newPhysicalConsequence);
                        setNewPhysicalConsequence("");
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-violet-400 font-bold border border-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stress track control - Mental */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                  🧠 {t.estresMental}
                </h3>

                {shown("estresMental") && (
                <div className="p-4 bg-neutral-950/40 rounded-xl border border-violet-900/10 space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-neutral-300">{t.estresMental}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500">{character.estresMental}/{character.estresMentalMax}</span>
                      {isQuickEditing && writable("estresMentalMax") && (
                        <div className="flex items-center gap-1 ml-1 bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800">
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresMentalMax", "estresMental", -1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            -
                          </button>
                          <span className="text-[10px] text-neutral-300">Max</span>
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresMentalMax", "estresMental", 1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual grid checkboxes */}
                  <div className="flex flex-wrap gap-2 justify-center items-center">
                    <button
                      id="stress-mental-box-0"
                      disabled={!writable("estresMental")}
                      onClick={() => setStress("estresMental", 0)}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${character.estresMental === 0
                          ? "bg-violet-950/30 border-violet-500/40 text-violet-300 shadow-inner"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        }`}
                      title={t.noStress}
                    >
                      0
                    </button>
                    {Array.from({ length: character.estresMentalMax ?? 0 }).map((_, idx) => {
                      const count = idx + 1;
                      const isChecked = (character.estresMental ?? 0) >= count;
                      return (
                        <button
                          id={`stress-mental-box-${count}`}
                          key={idx}
                          disabled={!writable("estresMental")}
                          onClick={() => setStress("estresMental", count)}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${isChecked
                              ? "bg-violet-950/80 border-violet-500 text-violet-300 shadow-inner"
                              : "bg-neutral-900 border-neutral-800 text-neutral-600 hover:border-neutral-700"
                            }`}
                        >
                          {count}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                    <span>{t.labelCordura}</span>
                    <span className="text-violet-400 font-bold">{t.labelLocura}</span>
                  </div>
                </div>
                )}

                {/* Dynamic Mental Consequences */}
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{t.consecuenciasMentales}</span>
                  </div>

                  {/* Consequences List */}
                  {(() => {
                    const mentalCons = character.consecuenciasMentales ?? [];
                    return mentalCons.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {mentalCons.map((conseq) => (
                          <div
                            key={conseq.id}
                            className="flex items-center justify-between p-2 md:p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300"
                          >
                            <span className="break-words max-w-[85%]">“ {conseq.descripcion} ”</span>
                            {canRemove("consecuenciasMentales", conseq.id) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMentalConsequence(conseq.id)}
                              className="text-neutral-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title={t.removeConsequence}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-3 bg-neutral-950/10 border border-neutral-900/30 rounded-lg italic">
                        {t.labelConsecuenciasMentalesEmpty}
                      </p>
                    );
                  })()}

                  {/* Consequence Form */}
                  {canAdd("consecuenciasMentales") && (
                  <div className="flex gap-2">
                    <input
                      id="input-session-new-mental-consequence"
                      type="text"
                      placeholder={t.placeholderConsecuenciaMental}
                      value={newMentalConsequence}
                      onChange={(e) => setNewMentalConsequence(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMentalConsequence(newMentalConsequence);
                          setNewMentalConsequence("");
                        }
                      }}
                      className="flex-1 text-xs bg-neutral-950 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200"
                    />
                    <button
                      id="btn-session-add-mental-consequence"
                      type="button"
                      onClick={() => {
                        handleAddMentalConsequence(newMentalConsequence);
                        setNewMentalConsequence("");
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-violet-400 font-bold border border-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stress track Control - Social */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
                  🗣️ {t.estresSocial}
                </h3>

                {/* Social track box */}
                {shown("estresSocial") && (
                <div className="p-4 bg-neutral-950/40 rounded-xl border border-violet-900/10 space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-neutral-300">{t.estresSocial}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500">{character.estresSocial}/{character.estresSocialMax}</span>
                      {isQuickEditing && writable("estresSocialMax") && (
                        <div className="flex items-center gap-1 ml-1 bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800">
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresSocialMax", "estresSocial", -1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            -
                          </button>
                          <span className="text-[10px] text-neutral-300">Max</span>
                          <button
                            type="button"
                            onClick={() => changeMaxStress("estresSocialMax", "estresSocial", 1)}
                            className="text-neutral-400 hover:text-amber-400 px-1 cursor-pointer"
                            title={t.labelMaximo}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Visual grid checkboxes */}
                  <div className="flex flex-wrap gap-2 justify-center items-center">
                    <button
                      id="stress-soc-box-0"
                      disabled={!writable("estresSocial")}
                      onClick={() => setStress("estresSocial", 0)}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${character.estresSocial === 0
                          ? "bg-indigo-950/30 border-indigo-500/40 text-indigo-300 shadow-inner"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        }`}
                      title={t.noStress}
                    >
                      0
                    </button>
                    {Array.from({ length: character.estresSocialMax ?? 0 }).map((_, idx) => {
                      const count = idx + 1;
                      const isChecked = (character.estresSocial ?? 0) >= count;
                      return (
                        <button
                          id={`stress-soc-box-${count}`}
                          key={idx}
                          disabled={!writable("estresSocial")}
                          onClick={() => setStress("estresSocial", count)}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${isChecked
                              ? "bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-inner"
                              : "bg-neutral-900 border-neutral-800 text-neutral-600 hover:border-neutral-700"
                            }`}
                        >
                          {count}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                    <span>{t.labelSereno}</span>
                    <span className="text-indigo-400 font-bold">{t.labelAislado}</span>
                  </div>
                </div>
                )}

                {/* Dynamic Social Consequences */}
                <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{t.consecuenciasSociales}</span>
                  </div>

                  {/* Consequences List */}
                  {(() => {
                    const socialCons = character.consecuenciasSociales ?? [];
                    return socialCons.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {socialCons.map((conseq) => (
                          <div
                            key={conseq.id}
                            className="flex items-center justify-between p-2 md:p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300"
                          >
                            <span className="break-words max-w-[85%]">“ {conseq.descripcion} ”</span>
                            {canRemove("consecuenciasSociales", conseq.id) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSocialConsequence(conseq.id)}
                              className="text-neutral-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title={t.removeConsequence}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-3 bg-neutral-950/10 border border-neutral-900/30 rounded-lg italic">
                        {t.labelConsecuenciasSocialesEmpty}
                      </p>
                    );
                  })()}

                  {/* Consequence Form */}
                  {canAdd("consecuenciasSociales") && (
                  <div className="flex gap-2">
                    <input
                      id="input-session-new-social-consequence"
                      type="text"
                      placeholder={t.placeholderConsecuenciaSocial}
                      value={newSocialConsequence}
                      onChange={(e) => setNewSocialConsequence(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSocialConsequence(newSocialConsequence);
                          setNewSocialConsequence("");
                        }
                      }}
                      className="flex-1 text-xs bg-neutral-900 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200"
                    />
                    <button
                      id="btn-session-add-social-consequence"
                      type="button"
                      onClick={() => {
                        handleAddSocialConsequence(newSocialConsequence);
                        setNewSocialConsequence("");
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-violet-400 font-bold border border-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  )}
                </div>
              </div>
            </div>

          </div>
  );
}
