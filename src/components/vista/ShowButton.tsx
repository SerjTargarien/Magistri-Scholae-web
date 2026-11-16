/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Mostrar» on a sheet's top bar (7a): one click puts the sheet (what was prepared for it, or its
// photo and name) on the players' view. While it is showing it reads «En la vista» and glows;
// pressing it again shows or hides the panel.
import React from "react";
import { Monitor } from "lucide-react";
import { VISTA_TEXT, type Language } from "../../localization";

export interface ShowToPlayers { showing: boolean; busy: boolean; onShow: () => void }

export function ShowButton({ lang, id, show }: { lang: Language; id: string; show: ShowToPlayers }) {
  const x = VISTA_TEXT[lang];
  return (
    <button type="button" id={id} disabled={show.busy} onClick={show.onShow} title={x.showTitle} aria-label={show.showing ? x.showing : x.showTitle}
      className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[40px] transition-all cursor-pointer select-none disabled:opacity-60 border ${
        show.showing
          ? "border-[#e5a93c] bg-[rgba(42,29,16,0.9)] text-[#f5b841] shadow-[0_0_12px_rgba(229,169,60,0.3)]"
          : "border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-neutral-100 hover:border-[#f3d88c]"}`}>
      <Monitor className={`w-4 h-4 shrink-0 ${show.showing ? "text-[#f5b841]" : "text-amber-400"}`} />
      <span className="hidden sm:inline">{show.showing ? x.showing : x.show}</span>
    </button>
  );
}
