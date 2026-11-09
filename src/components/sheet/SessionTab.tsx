/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "sesion" tab (R3.4): destiny gems up to 10, experience typeable in
// edit mode, stress tracks, and consequences with a severity.
import React, { useState } from "react";
import { Plus, Minus, Sparkles, Coins, X } from "lucide-react";

import type { ConsequenceList, SheetContext } from "./useCharacterSheet";
import type { ConsequenceEntry, Severity } from "../../model/sheet";
import { HIT, TagMenu } from "../TagMenu";

const SEVERITIES: Severity[] = ["leve", "moderada", "grave"];
const MIN_GEMS = 3;

/** Tag colours: mild is amber, moderate orange, severe rose. */
const SEVERITY_STYLE: Record<Severity, string> = {
  leve: "bg-amber-950/40 border-amber-500/40 text-amber-300",
  moderada: "bg-orange-950/50 border-orange-500/50 text-orange-300",
  grave: "bg-rose-950/60 border-rose-500/60 text-rose-300",
};

type Texts = SheetContext["t"];
const severityLabel = (t: Texts, severity: Severity) =>
  severity === "leve" ? t.severityLeve : severity === "moderada" ? t.severityModerada : t.severityGrave;

/** Experience as a box in edit mode: saved on Enter or when the box is left; Escape restores it. */
function ExperienceBox({ value, label, onCommit }: { value: number; label: string; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    if (draft !== "") onCommit(parseInt(draft, 10));
    setDraft(null);
  };
  return (
    <input
      id="input-exp"
      type="text"
      inputMode="numeric"
      maxLength={7}
      aria-label={label}
      value={draft ?? String(value)}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          setDraft(null);
        }
      }}
      className="w-24 text-center text-lg font-mono font-bold text-violet-400 bg-neutral-950 border border-neutral-700/60 rounded-lg px-1 py-0.5 focus:outline-none focus:border-violet-500"
    />
  );
}

/** A consequence's severity: a tag menu (Controls, control 7) for whoever may change it, a plain tag for readers. */
function SeverityTag({ id, value, editable, t, onChange }: {
  id: string; value: Severity | undefined; editable: boolean; t: Texts; onChange: (severity: Severity) => void;
}) {
  const hint = { leve: t.severityLeveHint, moderada: t.severityModeradaHint, grave: t.severityGraveHint };
  return (
    <TagMenu
      id={`tag-severity-${id}`}
      title={t.severity}
      value={value}
      emptyLabel={t.severityChoose}
      editable={editable}
      options={SEVERITIES.map((severity) => ({ value: severity, label: severityLabel(t, severity), hint: hint[severity], tone: SEVERITY_STYLE[severity] }))}
      onChange={onChange}
    />
  );
}

