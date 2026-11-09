/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "perfil" tab, moved verbatim out of CharacterDetail.tsx (R3.4).
import React from "react";
import { HOUSES } from "../../data/gameData";
import { translateHouseMotto } from "../../localization";
import { FiligreeCorner, CompassStarDivider } from "../AcademyOrnaments";
import { HouseCrest, hasRecognizedCrest } from "../HouseCrest";
import { Shield, User, Plus, X } from "lucide-react";
import type { House } from "../../model/sheet";

import type { SheetContext } from "./useCharacterSheet";
import { SubjectList } from "../SubjectList";
import { limitAttrs } from "../LimitHint";
import { Switch } from "../Toggle";
import { TagMenu } from "../TagMenu";

/** The house tag (Controls, tag menu): the medallion and the name, as in the approved demo. */
const HOUSE_TAG = "inline-flex items-center gap-2 min-h-[34px] pl-1 pr-3 rounded-full border border-amber-600/30 bg-[rgba(17,13,27,0.9)] text-[#fce8a6] font-magic text-[11px] font-bold uppercase tracking-[0.12em] hover:border-[#f3d88c] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

export function ProfileTab({ ctx }: { ctx: SheetContext }) {
  const {
    lang, character, t, hInfo, localizedLore, characterType, writable, shown, canAdd, canRemove, edit, profile,
    addSubject, removeSubject, updateProfileField, isQuickEditing, newPersonalAspectInput,
    setNewPersonalAspectInput, newComplicationInput, setNewComplicationInput, newCustomFieldName, setNewCustomFieldName,
    newCustomFieldValue, setNewCustomFieldValue, handleDeleteAspect, handleAddNewAspect, handleDeleteComplication,
    handleAddNewComplication, handleAddCustomField, handleUpdateCustomField, handleRemoveCustomField,
  } = ctx;
  const casa = character.casa ?? "";
  const customFields = character.camposPersonalizados ?? [];
  /** The age, a whole number; an empty or unreadable box changes nothing. */
  const editAge = (text: string) => {
    if (!text.trim()) return;
    const age = parseInt(text, 10);
    if (Number.isFinite(age)) edit("edad", age);
  };
  return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch" id="detail-tab-perfil">

            {/* Personal Data Panel (Row 1 Left on Desktop; Position 1 on Mobile) */}
            <div className={`glass-panel p-6 rounded-xl border border-violet-500/15 space-y-4 relative overflow-hidden h-full flex flex-col ${characterType === "adult_wizard" ? "md:col-span-2" : ""}`} id="detail-panel-datos-personales">
              <>
                <FiligreeCorner position="tl" className="w-6 h-6" />
                <FiligreeCorner position="tr" className="w-6 h-6" />
                <FiligreeCorner position="bl" className="w-6 h-6" />
                <FiligreeCorner position="br" className="w-6 h-6" />
              </>
              
              <h3 className={`font-magic text-xs text-amber-400 uppercase tracking-widest pb-1 flex items-center gap-2`}>
                <User className={`w-4 h-4 text-amber-400`} />
                {characterType === "adult_wizard" ? t.characterTypeAdultWizard : t.secDatosAlumno}
              </h3>
              <CompassStarDivider className="-mt-2 mb-3" />

              {isQuickEditing ? (
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  {shown("jugador") && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.jugador}</label>
                    <input
                      {...limitAttrs("character", "jugador")}
                      type="text"
                      value={character.jugador || ""}
                      disabled={!writable("jugador")}
                      onChange={(e) => edit("jugador", e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  )}

                  {shown("edad") && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.edad}</label>
                    <input
                      type="text"
                      value={String(character.edad ?? "")}
                      disabled={!writable("edad")}
                      onChange={(e) => editAge(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  )}

                  {characterType !== "adult_wizard" && (
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

                  {shown("linaje") && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.linaje}</label>
                    <input
                      {...limitAttrs("character", "linaje")}
                      type="text"
                      value={character.linaje || ""}
                      disabled={!writable("linaje")}
                      onChange={(e) => edit("linaje", e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  )}

                  {shown("economia") && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.economia}</label>
                    <input
                      {...limitAttrs("character", "economia")}
                      type="text"
                      value={character.economia || ""}
                      disabled={!writable("economia")}
                      onChange={(e) => edit("economia", e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  )}

                  {characterType !== "adult_wizard" && (
                    <>
                      {shown("varitaSintonia") && (
                      <div className="flex flex-col gap-1 col-span-2">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.varitaSintonia}</label>
                        <input
                          {...limitAttrs("character", "varitaSintonia")}
                          type="text"
                          value={character.varitaSintonia || ""}
                          disabled={!writable("varitaSintonia")}
                          onChange={(e) => edit("varitaSintonia", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      )}
                    </>
                  )}

                  {characterType === "adult_wizard" && (
                    <>
                      {shown("adultWizardProfile/role") && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardRole}</label>
                        <input
                          {...limitAttrs("character", "adultWizardProfile/role")}
                          type="text"
                          value={profile.role || ""}
                          disabled={!writable("adultWizardProfile/role")}
                          onChange={(e) => updateProfileField("role", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      )}

                      {shown("adultWizardProfile/institution") && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardInstitution}</label>
                        <input
                          {...limitAttrs("character", "adultWizardProfile/institution")}
                          type="text"
                          value={profile.institution || ""}
                          disabled={!writable("adultWizardProfile/institution")}
                          onChange={(e) => updateProfileField("institution", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      )}

                      {shown("adultWizardProfile/formerHouse") && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardFormerHouse}</label>
                        <input
                          {...limitAttrs("character", "adultWizardProfile/formerHouse")}
                          type="text"
                          value={profile.formerHouse || ""}
                          disabled={!writable("adultWizardProfile/formerHouse")}
                          onChange={(e) => updateProfileField("formerHouse", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      )}

                      {/* One «Varita / Foco mágico» for every character: for adults it sits next to the former house. */}
                      {shown("varitaSintonia") && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.varitaSintonia}</label>
                        <input
                          {...limitAttrs("character", "varitaSintonia")}
                          type="text"
                          value={character.varitaSintonia || ""}
                          disabled={!writable("varitaSintonia")}
                          onChange={(e) => edit("varitaSintonia", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      )}

                      {shown("adultWizardProfile/reputation") && (
                      <div className="flex flex-col gap-1 col-span-2">
                        <label className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardReputation}</label>
                        <input
                          {...limitAttrs("character", "adultWizardProfile/reputation")}
                          type="text"
                          value={profile.reputation || ""}
                          disabled={!writable("adultWizardProfile/reputation")}
                          onChange={(e) => updateProfileField("reputation", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      )}

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
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  {shown("jugador") && (
                  <div>
                    <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.jugador}</div>
                    <div className="text-neutral-200 mt-0.5">{character.jugador || "—"}</div>
                  </div>
                  )}

                  {shown("edad") && (
                  <div>
                    <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.edad}</div>
                    <div className="text-neutral-200 mt-0.5">{String(character.edad ?? "") || "—"}</div>
                  </div>
                  )}

                  {characterType !== "adult_wizard" && (
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

                  {shown("linaje") && (
                  <div>
                    <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.linaje}</div>
                    <div className="text-neutral-200 mt-0.5">{character.linaje || "—"}</div>
                  </div>
                  )}

                  {shown("economia") && (
                  <div>
                    <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.economia}</div>
                    <div className="text-neutral-200 mt-0.5">{character.economia || "—"}</div>
                  </div>
                  )}

                  {characterType !== "adult_wizard" && (
                    <>
                      {shown("varitaSintonia") && (
                      <div className="col-span-2">
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.varitaSintonia}</div>
                        <div className="text-neutral-200 mt-0.5">{character.varitaSintonia || t.labelVaritaEmpty}</div>
                      </div>
                      )}
                    </>
                  )}

                  {characterType === "adult_wizard" && (
                    <>
                      {shown("adultWizardProfile/role") && (
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardRole}</div>
                        <div className="text-neutral-200 mt-0.5">{profile.role || "—"}</div>
                      </div>
                      )}

                      {shown("adultWizardProfile/institution") && (
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardInstitution}</div>
                        <div className="text-neutral-200 mt-0.5">{profile.institution || "—"}</div>
                      </div>
                      )}

                      {shown("adultWizardProfile/formerHouse") && (
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardFormerHouse}</div>
                        <div className="text-neutral-200 mt-0.5">{profile.formerHouse || "—"}</div>
                      </div>
                      )}

                      {shown("varitaSintonia") && (
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.varitaSintonia}</div>
                        <div className="text-neutral-200 mt-0.5">{character.varitaSintonia || t.labelVaritaEmpty}</div>
                      </div>
                      )}

                      {shown("adultWizardProfile/reputation") && (
                      <div className="col-span-2">
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.adultWizardReputation}</div>
                        <div className="text-neutral-200 mt-0.5">{profile.reputation || "—"}</div>
                      </div>
                      )}

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

            </div>

            {/* House Affiliation & Heraldry Panel (Row 1 Right on Desktop; Position 2 on Mobile) */}
            {characterType !== "adult_wizard" && shown("casa") && (
              <div className="glass-panel p-6 rounded-xl border border-violet-500/15 relative overflow-hidden h-full flex flex-col justify-between" id="detail-panel-filiacion">
                <>
                  <FiligreeCorner position="tl" className="w-6 h-6" />
                  <FiligreeCorner position="tr" className="w-6 h-6" />
                  <FiligreeCorner position="bl" className="w-6 h-6" />
                  <FiligreeCorner position="br" className="w-6 h-6" />
                </>
                

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className={`font-magic text-xs text-amber-400 uppercase tracking-widest pb-1 flex items-center gap-2`}>
                      <Shield className={`w-4 h-4 text-amber-400`} />
                      {t.titleHouseHeraldry}
                    </h3>
                    <CompassStarDivider className="-mt-1 mb-3" />

                    {/* Upper Area: Crest on upper-left with name underneath, Lema to its right in bigger font */}
                    <div className={`flex flex-row items-center gap-4 sm:gap-6 my-2 pb-4 border-b border-amber-500/15`}>
                      {/* Left: House Crest with House Name Under It */}
                      <div className="flex flex-col items-center justify-center shrink-0 min-w-[90px] sm:min-w-[105px]">
                        <HouseCrest
                          house={casa}
                          isAdultWizard={false}
                          className="w-20 h-20 sm:w-22 sm:h-22 filter drop-shadow-[0_4px_16px_rgba(212,175,55,0.3)] transition-transform hover:scale-105"
                          variant="shield"
                        />
                        {isQuickEditing && writable("casa") ? (
                          <div className="mt-2 flex justify-center">
                            <TagMenu<House>
                              id="tag-house"
                              title={t.casa}
                              value={casa.toUpperCase() as House}
                              emptyLabel={t.casa}
                              editable
                              onChange={(house) => edit("casa", house)}
                              tagClass={HOUSE_TAG}
                              options={Object.keys(HOUSES).map((hKey) => ({ value: hKey as House, label: HOUSES[hKey].nombre, icon: <HouseCrest house={hKey} variant="medallion" className="w-6 h-6 shrink-0" /> }))}
                            />
                          </div>
                        ) : (
                          <div className={`font-magic text-xs tracking-widest uppercase text-amber-300 font-bold mt-2 text-center drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]`}>
                            {hInfo.nombre}
                          </div>
                        )}
                      </div>

                      {/* Right: Lema in a bigger font (read-only, linked to the house/organization) */}
                      <div className="flex-1 flex flex-col justify-center min-w-0 pl-1 sm:pl-3">
                        <div className="text-[9px] text-neutral-400 uppercase tracking-widest font-mono mb-1.5 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full bg-amber-400/80 inline-block`}></span>
                          {t.labelMotto}
                        </div>
                        <blockquote className={`font-serif italic text-base sm:text-lg md:text-xl font-medium text-amber-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] leading-snug`}>
                          « {translateHouseMotto(hInfo.lema, lang)} »
                        </blockquote>
                      </div>
                    </div>

                    {/* Data grid: Casa Fundadora & Lema conditionally hidden when the house has a recognized crest */}
                    <div className="relative grid grid-cols-2 gap-3 text-xs font-mono mt-4">
                      {!hasRecognizedCrest(casa) && (
                        <>
                          <div>
                            <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.casa}</div>
                            {isQuickEditing && writable("casa") ? (
                              <div className="mt-2 flex justify-center">
                                <TagMenu<House>
                                  id="tag-house-other"
                                  title={t.casa}
                                  value={casa.toUpperCase() as House}
                                  emptyLabel={t.casa}
                                  editable
                                  onChange={(house) => edit("casa", house)}
                                  tagClass={HOUSE_TAG}
                                  options={Object.keys(HOUSES).map((hKey) => ({ value: hKey as House, label: HOUSES[hKey].nombre, icon: <HouseCrest house={hKey} variant="medallion" className="w-6 h-6 shrink-0" /> }))}
                                />
                              </div>
                            ) : (
                              <div className="font-magic text-sm font-bold text-amber-300 uppercase tracking-wider mt-0.5">
                                {hInfo.nombre}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelMotto}</div>
                            <div className="text-amber-300 font-serif italic text-sm mt-0.5">
                              « {translateHouseMotto(hInfo.lema, lang)} »
                            </div>
                          </div>
                        </>
                      )}

                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelProvenance}</div>
                        <div className="text-neutral-200 mt-0.5">{localizedLore.procedencia}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelColors}</div>
                        <div className="text-neutral-200 mt-0.5">{localizedLore.colores}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelElement}</div>
                        <div className="text-neutral-200 mt-0.5">{localizedLore.elemento}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelTotem}</div>
                        <div className="text-neutral-200 mt-0.5">{localizedLore.totem}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Row 2 on Desktop: Full-width container (md:col-span-2) with Aspectos Personales & Complicaciones side-by-side */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch" id="detail-aspectos-complicaciones-row">
              {/* Personal Aspects Panel (Left on Desktop; Position 3 on Mobile) */}
              <div className="glass-panel p-6 rounded-xl border border-violet-500/15 relative overflow-hidden h-full flex flex-col justify-between" id="detail-panel-aspectos">
                <>
                  <FiligreeCorner position="tl" className="w-6 h-6" />
                  <FiligreeCorner position="tr" className="w-6 h-6" />
                  <FiligreeCorner position="bl" className="w-6 h-6" />
                  <FiligreeCorner position="br" className="w-6 h-6" />
                </>
                
                <div className="flex-1 flex flex-col justify-between">
                  <h3 className={`font-magic text-xs text-amber-400 uppercase tracking-widest pb-1 flex items-center gap-2`}>
                    <span>🌟</span> {t.aspectosPersonales}
                  </h3>
                  <CompassStarDivider className="-mt-1 mb-3" />

                  {(() => {
                    const aspectList = character.aspectosPersonales ?? [];

                    return (
                      <div className="space-y-3">
                        {aspectList.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {aspectList.map((aspect) => (
                              <div
                                key={aspect.id}
                                className="p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-neutral-300 flex items-center justify-between gap-2"
                              >
                                <span>“ {aspect.value} ”</span>
                                {isQuickEditing && canRemove("aspectosPersonales", aspect.id) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAspect(aspect.id)}
                                    className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                                    title={t.deleteAspect}
                                  >
                                    <X className="w-3.5 h-3.5 shrink-0" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-500 italic block text-center py-4 bg-neutral-950/10 border border-neutral-900 rounded-lg">
                            {t.labelAspectsEmpty}
                          </span>
                        )}

                        {isQuickEditing && canAdd("aspectosPersonales") && (
                          <div className="flex gap-2 items-center bg-neutral-950/40 p-2 border border-violet-500/10 rounded-lg mt-2">
                            <input
                              {...limitAttrs("character", "aspectosPersonales/x/value", { path: "aspectosPersonales", count: (character.aspectosPersonales ?? []).length })}
                              type="text"
                              placeholder={t.placeholderAddAspect}
                              value={newPersonalAspectInput}
                              onChange={(e) => setNewPersonalAspectInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddNewAspect(newPersonalAspectInput);
                                  setNewPersonalAspectInput("");
                                }
                              }}
                              className="bg-neutral-900 text-xs text-neutral-200 px-2 py-1.5 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleAddNewAspect(newPersonalAspectInput);
                                setNewPersonalAspectInput("");
                              }}
                              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Complications Panel (Right on Desktop; Position 4 on Mobile) */}
              <div className="glass-panel p-6 rounded-xl border border-violet-500/15 relative overflow-hidden h-full flex flex-col justify-between" id="detail-panel-complicaciones">
                <>
                  <FiligreeCorner position="tl" className="w-6 h-6" />
                  <FiligreeCorner position="tr" className="w-6 h-6" />
                  <FiligreeCorner position="bl" className="w-6 h-6" />
                  <FiligreeCorner position="br" className="w-6 h-6" />
                </>
                
                <div className="flex-1 flex flex-col justify-between">
                  <h3 className={`font-magic text-xs text-amber-400 uppercase tracking-widest pb-1 flex items-center gap-2`}>
                    <span>⚠️</span> {t.complicaciones}
                  </h3>
                  <CompassStarDivider className="-mt-1 mb-3" />

                  {(() => {
                    const compList = character.complicaciones ?? [];

                    return (
                      <div className="space-y-3">
                        {compList.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {compList.map((comp) => (
                              <div
                                key={comp.id}
                                className="p-2.5 bg-neutral-950/20 border border-violet-900/20 rounded-lg text-xs font-serif italic text-rose-300 flex items-center justify-between gap-2"
                              >
                                <span>“ {comp.value} ”</span>
                                {isQuickEditing && canRemove("complicaciones", comp.id) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComplication(comp.id)}
                                    className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                                    title={t.deleteComplication}
                                  >
                                    <X className="w-3.5 h-3.5 shrink-0" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-500 italic block text-center py-4 bg-neutral-950/10 border border-neutral-900 rounded-lg">
                            {t.labelComplicacionesEmpty}
                          </span>
                        )}

                        {isQuickEditing && canAdd("complicaciones") && (
                          <div className="flex gap-2 items-center bg-neutral-950/40 p-2 border border-violet-500/10 rounded-lg mt-2">
                            <input
                              {...limitAttrs("character", "complicaciones/x/value", { path: "complicaciones", count: (character.complicaciones ?? []).length })}
                              type="text"
                              placeholder={t.placeholderAddComplication}
                              value={newComplicationInput}
                              onChange={(e) => setNewComplicationInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddNewComplication(newComplicationInput);
                                  setNewComplicationInput("");
                                }
                              }}
                              className="bg-neutral-900 text-xs text-neutral-200 px-2 py-1.5 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleAddNewComplication(newComplicationInput);
                                setNewComplicationInput("");
                              }}
                              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Full-width Custom Fields Panel in both styles */}
            {(isQuickEditing || customFields.length > 0) && (
              <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2 relative overflow-hidden" id="detail-panel-custom-fields">
                <>
                  <FiligreeCorner position="tl" className="w-6 h-6" />
                  <FiligreeCorner position="tr" className="w-6 h-6" />
                  <FiligreeCorner position="bl" className="w-6 h-6" />
                  <FiligreeCorner position="br" className="w-6 h-6" />
                </>
                
                <h3 className={`font-magic text-xs text-amber-400 uppercase tracking-widest pb-1 flex items-center gap-2`}>
                  <span>🔮</span> {t.customFields}
                </h3>
                <CompassStarDivider className="-mt-1 mb-3" />
                {customFields.length > 0 && !isQuickEditing ? (
                  // Read like the other values (owner decision, 8 November 2026): label above, value below.
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    {customFields.map((fd) => (
                      <div key={fd.id}>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{fd.nombre}</div>
                        <div className="text-neutral-200 mt-0.5 break-words">{fd.valor || "—"}</div>
                      </div>
                    ))}
                  </div>
                ) : customFields.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customFields.map((fd) => (
                      <div
                        key={fd.id}
                        className="p-3 bg-[#110c1c]/80 border border-[#c8a248]/35 rounded-lg text-xs flex items-center justify-between gap-2"
                      >
                        <input
                          {...limitAttrs("character", "camposPersonalizados/x/nombre")}
                          type="text"
                          id={`input-custom-name-${fd.id}`}
                          value={fd.nombre ?? ""}
                          disabled={!writable(`camposPersonalizados/${fd.id}/nombre`)}
                          onChange={(e) => handleUpdateCustomField(fd.id, "nombre", e.target.value)}
                          placeholder={t.fieldName}
                          className="w-1/3 bg-neutral-900 text-amber-400 font-mono text-[10px] uppercase px-2 py-1 rounded border border-neutral-800 focus:outline-none focus:border-amber-500"
                        />
                        <input
                          {...limitAttrs("character", "camposPersonalizados/x/valor")}
                          type="text"
                          value={fd.valor ?? ""}
                          disabled={!writable(`camposPersonalizados/${fd.id}/valor`)}
                          onChange={(e) => handleUpdateCustomField(fd.id, "valor", e.target.value)}
                          placeholder={t.fieldValue}
                          className="flex-1 bg-neutral-900 text-neutral-200 text-xs px-2 py-1 rounded border border-neutral-800 focus:outline-none focus:border-amber-500"
                        />
                        {canRemove("camposPersonalizados", fd.id) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(fd.id)}
                          className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                          title={t.deleteCustomField}
                        >
                          <X className="w-3.5 h-3.5 shrink-0" />
                        </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-500 italic block text-center py-3 bg-neutral-950/10 border border-neutral-900 rounded-lg">
                    {t.emptyCustomFields}
                  </span>
                )}

                {isQuickEditing && canAdd("camposPersonalizados") && (
                  <div className={`flex flex-col sm:flex-row gap-2 items-center bg-neutral-950/40 p-2.5 border border-[#c8a248]/25 rounded-lg mt-3`}>
                    <input
                      {...limitAttrs("character", "camposPersonalizados/x/nombre", { path: "camposPersonalizados", count: (character.camposPersonalizados ?? []).length })}
                      type="text"
                      placeholder={t.fieldName}
                      value={newCustomFieldName}
                      onChange={(e) => setNewCustomFieldName(e.target.value)}
                      className="bg-neutral-900 text-xs text-neutral-200 px-2.5 py-1.5 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-5/12"
                    />
                    <div className="flex gap-2 w-full sm:flex-1">
                      <input
                        {...limitAttrs("character", "camposPersonalizados/x/valor")}
                        type="text"
                        placeholder={t.fieldValue}
                        value={newCustomFieldValue}
                        onChange={(e) => setNewCustomFieldValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomField();
                          }
                        }}
                        className="bg-neutral-900 text-xs text-neutral-200 px-2.5 py-1.5 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="p-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded cursor-pointer shrink-0"
                        title={t.addCustomField}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
  );
}
