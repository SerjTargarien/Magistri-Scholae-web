/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import type { ApiSheetProjection } from "../contracts/api-v1";
import type { CharacterSheet, FamiliarSheet } from "../model/sheet";
import type { CharacterListProps } from "../account/screens";
import { HOUSES } from "../data/gameData";
import { imageSrc } from "../remote/assets";
import { getCharacterVisualTheme } from "../utils/characterVisualTheme";
import { CAMPAIGN_SKILLS_TEXT, NOTES_TEXT, TRANSLATIONS } from "../localization";
import { FiligreeCorner, CardCornerOrnament } from "./AcademyOrnaments";
import { HouseCrest } from "./HouseCrest";
import type { Language } from "../model/catalogue";
import {
  Plus,
  Settings,
  NotebookPen,
  ListChecks,
  Search,
  BadgeHelp,
  Coins,
  Award,
  PawPrint
} from "lucide-react";

/** Experience on a card: exact up to 99,999, short above («250 mil», «1 M») so it fits a third of the card. */
const cardCount = (value: number | undefined, lang: Language) =>
  (value ?? 0) < 100_000
    ? String(value ?? 0)
    : new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value ?? 0);

const characterFields = (item: ApiSheetProjection) => item.fields as CharacterSheet;
const familiarFields = (item: ApiSheetProjection) => item.fields as FamiliarSheet;

