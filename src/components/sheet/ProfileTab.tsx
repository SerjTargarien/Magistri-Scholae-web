/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "perfil" tab: Datos Personales, Aspectos and Complicaciones, the custom fields. The
// school and the house are on «Institución» (owner, 13 November 2026). Moved out of CharacterDetail.tsx in R3.4.
import React from "react";
import { FiligreeCorner, CompassStarDivider } from "../AcademyOrnaments";
import { User, Plus, X } from "lucide-react";

import type { SheetContext } from "./useCharacterSheet";
import { limitAttrs } from "../LimitHint";

export function ProfileTab({ ctx }: { ctx: SheetContext }) {
  const {
    character, t, characterType, writable, shown, canAdd, canRemove, edit, profile,
    updateProfileField, isQuickEditing, newPersonalAspectInput,
    setNewPersonalAspectInput, newComplicationInput, setNewComplicationInput, newCustomFieldName, setNewCustomFieldName,
    newCustomFieldValue, setNewCustomFieldValue, handleDeleteAspect, handleAddNewAspect, handleDeleteComplication,
    handleAddNewComplication, handleAddCustomField, handleUpdateCustomField, handleRemoveCustomField,
  } = ctx;
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
            <div className={`glass-panel p-6 rounded-xl border border-violet-500/15 space-y-4 relative overflow-hidden h-full flex flex-col`} id="detail-panel-datos-personales">
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
                      {/* One «Varita / Foco mágico» for every character. */}
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

                    </>
                  )}
                </div>
              )}

            </div>

            {/* Aspectos and Complicaciones, one card to the right of Datos Personales (owner, 13 November 2026) */}
            <div className="glass-panel p-6 rounded-xl border border-violet-500/15 relative overflow-hidden h-full flex flex-col gap-8" id="detail-panel-rasgos">
              <FiligreeCorner position="tl" className="w-6 h-6" />
              <FiligreeCorner position="tr" className="w-6 h-6" />
              <FiligreeCorner position="bl" className="w-6 h-6" />
              <FiligreeCorner position="br" className="w-6 h-6" />
              {/* Personal Aspects Panel (Left on Desktop; Position 3 on Mobile) */}
              <div className="flex flex-col" id="detail-panel-aspectos">
                
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
              <div className="flex flex-col" id="detail-panel-complicaciones">
                
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
                        // Phones: the name and «×» on one line, the value under them, full width; wider screens: one row.
                        className="p-3 bg-[#110c1c]/80 border border-[#c8a248]/35 rounded-lg text-xs grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:justify-between"
                      >
                        <input
                          {...limitAttrs("character", "camposPersonalizados/x/nombre")}
                          type="text"
                          id={`input-custom-name-${fd.id}`}
                          value={fd.nombre ?? ""}
                          disabled={!writable(`camposPersonalizados/${fd.id}/nombre`)}
                          onChange={(e) => handleUpdateCustomField(fd.id, "nombre", e.target.value)}
                          placeholder={t.fieldName}
                          className="min-w-0 w-full sm:w-1/3 bg-neutral-900 text-amber-400 font-mono text-[10px] uppercase px-2 py-1 rounded border border-neutral-800 focus:outline-none focus:border-amber-500"
                        />
                        {canRemove("camposPersonalizados", fd.id) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(fd.id)}
                          className="sm:order-last text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                          title={t.deleteCustomField}
                        >
                          <X className="w-3.5 h-3.5 shrink-0" />
                        </button>
                        )}
                        <input
                          {...limitAttrs("character", "camposPersonalizados/x/valor")}
                          type="text"
                          value={fd.valor ?? ""}
                          disabled={!writable(`camposPersonalizados/${fd.id}/valor`)}
                          onChange={(e) => handleUpdateCustomField(fd.id, "valor", e.target.value)}
                          placeholder={t.fieldValue}
                          className="col-span-2 min-w-0 w-full sm:flex-1 bg-neutral-900 text-neutral-200 text-xs px-2 py-1 rounded border border-neutral-800 focus:outline-none focus:border-amber-500"
                        />
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
