/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Casa y Heráldica» on the «Institución» tab (owner, 13 November 2026), moved from Perfil.
// A student's house, chosen from its tag; an adult's «Antigua casa», the free text it always
// was, shown with the house's heraldry when it names one of the houses. No stored field changed.
import React from "react";
import { Shield } from "lucide-react";

import { HOUSES } from "../../data/gameData";
import { getLocalizedHouseLore, translateHouseMotto } from "../../localization";
import type { House } from "../../model/sheet";
import { CompassStarDivider, FiligreeCorner } from "../AcademyOrnaments";
import { HouseCrest, hasRecognizedCrest } from "../HouseCrest";
import { limitAttrs } from "../LimitHint";
import { TagMenu } from "../TagMenu";
import type { SheetContext } from "./useCharacterSheet";

/** The house tag (Controls, tag menu): the medallion and the name, as in the approved demo. */
const HOUSE_TAG = "inline-flex items-center gap-2 min-h-[34px] pl-1 pr-3 rounded-full border border-amber-600/30 bg-[rgba(17,13,27,0.9)] text-[#fce8a6] font-magic text-[11px] font-bold uppercase tracking-[0.12em] hover:border-[#f3d88c] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

export function HousePanel({ ctx }: { ctx: SheetContext }) {
  const { lang, character, t, characterType, writable, shown, edit, profile, updateProfileField, isQuickEditing } = ctx;
  const adult = characterType === "adult_wizard";
  const path = adult ? "adultWizardProfile/formerHouse" : "casa";
  if (!shown(path)) return null;
  const house = (adult ? profile.formerHouse : character.casa) ?? "";
  const key = house.trim().toUpperCase();
  const recognized = hasRecognizedCrest(house);
  // An adult whose former house is not one of the houses shows the name alone; with none, no card.
  if (adult && !isQuickEditing && !house.trim()) return null;
  const heraldry = !adult || recognized;
  const hInfo = HOUSES[key] || HOUSES.IRATI;
  const lore = getLocalizedHouseLore(adult ? key : house, lang);
  const houseMenu = (id: string) => (
    <TagMenu<House>
      id={id}
      title={t.casa}
      value={key as House}
      emptyLabel={t.casa}
      editable
      onChange={(h) => edit("casa", h)}
      tagClass={HOUSE_TAG}
      options={Object.keys(HOUSES).map((hKey) => ({ value: hKey as House, label: HOUSES[hKey].nombre, icon: <HouseCrest house={hKey} variant="medallion" className="w-6 h-6 shrink-0" /> }))}
    />
  );
  const studentMenu = isQuickEditing && !adult && writable("casa");

  return (
    <div className="glass-panel p-6 rounded-xl border border-violet-500/15 relative overflow-hidden h-full flex flex-col" id="detail-panel-filiacion">
      <FiligreeCorner position="tl" className="w-6 h-6" />
      <FiligreeCorner position="tr" className="w-6 h-6" />
      <FiligreeCorner position="bl" className="w-6 h-6" />
      <FiligreeCorner position="br" className="w-6 h-6" />
      <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest pb-1 flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-400" />
        {adult ? t.adultWizardFormerHouse : t.titleHouseHeraldry}
      </h3>
      <CompassStarDivider className="-mt-1 mb-3" />

      {/* An adult's former house is typed; the box stays first so it keeps focus while the heraldry appears */}
      {adult && isQuickEditing && (
        <label className="flex flex-col gap-1 text-xs font-mono mb-2">
          <span className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">{t.adultWizardFormerHouse}</span>
          <input
            {...limitAttrs("character", "adultWizardProfile/formerHouse")}
            id="input-aw-former-house"
            type="text"
            value={profile.formerHouse || ""}
            disabled={!writable("adultWizardProfile/formerHouse")}
            onChange={(e) => updateProfileField("formerHouse", e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </label>
      )}

      {heraldry ? (
        <>
          {/* Crest with the house name under it, the Lema to its right */}
          <div className="flex-1 flex flex-row items-center gap-4 sm:gap-6 my-2 pb-4 border-b border-amber-500/15">
            <div className="flex flex-col items-center justify-center shrink-0 min-w-[90px] sm:min-w-[105px]">
              <HouseCrest
                house={adult ? key : house}
                isAdultWizard={false}
                className="w-20 h-20 sm:w-22 sm:h-22 filter drop-shadow-[0_4px_16px_rgba(212,175,55,0.3)] transition-transform hover:scale-105"
                variant="shield"
              />
              {studentMenu ? (
                <div className="mt-2 flex justify-center">{houseMenu("tag-house")}</div>
              ) : (
                <div className="font-magic text-xs tracking-widest uppercase text-amber-300 font-bold mt-2 text-center drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {hInfo.nombre}
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0 pl-1 sm:pl-3">
              <div className="text-[9px] text-neutral-400 uppercase tracking-widest font-mono mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 inline-block"></span>
                {t.labelMotto}
              </div>
              <blockquote className="font-serif italic text-base sm:text-lg md:text-xl font-medium text-amber-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] leading-snug">
                « {translateHouseMotto(hInfo.lema, lang)} »
              </blockquote>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-3 text-xs font-mono mt-4">
            {!adult && !recognized && (
              <>
                <div>
                  <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.casa}</div>
                  {studentMenu ? (
                    <div className="mt-2 flex justify-center">{houseMenu("tag-house-other")}</div>
                  ) : (
                    <div className="font-magic text-sm font-bold text-amber-300 uppercase tracking-wider mt-0.5">{hInfo.nombre}</div>
                  )}
                </div>
                <div>
                  <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelMotto}</div>
                  <div className="text-amber-300 font-serif italic text-sm mt-0.5">« {translateHouseMotto(hInfo.lema, lang)} »</div>
                </div>
              </>
            )}
            <div>
              <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelProvenance}</div>
              <div className="text-neutral-200 mt-0.5">{lore.procedencia}</div>
            </div>
            <div>
              <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelColors}</div>
              <div className="text-neutral-200 mt-0.5">{lore.colores}</div>
            </div>
            <div>
              <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelElement}</div>
              <div className="text-neutral-200 mt-0.5">{lore.elemento}</div>
            </div>
            <div>
              <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{t.labelTotem}</div>
              <div className="text-neutral-200 mt-0.5">{lore.totem}</div>
            </div>
          </div>
        </>
      ) : (
        !isQuickEditing && (
          <div className="font-magic text-sm font-bold text-amber-300 uppercase tracking-wider break-words">{house}</div>
        )
      )}
    </div>
  );
}
