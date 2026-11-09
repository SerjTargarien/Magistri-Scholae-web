/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The creation form's "aspectos" tab, moved verbatim out of CharacterForm.tsx (R3.4).
import React from "react";
import { Sparkles, Plus, Trash2, X, Minus } from "lucide-react";

import type { FormContext } from "./useCharacterForm";
import { limitAttrs } from "../LimitHint";

export function FormAspectsTab({ ctx }: { ctx: FormContext }) {
  const {
    t, characterState, newAspectName, setNewAspectName, newComplicationName, setNewComplicationName, newItemName,
    setNewItemName, newItemQty, setNewItemQty, newCustomFieldName, setNewCustomFieldName, newCustomFieldValue,
    setNewCustomFieldValue, addAspect, removeAspect, addComplication, removeComplication, addEquipmentItem,
    removeEquipmentItem, addCustomField, updateCustomField, removeCustomField, houseIconColor,
  } = ctx;
  return (
            <div className="space-y-6 animate-fade-in" id="form-tabpanel-aspectos">
              <div className="flex items-center gap-1.5 border-b border-violet-500/10 pb-3">
                <Sparkles className={`w-5 h-5 ${houseIconColor}`} />
                <h3 className="font-magic text-sm uppercase tracking-wider text-neutral-200">
                  {t.titleAspectsPossessions}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Column 1: Aspects & Complications */}
                <div className="space-y-6">
                  {/* Personal Aspects */}
                  <div className="p-4 bg-neutral-950/20 border border-violet-500/5 rounded-2xl">
                    <h4 className="text-xs font-magic text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-violet-900/10 pb-1.5 font-bold">
                      <span>🌟 {t.aspectosPersonales}</span>
                    </h4>
                    
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {characterState.aspectosPersonales && characterState.aspectosPersonales.length > 0 ? (
                        characterState.aspectosPersonales.map((asp) => (
                          <div
                            key={asp.id}
                            className="flex items-center justify-between bg-neutral-900/40 border border-neutral-800 px-3 py-1.5 rounded-lg hover:border-violet-500/10 transition-colors"
                          >
                            <span className="text-[11px] text-neutral-200 italic font-serif">“ {asp.value} ”</span>
                            <button
                              type="button"
                              onClick={() => removeAspect(asp.id)}
                              className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-950 transition-colors cursor-pointer"
                              title={t.deleteAspect}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] font-mono text-neutral-500 italic py-4 text-center bg-neutral-950/10 border border-neutral-900/50 rounded-lg">
                          {t.emptyAspects}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 items-center bg-neutral-950/40 p-2 border border-violet-500/10 rounded-xl mt-3">
                      <input
                        {...limitAttrs("character", "aspectosPersonales/x/value", { path: "aspectosPersonales", count: (characterState.aspectosPersonales ?? []).length })}
                        type="text"
                        placeholder={t.placeholderAspectExample}
                        value={newAspectName}
                        onChange={(e) => setNewAspectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAspect();
                          }
                        }}
                        className="flex-1 text-[11px] font-sans bg-neutral-950 border border-neutral-800 focus:border-violet-500/50 rounded-lg px-2.5 py-1 text-neutral-200 focus:outline-none placeholder-neutral-600"
                      />
                      <button
                        type="button"
                        onClick={addAspect}
                        className="p-1 px-[10px] bg-violet-900/60 hover:bg-violet-800 text-white border border-violet-600/20 rounded-lg transition-all active:scale-95 cursor-pointer"
                        title={t.addAspect}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Complications */}
                  <div className="p-4 bg-neutral-950/20 border border-violet-500/5 rounded-2xl">
                    <h4 className="text-xs font-magic text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-violet-900/10 pb-1.5 font-bold">
                      <span>⚠️ {t.complicaciones}</span>
                    </h4>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {characterState.complicaciones && characterState.complicaciones.length > 0 ? (
                        characterState.complicaciones.map((comp) => (
                          <div
                            key={comp.id}
                            className="flex items-center justify-between bg-neutral-900/40 border border-neutral-800 px-3 py-1.5 rounded-lg hover:border-violet-500/10 transition-colors"
                          >
                            <span className="text-[11px] text-rose-300 font-serif italic">“ {comp.value} ”</span>
                            <button
                              type="button"
                              onClick={() => removeComplication(comp.id)}
                              className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-950 transition-colors cursor-pointer"
                              title={t.deleteComplication}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] font-mono text-neutral-500 italic py-4 text-center bg-neutral-950/10 border border-neutral-900/50 rounded-lg">
                          {t.emptyComplications}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 items-center bg-neutral-950/40 p-2 border border-violet-500/10 rounded-xl mt-3">
                      <input
                        {...limitAttrs("character", "complicaciones/x/value", { path: "complicaciones", count: (characterState.complicaciones ?? []).length })}
                        type="text"
                        placeholder={t.placeholderComplicaciones}
                        value={newComplicationName}
                        onChange={(e) => setNewComplicationName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addComplication();
                          }
                        }}
                        className="flex-1 text-[11px] font-sans bg-neutral-950 border border-neutral-800 focus:border-violet-500/50 rounded-lg px-2.5 py-1 text-neutral-200 focus:outline-none placeholder-neutral-600"
                      />
                      <button
                        type="button"
                        onClick={addComplication}
                        className="p-1 px-[10px] bg-violet-900/60 hover:bg-violet-800 text-white border border-violet-600/20 rounded-lg transition-all active:scale-95 cursor-pointer"
                        title={t.addComplication}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 2: Equipment / Posesiones & Custom Attributes */}
                <div className="space-y-6">
                  <div className="p-4 bg-neutral-950/20 border border-violet-500/5 rounded-2xl">
                    <h4 className="text-xs font-magic text-amber-400 uppercase tracking-widest mb-3 flex items-center justify-between border-b border-violet-900/10 pb-1.5 font-bold">
                      <span>🎒 {t.equipo}</span>
                      <span className="text-[10px] font-mono text-neutral-500">{(characterState.equipoList || []).length}</span>
                    </h4>

                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                      {characterState.equipoList && characterState.equipoList.length > 0 ? (
                        characterState.equipoList.map((eq) => (
                          <div
                            key={eq.id}
                            className="flex items-center justify-between bg-neutral-900/40 px-3 py-1.5 border border-neutral-800 rounded-lg hover:border-violet-500/10 transition-all"
                          >
                            <div className="flex items-center gap-2 max-w-[80%] min-w-0">
                              <span className="text-[11px] text-neutral-200 font-mono truncate" title={eq.nombre}>{eq.nombre}</span>
                              <span className="bg-neutral-950/80 text-[10px] px-1.5 py-0.5 rounded text-amber-400 font-bold border border-neutral-800">
                                x{eq.cantidad}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEquipmentItem(eq.id)}
                              className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                              title={t.deleteItem}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] font-mono text-neutral-600 italic py-6 text-center bg-neutral-950/10 border border-neutral-900/50 rounded-lg">
                          {t.emptyInventory}
                        </p>
                      )}
                    </div>

                    {/* Add Inventory Item Input Form */}
                    <div className="bg-neutral-950/40 p-3 border border-violet-500/10 rounded-xl space-y-3 mt-3">
                      <input
                        {...limitAttrs("character", "equipoList/x/nombre", { path: "equipoList", count: (characterState.equipoList ?? []).length })}
                        type="text"
                        placeholder={t.placeholderEquipmentExample}
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full text-[11px] font-sans bg-neutral-950 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none placeholder-neutral-600"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addEquipmentItem();
                          }
                        }}
                      />
                      <div className="flex items-center justify-between gap-3">
                        {/* Quantity Input */}
                        <div className="flex items-center border border-neutral-800 bg-neutral-950 rounded-lg overflow-hidden h-8 shrink-0">
                          <button
                            type="button"
                            onClick={() => setNewItemQty(q => Math.max(1, q - 1))}
                            className="px-2 h-full text-neutral-400 hover:text-white hover:bg-neutral-900 cursor-pointer transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-8 text-center bg-transparent text-[11px] text-neutral-200 focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setNewItemQty(q => q + 1)}
                            className="px-2 h-full text-neutral-400 hover:text-white hover:bg-neutral-900 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={addEquipmentItem}
                          className="flex items-center gap-1.5 px-3 py-1 bg-violet-900/60 hover:bg-violet-800 border border-violet-600/25 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer h-8"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t.add}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Custom Attributes / Campos Personalizados */}
                  <div className="p-4 bg-neutral-950/20 border border-violet-500/5 rounded-2xl" id="form-custom-fields-section">
                    <h4 className="text-xs font-magic text-indigo-400 uppercase tracking-widest mb-3 flex items-center justify-between border-b border-violet-900/10 pb-1.5 font-bold">
                      <span>🔮 {t.customFields}</span>
                      <span className="text-[10px] font-mono text-neutral-500">{(characterState.camposPersonalizados || []).length}</span>
                    </h4>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {characterState.camposPersonalizados && characterState.camposPersonalizados.length > 0 ? (
                        characterState.camposPersonalizados.map((cf) => (
                          <div
                            key={cf.id}
                            className="flex items-center gap-2 bg-neutral-900/40 px-2.5 py-1.5 border border-neutral-800 rounded-lg"
                          >
                            <input
                              {...limitAttrs("character", "camposPersonalizados/x/nombre")}
                              type="text"
                              value={cf.nombre ?? ""}
                              onChange={(e) => updateCustomField(cf.id, "nombre", e.target.value)}
                              placeholder={t.fieldName}
                              className="w-1/3 text-[10px] font-mono text-amber-400 bg-neutral-950 border border-neutral-800 rounded px-2 py-1"
                            />
                            <input
                              {...limitAttrs("character", "camposPersonalizados/x/valor")}
                              type="text"
                              value={cf.valor ?? ""}
                              onChange={(e) => updateCustomField(cf.id, "valor", e.target.value)}
                              placeholder={t.fieldValue}
                              className="flex-1 text-[11px] font-sans text-neutral-200 bg-neutral-950 border border-neutral-800 rounded px-2 py-1"
                            />
                            <button
                              type="button"
                              onClick={() => removeCustomField(cf.id)}
                              className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer transition-colors shrink-0"
                              title={t.deleteCustomField}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] font-mono text-neutral-600 italic py-4 text-center bg-neutral-950/10 border border-neutral-900/50 rounded-lg">
                          {t.emptyCustomFields}
                        </p>
                      )}
                    </div>

                    <div className="bg-neutral-950/40 p-2.5 border border-violet-500/10 rounded-xl space-y-2 mt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          {...limitAttrs("character", "camposPersonalizados/x/nombre", { path: "camposPersonalizados", count: (characterState.camposPersonalizados ?? []).length })}
                          id="input-form-custom-field-name"
                          type="text"
                          placeholder={t.fieldName}
                          value={newCustomFieldName}
                          onChange={(e) => setNewCustomFieldName(e.target.value)}
                          className="text-[11px] font-mono bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                        />
                        <input
                          {...limitAttrs("character", "camposPersonalizados/x/valor")}
                          id="input-form-custom-field-value"
                          type="text"
                          placeholder={t.fieldValue}
                          value={newCustomFieldValue}
                          onChange={(e) => setNewCustomFieldValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomField();
                            }
                          }}
                          className="text-[11px] font-sans bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                        />
                      </div>
                      <button
                        id="btn-form-add-custom-field"
                        type="button"
                        onClick={addCustomField}
                        className="w-full py-1.5 bg-violet-900/60 hover:bg-violet-800 border border-violet-600/25 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t.addCustomField}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
  );
}
