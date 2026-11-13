/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Escuela» on the Perfil tab (owner, 13 November 2026): a student's year and class rank, an
// adult's teaching and subjects, and the clubs (moved from the notes tab, which is now the
// Bitácora). Only where things are shown changed; the stored fields are the same.
import React from "react";
import { Landmark, Plus, Trash } from "lucide-react";

import type { SheetContext } from "./useCharacterSheet";
import { CompassStarDivider } from "../AcademyOrnaments";
import { limitAttrs } from "../LimitHint";
import { SubjectList } from "../SubjectList";
import { Switch } from "../Toggle";

export function SchoolPanel({ ctx }: { ctx: SheetContext }) {
  const {
    character, t, characterType, writable, shown, canAdd, canRemove, edit, profile, addSubject, removeSubject,
    updateProfileField, isQuickEditing, newClubName, setNewClubName, handleAddClub, handleRemoveClub,
  } = ctx;
  const adult = characterType === "adult_wizard";
  return (
    <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2 space-y-4" id="detail-panel-escuela">
      <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest pb-1 flex items-center gap-2">
        <Landmark className="w-4 h-4 text-amber-400" />
        {t.secEscuela}
      </h3>
      <CompassStarDivider className="-mt-2 mb-3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isQuickEditing ? (
          <div className="grid grid-cols-2 gap-3 text-xs font-mono content-start">
            {!adult && (
              <>
                {shown("curso") && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.curso}</label>
                  <input
                    {...limitAttrs("character", "curso")}
                    type="text"
                    value={character.curso || ""}
                    disabled={!writable("curso")}
                    onChange={(e) => edit("curso", e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                )}

                {shown("puestoClase") && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.puestoClase}</label>
                  <input
                    {...limitAttrs("character", "puestoClase")}
                    type="text"
                    value={character.puestoClase || ""}
                    disabled={!writable("puestoClase")}
                    onChange={(e) => edit("puestoClase", e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                )}
              </>
            )}
            {adult && (
              <>
                {shown("adultWizardProfile/isTeacher") && (
                <div className="col-span-2">
                  <Switch id="edit-aw-is-teacher" checked={profile.isTeacher || false}
                    disabled={!writable("adultWizardProfile/isTeacher")}
                    onChange={(on) => updateProfileField("isTeacher", on)}
                    label={t.adultWizardIsTeacher}
                    labelClassName="text-[10px] text-neutral-300 font-sans font-bold uppercase tracking-wider" />
                </div>
                )}

                {profile.isTeacher && (
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardTeachingSubjects}</label>
                    <SubjectList
                      id="sheet-subjects"
                      items={profile.teachingSubjects ?? []}
                      editable={canAdd("adultWizardProfile/teachingSubjects")}
                      canRemove={(id) => canRemove("adultWizardProfile/teachingSubjects", id)}
                      onAdd={addSubject}
                      onRemove={removeSubject}
                      texts={{ placeholder: t.placeholderAddSubject, empty: t.labelNoSubjects, remove: t.removeSubject, add: t.addSubject }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-xs font-mono content-start">
            {!adult && (
              <>
                {shown("curso") && (
                <div>
                  <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.curso}</div>
                  <div className="text-neutral-200 mt-0.5">{character.curso || "—"}</div>
                </div>
                )}

                {shown("puestoClase") && (
                <div>
                  <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.puestoClase}</div>
                  <div className="text-neutral-200 mt-0.5">{character.puestoClase || "—"}</div>
                </div>
                )}
              </>
            )}
            {adult && (
              <>
                {shown("adultWizardProfile/isTeacher") && (
                <div>
                  <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardIsTeacher}</div>
                  <div className="text-neutral-200 mt-0.5">{profile.isTeacher ? t.yes : t.no}</div>
                </div>
                )}

                {profile.isTeacher && (
                  <div className="col-span-2">
                    <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardTeachingSubjects}</div>
                    <div className="mt-1">
                      <SubjectList id="sheet-subjects-read" items={profile.teachingSubjects ?? []} editable={false} onAdd={() => {}} onRemove={() => {}}
                        texts={{ placeholder: "", empty: t.labelNoSubjects, remove: t.removeSubject, add: t.addSubject }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Clubes */}
        <div className="space-y-3">
          <h4 className="font-magic text-[10px] text-amber-400 uppercase tracking-widest border-b border-violet-900/10 pb-1.5 font-bold flex items-center justify-between">
            <span>🛡️ {t.clubes}</span>
            <span className="text-[9px] font-mono text-neutral-500">{(character.clubesList || []).length}</span>
          </h4>

          {/* List First: Consultation Priority */}
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {character.clubesList && character.clubesList.length > 0 ? (
              character.clubesList.map((cl) => (
                <div
                  key={cl.id}
                  className="flex items-center justify-between bg-neutral-950/30 px-2.5 py-1.5 border border-neutral-900 rounded-lg group hover:border-violet-500/10 transition-all"
                >
                  <span className="text-xs text-neutral-200 font-sans break-words max-w-[80%]">{cl.nombre}</span>
                  {isQuickEditing && canRemove("clubesList", cl.id) && (
                    <button
                      id={`btn-del-club-${cl.id}`}
                      onClick={() => handleRemoveClub(cl.id)}
                      className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer opacity-80 hover:opacity-100 transition-colors"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[10px] font-mono text-neutral-600 italic select-none py-4 text-center">
                {t.emptyClubs}
              </p>
            )}
          </div>

          {/* Add Club Input Form */}
          {isQuickEditing && canAdd("clubesList") && (
            <div className="bg-neutral-950/20 p-2.5 border border-neutral-900/50 rounded-lg space-y-2 mt-2 animate-fade-in">
              <input
                {...limitAttrs("character", "clubesList/x/nombre", { path: "clubesList", count: (character.clubesList ?? []).length })}
                id="input-new-club"
                type="text"
                placeholder={t.placeholderClubes}
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
              />
              <button
                id="btn-add-club"
                onClick={handleAddClub}
                className="w-full py-1.5 bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/10 text-violet-300 hover:text-neutral-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.addClub}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