/** One track's consequences: the list with severities and, for whoever may add, the form. */
function Consequences({ ctx, list, short, title, empty, placeholder, inputClass, value, setValue, onAdd, onRemove }: {
  ctx: SheetContext; list: ConsequenceList; short: string; title: string; empty: string; placeholder: string;
  inputClass: string; value: string; setValue: (value: string) => void;
  onAdd: (text: string) => void; onRemove: (id: string) => void;
}) {
  const { character, t, writable, canAdd, canRemove, newSeverity, setNewSeverity, setConsequenceSeverity } = ctx;
  const entries: ConsequenceEntry[] = character[list] ?? [];
  const add = () => {
    onAdd(value);
    setValue("");
  };
  return (
    <div className="bg-neutral-950/40 p-4 border border-violet-500/10 rounded-xl space-y-3">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs text-neutral-300 uppercase block font-bold">{title}</span>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {entries.map((conseq) => (
            <div
              key={conseq.id}
              className="flex items-center justify-between gap-2 p-2 md:p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300"
            >
              <span className="break-words min-w-0 flex-1">“ {conseq.descripcion} ”</span>
              <div className="flex items-center gap-1.5 shrink-0 not-italic">
                <SeverityTag
                  id={conseq.id}
                  value={conseq.gravedad}
                  editable={writable(`${list}/${conseq.id}/gravedad`)}
                  t={t}
                  onChange={(severity) => setConsequenceSeverity(list, conseq.id, severity)}
                />
                {canRemove(list, conseq.id) && (
                  <button
                    type="button"
                    onClick={() => onRemove(conseq.id)}
                    className={`${HIT} w-8 h-8 flex items-center justify-center rounded-md text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer`}
                    title={t.removeConsequence}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] font-mono text-neutral-500 text-center select-none py-3 bg-neutral-950/10 border border-neutral-900/30 rounded-lg italic">
          {empty}
        </p>
      )}

      {canAdd(list) && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              id={`input-session-new-${short}-consequence`}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              className={`flex-1 min-w-0 text-xs ${inputClass} border border-neutral-700/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-neutral-200`}
            />
            <button
              id={`btn-session-add-${short}-consequence`}
              type="button"
              onClick={add}
              className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-violet-400 font-bold border border-neutral-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5" role="radiogroup" aria-label={t.severity}>
            {SEVERITIES.map((severity) => {
              const chosen = newSeverity[list] === severity;
              return (
                <button
                  key={severity}
                  id={`btn-session-severity-${short}-${severity}`}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  onClick={() => setNewSeverity(list, severity)}
                  className={`${HIT} min-h-7 text-[10px] font-mono font-bold uppercase tracking-wide border rounded-full px-3 transition-colors cursor-pointer ${chosen
                      ? SEVERITY_STYLE[severity]
                      : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                    }`}
                >
                  {severityLabel(t, severity)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SessionTab({ ctx }: { ctx: SheetContext }) {
  const {
    character, t, writable, shown, canAdd, canRemove, newTempAspect, setNewTempAspect, newPhysicalConsequence,
    setNewPhysicalConsequence, newMentalConsequence, setNewMentalConsequence, newSocialConsequence,
    setNewSocialConsequence, isQuickEditing, changeStat, setPxs, setDestinyPoints, setStress, changeMaxStress,
    handleAddTempAspect, handleRemoveTempAspect, handleAddPhysicalConsequence, handleRemovePhysicalConsequence,
    handleAddMentalConsequence, handleRemoveMentalConsequence, handleAddSocialConsequence, handleRemoveSocialConsequence,
  } = ctx;
  // Session controls work outside edit mode, for whoever may change the field.
  const canDestiny = writable("puntosDestino");
  const canPxs = writable("pxs");
  const destiny = character.puntosDestino || 0;
  // Three gems by default; each point above three adds one (up to 10, two rows of five).
  const gems = Array.from({ length: Math.max(MIN_GEMS, destiny) }, (_, i) => i + 1);
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
                      onClick={() => setDestinyPoints(destiny - 1)}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold flex items-center justify-center border border-neutral-700 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                      title={t.decreaseDestiny}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    {/* At most five gems a row (5 × 24px + 4 × 4px), so a phone shows ten as two rows. */}
                    <div className="flex flex-wrap items-center justify-center gap-1 min-w-0 max-w-[8.5rem]" id="destiny-gems-container">
                      {gems.map((num) => {
                        const isActive = destiny >= num;
                        return (
                          <button
                            key={num}
                            type="button"
                            disabled={!canDestiny}
                            onClick={() => setDestinyPoints(destiny === num ? num - 1 : num)}
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
                      onClick={() => setDestinyPoints(destiny + 1)}
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

                    {isQuickEditing && canPxs ? (
                      <ExperienceBox value={character.pxs ?? 0} label={t.pxs} onCommit={setPxs} />
                    ) : (
                      <span id="value-exp" className="min-w-8 px-1 text-center text-lg font-mono font-bold text-violet-400">
                        {character.pxs}
                      </span>
                    )}

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

                <Consequences
                  ctx={ctx} list="consecuenciasFisicas" short="phys" title={t.consecuenciasFisicas}
                  empty={t.labelConsecuenciasFisicasEmpty} placeholder={t.placeholderConsecuenciaFisica} inputClass="bg-neutral-950"
                  value={newPhysicalConsequence} setValue={setNewPhysicalConsequence}
                  onAdd={handleAddPhysicalConsequence} onRemove={handleRemovePhysicalConsequence}
                />
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

                <Consequences
                  ctx={ctx} list="consecuenciasMentales" short="mental" title={t.consecuenciasMentales}
                  empty={t.labelConsecuenciasMentalesEmpty} placeholder={t.placeholderConsecuenciaMental} inputClass="bg-neutral-950"
                  value={newMentalConsequence} setValue={setNewMentalConsequence}
                  onAdd={handleAddMentalConsequence} onRemove={handleRemoveMentalConsequence}
                />
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

                <Consequences
                  ctx={ctx} list="consecuenciasSociales" short="social" title={t.consecuenciasSociales}
                  empty={t.labelConsecuenciasSocialesEmpty} placeholder={t.placeholderConsecuenciaSocial} inputClass="bg-neutral-900"
                  value={newSocialConsequence} setValue={setNewSocialConsequence}
                  onAdd={handleAddSocialConsequence} onRemove={handleRemoveSocialConsequence}
                />
              </div>
            </div>

          </div>
  );
}
