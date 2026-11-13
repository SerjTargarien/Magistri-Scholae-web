/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Escuela» on the «Institución» tab (owner, 13 November 2026): laid out like the house card,
// the school's crest and name on the left, the character's place in it on the right (a
// student's year and class rank; an adult's institution, role and teaching), then the
// subjects and the clubs. Until R5 the crest is the app's and a student's school is the
// campaign's; R5 gives each institution its own name and crest. No stored field changed.
import React from "react";
import { Landmark, Plus, X } from "lucide-react";

import type { SheetContext } from "./useCharacterSheet";
import { CompassStarDivider, FiligreeCorner } from "../AcademyOrnaments";
import { limitAttrs } from "../LimitHint";
import { SubjectList } from "../SubjectList";
import { HIT } from "../TagMenu";
import { Switch } from "../Toggle";

const BOX = "w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none";
const EDIT_LABEL = "text-[9px] text-amber-500 uppercase font-bold tracking-wider font-mono";
const READ_LABEL = "text-[9px] text-neutral-400 uppercase tracking-widest font-mono mb-1 flex items-center gap-1.5";

export function SchoolPanel({ ctx }: { ctx: SheetContext }) {
  const {
    character, t, characterType, writable, shown, canAdd, canRemove, edit, profile, addSubject, removeSubject,
    updateProfileField, isQuickEditing, newClubName, setNewClubName, handleAddClub, handleRemoveClub,
  } = ctx;
  const adult = characterType === "adult_wizard";
  const schoolName = adult ? (profile.institution || "—") : t.appName;

  /** One value on the right of the crest: a box in edit mode, the Lema's larger serif otherwise. */
  const fact = (path: string, label: string, value: string, onChange: (v: string) => void) =>
    shown(path) && (
      <div key={path} className="min-w-0">
        {isQuickEditing ? (
          <label className="flex flex-col gap-1 text-xs font-mono">
            <span className={EDIT_LABEL}>{label}</span>
            <input {...limitAttrs("character", path)} type="text" value={value} disabled={!writable(path)}
              onChange={(e) => onChange(e.target.value)} className={BOX} />
          </label>
        ) : (
          <>
            <div className={READ_LABEL}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 inline-block" />
              {label}
            </div>
            <div className="font-serif italic text-base sm:text-lg text-amber-200 leading-snug break-words">{value || "—"}</div>
          </>
        )}
      </div>
    );

  return (
    <div className="glass-panel p-6 rounded-xl border border-violet-500/15 relative overflow-hidden h-full flex flex-col" id="detail-panel-escuela">
      <FiligreeCorner position="tl" className="w-6 h-6" />
      <FiligreeCorner position="tr" className="w-6 h-6" />
      <FiligreeCorner position="bl" className="w-6 h-6" />
      <FiligreeCorner position="br" className="w-6 h-6" />
      <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest pb-1 flex items-center gap-2">
        <Landmark className="w-4 h-4 text-amber-400" />
        {t.secEscuela}
      </h3>
      <CompassStarDivider className="-mt-1 mb-3" />

      {/* Crest and name on the left, the character's place on the right (as the house card) */}
      <div className="flex-1 flex flex-row items-center gap-4 sm:gap-6 my-2 pb-4 border-b border-amber-500/15">
        <div className="flex flex-col items-center justify-center shrink-0 w-[90px] sm:w-[105px]">
          <img src="/icon.svg" alt={t.crestAlt} className="w-20 h-20 object-contain drop-shadow-[0_4px_16px_rgba(212,175,55,0.3)]" />
          <div className="font-magic text-xs tracking-widest uppercase text-amber-300 font-bold mt-2 text-center break-words max-w-full">
            {schoolName}
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-3 min-w-0 pl-1 sm:pl-3">
          {adult ? (
            <>
              {isQuickEditing && fact("adultWizardProfile/institution", t.adultWizardInstitution, profile.institution || "", (v) => updateProfileField("institution", v))}
              {fact("adultWizardProfile/role", t.adultWizardRole, profile.role || "", (v) => updateProfileField("role", v))}
              {shown("adultWizardProfile/isTeacher") && (isQuickEditing ? (
                <Switch id="edit-aw-is-teacher" checked={profile.isTeacher || false}
                  disabled={!writable("adultWizardProfile/isTeacher")}
                  onChange={(on) => updateProfileField("isTeacher", on)}
                  label={t.adultWizardIsTeacher}
                  labelClassName="text-[10px] text-neutral-300 font-sans font-bold uppercase tracking-wider" />
              ) : profile.isTeacher ? (
                <div className={READ_LABEL}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 inline-block" />
                  {t.adultWizardIsTeacher}
                </div>
              ) : null)}
            </>
          ) : (
            <>
              {fact("curso", t.curso, character.curso || "", (v) => edit("curso", v))}
              {fact("puestoClase", t.puestoClase, character.puestoClase || "", (v) => edit("puestoClase", v))}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4 text-xs font-mono">
        {adult && profile.isTeacher && (
          <div className="space-y-1.5">
            <div className={isQuickEditing ? EDIT_LABEL : "text-[9px] text-neutral-500 uppercase tracking-wider"}>{t.adultWizardTeachingSubjects}</div>
            <SubjectList
              id={isQuickEditing ? "sheet-subjects" : "sheet-subjects-read"}
              items={profile.teachingSubjects ?? []}
              editable={isQuickEditing && canAdd("adultWizardProfile/teachingSubjects")}
              canRemove={(id) => isQuickEditing && canRemove("adultWizardProfile/teachingSubjects", id)}
              onAdd={addSubject}
              onRemove={removeSubject}
              texts={{ placeholder: t.placeholderAddSubject, empty: t.labelNoSubjects, remove: t.removeSubject, add: t.addSubject }}
            />
          </div>
        )}

        {/* Clubes: one row each, like the teacher's subjects */}
        <div className="space-y-1.5" id="sheet-clubs">
          <div className={isQuickEditing ? EDIT_LABEL : "text-[9px] text-neutral-500 uppercase tracking-wider"}>{t.clubes}</div>
          {character.clubesList && character.clubesList.length > 0 ? (
            <ul className="space-y-1">
              {character.clubesList.map((cl) => (
                <li key={cl.id} className="flex items-center justify-between gap-2 px-2 py-1 rounded border border-neutral-800/80 bg-neutral-950/30 text-neutral-200">
                  <span className="min-w-0 break-words">{cl.nombre}</span>
                  {isQuickEditing && canRemove("clubesList", cl.id) && (
                    <button
                      id={`btn-del-club-${cl.id}`}
                      type="button"
                      onClick={() => handleRemoveClub(cl.id)}
                      className={`${HIT} w-6 h-6 shrink-0 flex items-center justify-center rounded text-neutral-500 hover:text-rose-400 cursor-pointer`}
                      title={t.removeClub}
                      aria-label={`${t.removeClub}: ${cl.nombre}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 italic">{t.emptyClubs}</p>
          )}
          {isQuickEditing && canAdd("clubesList") && (
            <div className="flex gap-2 items-center">
              <input
                {...limitAttrs("character", "clubesList/x/nombre", { path: "clubesList", count: (character.clubesList ?? []).length })}
                id="input-new-club"
                type="text"
                placeholder={t.placeholderClubes}
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddClub();
                  }
                }}
                className="flex-1 min-w-0 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <button
                id="btn-add-club"
                type="button"
                onClick={handleAddClub}
                className={`${HIT} p-1.5 shrink-0 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded cursor-pointer`}
                title={t.addClub}
                aria-label={t.addClub}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