export const CharacterList: React.FC<CharacterListProps> = ({
  lang,
  characters,
  familiars = [],
  onSelectCharacter,
  onSelectFamiliar,
  onAddCharacter,
  onOpenSettings,
  onOpenNotes,
  onOpenCampaignSkills,
}) => {
  const t = TRANSLATIONS[lang];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHouseFilter, setSelectedHouseFilter] = useState<string>("ALL");

  /** The character a familiar is bonded to, when this viewer can see it. */
  const bondedCharacter = (familiar: ApiSheetProjection) =>
    familiar.bondId ? characters.find((c) => c.id === familiar.bondId) : undefined;

  // Filter & Search Logic
  const filteredCharacters = characters.filter((item) => {
    if (selectedHouseFilter === "FAMILIARS") {
      return false;
    }

    const c = characterFields(item);
    const charType = c.characterType ?? "student";

    // House / Type filter
    if (selectedHouseFilter === "ADULT_WIZARD") {
      if (charType !== "adult_wizard") {
        return false;
      }
    } else if (selectedHouseFilter !== "ALL") {
      if (charType === "adult_wizard") {
        const formerHouse = (c.adultWizardProfile?.formerHouse || "").trim().toUpperCase();
        const houseDisplayName = (HOUSES[selectedHouseFilter]?.nombre || "").toUpperCase();
        if (
          !formerHouse ||
          (!formerHouse.includes(selectedHouseFilter) && (!houseDisplayName || !formerHouse.includes(houseDisplayName)))
        ) {
          return false;
        }
      } else if ((c.casa || "").toUpperCase() !== selectedHouseFilter) {
        return false;
      }
    }

    // Search query matches name, concept, player, or adult wizard role/institution
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchName = (c.nombre || "").toLowerCase().includes(query);
      const matchJugador = (c.jugador || "").toLowerCase().includes(query);
      const matchConcept = (c.concepto || "").toLowerCase().includes(query);
      const matchRole = (c.adultWizardProfile?.role || "").toLowerCase().includes(query);
      const matchInst = (c.adultWizardProfile?.institution || "").toLowerCase().includes(query);
      return matchName || matchJugador || matchConcept || matchRole || matchInst;
    }

    return true;
  });

  const filteredFamiliars = familiars.filter((item) => {
    if (selectedHouseFilter !== "ALL" && selectedHouseFilter !== "FAMILIARS") {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const f = familiarFields(item);
      const linkedStudent = bondedCharacter(item);
      const matchName = (f.nombre || "").toLowerCase().includes(query);
      const matchSpecies = (f.especie || "").toLowerCase().includes(query);
      const matchDesc = (f.descripcion || "").toLowerCase().includes(query);
      const matchStudent = ((linkedStudent && characterFields(linkedStudent).nombre) || "").toLowerCase().includes(query);
      return matchName || matchSpecies || matchDesc || matchStudent;
    }

    return true;
  });

  const hasAnyResults = filteredCharacters.length > 0 || filteredFamiliars.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6" id="character-list-container">
      {/* Top Header with App Branding and global controllers */}
      <div
        className={`flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-2`}
      >
        <div className="flex items-center gap-3.5 text-center md:text-left">
          {/* School Crest */}
          <img
            src="/icon.svg"
            alt={t.crestAlt}
            className="w-14 h-14 object-contain drop-shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-magic text-2xl md:text-3xl text-neutral-100 uppercase tracking-widest glow-amber">
              {t.appName}
            </h1>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-400 tracking-wider">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Header Right menu with configuration */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {onOpenNotes && (
            <button
              id="btn-my-notes"
              onClick={onOpenNotes}
              className="academy-header-btn flex items-center justify-center px-3.5 py-2 rounded-lg text-neutral-200 hover:text-violet-200 transition-all font-mono text-xs cursor-pointer min-h-[38px]"
              title={NOTES_TEXT[lang].myNotes}
            >
              <NotebookPen className="w-4 h-4 mr-1 md:mr-2 text-violet-300" />
              <span className="hidden md:inline">{NOTES_TEXT[lang].myNotes}</span>
            </button>
          )}

          {onOpenCampaignSkills && (
            <button
              id="btn-campaign-skills"
              onClick={onOpenCampaignSkills}
              className="academy-header-btn flex items-center justify-center px-3.5 py-2 rounded-lg text-neutral-200 hover:text-amber-200 transition-all font-mono text-xs cursor-pointer min-h-[38px]"
              title={CAMPAIGN_SKILLS_TEXT[lang].title}
            >
              <ListChecks className="w-4 h-4 mr-1 md:mr-2 text-amber-400" />
              <span className="hidden md:inline">{CAMPAIGN_SKILLS_TEXT[lang].title}</span>
            </button>
          )}

          <button
            id="btn-settings"
            onClick={onOpenSettings}
            className="academy-header-btn flex items-center justify-center px-3.5 py-2 rounded-lg text-neutral-200 hover:text-amber-300 transition-all font-mono text-xs cursor-pointer min-h-[38px]"
            title={t.settings}
          >
            <Settings className="w-4 h-4 mr-1 md:mr-2 text-violet-400" />
            <span className="hidden md:inline">{t.settings}</span>
          </button>

          <button
            id="btn-add-character-header"
            onClick={onAddCharacter}
            className="academy-header-btn flex items-center gap-1.5 px-4 py-2 text-amber-300 hover:text-amber-200 font-bold rounded-lg text-xs md:text-sm transition-all cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{t.addCharacter}</span>
          </button>
        </div>
      </div>

      {/* Main Content Container (Ornate Filigree Frame in Academy Style) */}
      <div className="academy-outer-frame rounded-2xl p-4 sm:p-6 min-h-[620px]">
        <>
          <FiligreeCorner position="tl" size="lg" />
          <FiligreeCorner position="tr" size="lg" />
          <FiligreeCorner position="bl" size="lg" />
          <FiligreeCorner position="br" size="lg" />
        </>
        

        {/* Query Bar and House filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search box */}
            <div className={`relative flex-1 academy-search-frame rounded-xl`}>
              <>
                <FiligreeCorner position="tl" size="sm" />
                <FiligreeCorner position="tr" size="sm" />
                <FiligreeCorner position="bl" size="sm" />
                <FiligreeCorner position="br" size="sm" />
              </>
              
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
              <input
                id="search-input"
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-transparent border-none focus:ring-0 rounded-xl text-sm text-neutral-200 placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Quick house badge filter strip (Desktop & Mobile tap grid) */}
          <div className="flex flex-wrap gap-2 justify-center py-1">
            <button
              id="filter-badge-all"
              onClick={() => setSelectedHouseFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                selectedHouseFilter === "ALL"
                  ? "bg-[#2a1d10]/90 border-[#e5a93c] text-[#f5b841] shadow-[0_0_12px_rgba(229,169,60,0.3)]"
                  : "bg-[#110d1b]/90 border-[#c89d3c]/30 text-neutral-300 hover:border-[#c89d3c]/70 hover:text-amber-200"
              }`}
            >
              {t.filterAllHouses}
            </button>
            {Object.keys(HOUSES).map((hKey) => {
              const h = HOUSES[hKey];
              const isSelected = selectedHouseFilter === hKey;
              return (
                <button
                  id={`filter-badge-${hKey}`}
                  key={hKey}
                  onClick={() => setSelectedHouseFilter(hKey)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? "bg-[#2a1d10]/90 border-[#e5a93c] text-[#f5b841] shadow-[0_0_12px_rgba(229,169,60,0.3)]"
                      : "bg-[#110d1b]/90 border-[#c89d3c]/30 text-neutral-300 hover:border-[#c89d3c]/70 hover:text-amber-200"
                  }`}
                >
                  <HouseCrest house={hKey} variant="medallion" className="w-4 h-4" />
                  {h.nombre}
                </button>
              );
            })}
            <button
              id="filter-badge-adult-wizard"
              onClick={() => setSelectedHouseFilter("ADULT_WIZARD")}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
                selectedHouseFilter === "ADULT_WIZARD"
                  ? "bg-[#2a1d10]/90 border-[#e5a93c] text-[#f5b841] shadow-[0_0_12px_rgba(229,169,60,0.3)]"
                  : "bg-[#110d1b]/90 border-[#c89d3c]/30 text-neutral-300 hover:border-[#c89d3c]/70 hover:text-amber-200"
              }`}
            >
              <HouseCrest house="ADULT_WIZARD" isAdultWizard variant="medallion" className="w-4 h-4" />
              {t.filterAdultWizards}
            </button>
            <button
              id="filter-badge-familiars"
              onClick={() => setSelectedHouseFilter("FAMILIARS")}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
                selectedHouseFilter === "FAMILIARS"
                  ? "bg-[#2a1d10]/90 border-[#e5a93c] text-[#f5b841] shadow-[0_0_12px_rgba(229,169,60,0.3)]"
                  : "bg-[#110d1b]/90 border-[#c89d3c]/30 text-neutral-300 hover:border-[#c89d3c]/70 hover:text-amber-200"
              }`}
            >
              <PawPrint className="w-3.5 h-3.5 text-emerald-400" />
              {t.filterFamiliars}
            </button>
          </div>
        </div>

        {/* Characters & Familiars list grid display */}
        {hasAnyResults ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="characters-grid">
            {filteredCharacters.map((item) => {
              const c = characterFields(item);
              const casa = c.casa ?? "";
              const hInfo = HOUSES[casa.toUpperCase()] || HOUSES.IRATI;
              const characterType = c.characterType ?? "student";
              const theme = getCharacterVisualTheme({ characterType, casa });
              const avatarSrc = imageSrc(c.avatarImage);

              return (
                <div
                  id={`character-card-${item.id}`}
                  key={item.id}
                  onClick={() => onSelectCharacter(item.id)}
                  className="group academy-card rounded-2xl p-2.5 flex flex-col cursor-pointer select-none"
                >
                  <CardCornerOrnament position="tl" />
                  <CardCornerOrnament position="tr" />
                  <CardCornerOrnament position="bl" />
                  <CardCornerOrnament position="br" />

                  {/* Card Top - 3:4 Portrait inside Beveled Gold Inner Frame */}
                  <div className="relative aspect-[3/4] w-full bg-[#120d1a] rounded-t-xl border-2 border-[#c89d3c] shadow-[inset_0_0_18px_rgba(0,0,0,0.75)] overflow-hidden flex items-center justify-center">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={c.nombre}
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                          c.avatarFit === "contain" ? "object-contain bg-[#11091f]" : "object-cover"
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-b ${theme.bgClass} transition-colors flex flex-col justify-center items-center text-neutral-300 select-none p-4`}>
                        <HouseCrest
                          house={casa}
                          isAdultWizard={characterType === "adult_wizard"}
                          className="w-20 h-24 mb-2.5 group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-center text-[#f3d88c]/90">
                          {characterType === "adult_wizard"
                            ? t.characterTypeAdultWizard
                            : `${t.studentPrefix} • ${hInfo.nombre.toUpperCase()}`}
                        </span>
                      </div>
                    )}

                    {/* Subtle bottom vignette inside portrait so overlapping shield pops */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/65 to-transparent" />

                    {/* Year Tag / Adult Label */}
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#140e08]/95 text-[#fce8a6] border border-[#d4af37]/70 rounded-md flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
                      {characterType === "adult_wizard" ? t.characterTypeAdultWizardShort : c.curso}
                    </div>
                  </div>

                  {/* Overlapping Heraldic House Crest Medallion */}
                  <div className="relative z-20 -mt-7 -mb-4 h-13 flex items-center justify-center pointer-events-none">
                    <HouseCrest
                      house={casa}
                      isAdultWizard={characterType === "adult_wizard"}
                      className="w-11 h-13 group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Parchment Mid-Plate for Name & Concept Quote */}
                  <div className="academy-parchment-plate px-3 pt-5 pb-3 text-center flex-1 flex flex-col justify-center">
                    <h3 className="font-magic text-base font-bold text-[#1b1108] uppercase tracking-wider break-words">
                      {c.nombre || t.noName}
                    </h3>

                    {/* Subtle Gold Filigree Divider */}
                    <div className="flex items-center justify-center gap-1.5 my-1 opacity-75">
                      <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#8c6218]" />
                      <span className="w-1.5 h-1.5 rotate-45 bg-[#8c6218]" />
                      <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#8c6218]" />
                    </div>

                    {c.concepto ? (
                      <p className="font-serif italic text-[13px] leading-snug text-[#362415] line-clamp-2 min-h-[2.25rem]">
                        “{c.concepto}”
                      </p>
                    ) : (
                      <p className="font-serif italic text-xs text-[#6e553b] min-h-[2.25rem] flex items-center justify-center">
                        {t.noConceptDefined}
                      </p>
                    )}
                  </div>

                  {/* Dark Inset Bottom Footer Bar */}
                  <div className="mt-1.5 bg-[#18120c]/95 border border-[#b88c32]/70 rounded-b-xl px-2 py-2.5 grid grid-cols-3 divide-x divide-[#8c6d38]/35 text-center font-mono tabular-nums shadow-inner">
                    <div>
                      <div className="text-[9px] text-[#b8a68e] uppercase tracking-tight">{t.lblDestino}</div>
                      <div className="text-xs text-amber-400 font-bold flex items-center justify-center gap-1 mt-0.5 h-4">
                        <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                        {c.puntosDestino}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#b8a68e] uppercase tracking-tight">{t.lblExp}</div>
                      <div className="text-xs text-violet-400 font-bold flex items-center justify-center gap-1 mt-0.5 h-4" title={String(c.pxs ?? 0)}>
                        <Award className="w-3 h-3 text-violet-400 shrink-0" />
                        {cardCount(c.pxs, lang)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#b8a68e] uppercase tracking-tight">{t.jugador}</div>
                      <div className="text-[11px] text-[#f5ead4] font-semibold flex items-center justify-center text-center break-words min-w-0 max-w-full px-1 mt-0.5 min-h-4">
                        <span className="min-w-0 break-words">{c.jugador || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Familiar Cards */}
            {filteredFamiliars.map((item) => {
              const f = familiarFields(item);
              const linked = bondedCharacter(item);
              const linkedStudent = linked ? characterFields(linked) : undefined;
              const familiarSrc = imageSrc(f.imagen);

              return (
                <div
                  id={`familiar-card-${item.id}`}
                  key={item.id}
                  onClick={() => onSelectFamiliar(item.id)}
                  className="group academy-card rounded-2xl p-2.5 flex flex-col cursor-pointer select-none"
                >
                  <CardCornerOrnament position="tl" />
                  <CardCornerOrnament position="tr" />
                  <CardCornerOrnament position="bl" />
                  <CardCornerOrnament position="br" />

                  {/* Card Top - 3:4 Portrait inside Beveled Gold Inner Frame */}
                  <div className="relative aspect-[3/4] w-full bg-[#120d1a] rounded-t-xl border-2 border-[#c89d3c] shadow-[inset_0_0_18px_rgba(0,0,0,0.75)] overflow-hidden flex items-center justify-center">
                    {familiarSrc ? (
                      <img
                        src={familiarSrc}
                        alt={f.nombre}
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                          f.imageFit === "contain" ? "object-contain bg-[#11091f]" : "object-cover"
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-emerald-950/90 via-[#0e1f18] to-[#0a0612] transition-colors flex flex-col justify-center items-center text-neutral-300 select-none p-4">
                        <div className="w-20 h-20 rounded-full border-2 border-[#d4af37]/60 bg-emerald-950/60 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:scale-105 transition-transform duration-300">
                          <PawPrint className="w-10 h-10 text-emerald-400" />
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-center text-[#f3d88c]/90">
                          {`${t.familiarEditorCardTitle.toUpperCase()} • ${(f.especie || "—").toUpperCase()}`}
                        </span>
                      </div>
                    )}

                    {/* Subtle bottom vignette inside portrait so overlapping medallion pops */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/65 to-transparent" />
                  </div>

                  {/* Overlapping Heraldic Familiar Medallion */}
                  <div className="relative z-20 -mt-7 -mb-4 h-13 flex items-center justify-center pointer-events-none">
                    <div className="w-11 h-11 rounded-full border-2 border-[#d4af37] bg-gradient-to-b from-emerald-900 via-emerald-950 to-[#0b1510] shadow-[0_4px_10px_rgba(0,0,0,0.85)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <PawPrint className="w-5 h-5 text-[#f5d061]" />
                    </div>
                  </div>

                  {/* Parchment Mid-Plate for Name & Description Quote */}
                  <div className="academy-parchment-plate px-3 pt-5 pb-3 text-center flex-1 flex flex-col justify-center">
                    <h3 className="font-magic text-base font-bold text-[#1b1108] uppercase tracking-wider break-words">
                      {f.nombre || t.noName}
                    </h3>

                    {/* Subtle Gold Filigree Divider */}
                    <div className="flex items-center justify-center gap-1.5 my-1 opacity-75">
                      <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#8c6218]" />
                      <span className="w-1.5 h-1.5 rotate-45 bg-[#8c6218]" />
                      <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#8c6218]" />
                    </div>

                    {f.descripcion ? (
                      <p className="font-serif italic text-[13px] leading-snug text-[#362415] line-clamp-2 min-h-[2.25rem]">
                        “{f.descripcion}”
                      </p>
                    ) : (
                      <p className="font-serif italic text-xs text-[#6e553b] min-h-[2.25rem] flex items-center justify-center">
                        {t.noDescriptionDefined}
                      </p>
                    )}
                  </div>

                  {/* Dark Inset Bottom Footer Bar */}
                  <div className="mt-1.5 bg-[#18120c]/95 border border-[#b88c32]/70 rounded-b-xl px-2 py-2.5 grid grid-cols-2 divide-x divide-[#8c6d38]/35 text-center font-mono tabular-nums shadow-inner">
                    <div>
                      <div className="text-[9px] text-[#b8a68e] uppercase tracking-tight">{t.familiarSpeciesShort}</div>
                      <div className="text-xs text-emerald-400 font-bold flex items-center justify-center text-center break-words min-w-0 max-w-full px-1 mt-0.5 min-h-4">
                        <span className="min-w-0 break-words">{f.especie || "—"}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#b8a68e] uppercase tracking-tight">{t.familiarBondLabel}</div>
                      <div className="text-[11px] text-[#f5ead4] font-semibold flex items-center justify-center text-center break-words min-w-0 max-w-full px-1 mt-0.5 min-h-4">
                        <span className="min-w-0 break-words">{linkedStudent ? linkedStudent.nombre : t.familiarUnbound}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="glass-panel p-12 text-center rounded-2xl border border-violet-500/15 max-w-lg mx-auto mt-12" id="empty-list-state">
            <BadgeHelp className="w-16 h-16 text-violet-400/50 mx-auto mb-4 animate-bounce" />
            <h3 className="font-magic text-lg text-neutral-200 uppercase tracking-widest glow-violet">
              {t.emptyRecords}
            </h3>
            <p className="text-sm text-neutral-400 font-sans mt-2">
              {t.noCharacters}
            </p>
            <button
              id="btn-add-character-empty"
              onClick={onAddCharacter}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-500/90 text-neutral-950 font-black rounded-xl text-sm transition-all focus:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t.addCharacter}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

