/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Equipo» on the «Magia y equipo» tab (owner, 13 November 2026), moved from the notes tab,
// which is now the Bitácora. Quantities change at any time, as before (play).
import React from "react";
import { Plus, Trash } from "lucide-react";

import type { SheetContext } from "./useCharacterSheet";
import { limitAttrs } from "../LimitHint";
import { Stepper } from "../Stepper";
import { ruleAt } from "../../model/rules";

export function EquipmentPanel({ ctx }: { ctx: SheetContext }) {
  const {
    character, t, writable, canAdd, canRemove, isQuickEditing, newItemName, setNewItemName, newItemQty, setNewItemQty,
    handleAddInventoryItem, handleChangeInventoryQty, handleRemoveInventoryItem,
  } = ctx;
  return (
    <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2" id="detail-panel-equipo">
      {/* Equipo / Grimorio / Inventario */}
      <div className="space-y-3">
        <h4 className="font-magic text-[10px] text-amber-400 uppercase tracking-widest border-b border-violet-900/10 pb-1.5 font-bold flex items-center justify-between">
          <span>🎒 {t.equipo}</span>
          <span className="text-[9px] font-mono text-neutral-500">{(character.equipoList || []).length}</span>
        </h4>

        {/* List First: Consultation Priority */}
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
          {character.equipoList && character.equipoList.length > 0 ? (
            character.equipoList.map((eq) => {
              const cantidad = eq.cantidad ?? 1;
              const canChangeQty = writable(`equipoList/${eq.id}/cantidad`);
              return (
              <div
                key={eq.id}
                className="flex items-center justify-between bg-neutral-950/30 px-2.5 py-1.5 border border-neutral-900 rounded-lg group hover:border-violet-500/10 transition-all gap-2"
              >
                <span className="text-xs text-neutral-200 font-mono break-all flex-1">{eq.nombre}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleChangeInventoryQty(eq.id, -1)}
                      disabled={!canChangeQty || cantidad <= 1}
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-bold transition-colors ${
                        cantidad <= 1
                          ? "text-neutral-700 cursor-not-allowed"
                          : "text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 cursor-pointer"
                      }`}
                    >
                      -
                    </button>
                    <span className="text-[10px] px-1.5 text-amber-400 font-mono font-bold tabular-nums">
                      x{cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleChangeInventoryQty(eq.id, 1)}
                      disabled={!canChangeQty}
                      className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  {isQuickEditing && canRemove("equipoList", eq.id) && (
                    <button
                      id={`btn-del-item-${eq.id}`}
                      onClick={() => handleRemoveInventoryItem(eq.id)}
                      className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer opacity-80 hover:opacity-100 transition-colors"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              );
            })
          ) : (
            <p className="text-[10px] font-mono text-neutral-600 italic select-none py-4 text-center">
              {t.emptyInventory}
            </p>
          )}
        </div>

        {/* Add Inventory Item Input Form */}
        {isQuickEditing && canAdd("equipoList") && (
          <div className="bg-neutral-950/20 p-2.5 border border-neutral-900/50 rounded-lg space-y-2 mt-2 animate-fade-in">
            <input
              {...limitAttrs("character", "equipoList/x/nombre", { path: "equipoList", count: (character.equipoList ?? []).length })}
              id="input-new-item"
              type="text"
              placeholder={t.placeholderEquipo}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-violet-500 rounded-lg p-2 text-neutral-200 focus:outline-none"
            />
            <div className="flex flex-col gap-2">
              {/* Quantity, then the add button on its own line (room on phones) */}
              <Stepper id="input-new-item-qty" label={t.labelQuantity} showLabel typed min={1} max={ruleAt("character", "equipoList/x/cantidad")?.maximum ?? 9999} value={newItemQty} onChange={setNewItemQty} />

              <button
                id="btn-add-inventory-item"
                onClick={handleAddInventoryItem}
                className="flex-1 py-1.5 h-8 bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/10 text-violet-300 hover:text-neutral-100 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.addItem}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
