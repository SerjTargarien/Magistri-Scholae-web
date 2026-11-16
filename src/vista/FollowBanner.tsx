/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The players' banner (7a; approved demo): when the Máster lets players follow the view in the
// app, players of the session's partida see a banner on their main list while something shows;
// «Ver» opens it full screen, as on the screen the table sees. The banner asks every 5 seconds
// while the list is visible (slower than the screen; nothing to press in a hurry).
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Monitor, X } from "lucide-react";
import type { ApiViewNow } from "../contracts/api-v1";
import { followPhotoUrl } from "../remote/assets";
import { valueText, type VistaApi } from "../account/vista";
import { TRANSLATIONS, VISTA_TEXT, type Language } from "../localization";
import { ViewContent } from "./ViewContent";

const POLL = 5000;

export function FollowBanner({ lang, api, campaignId, campaignName }: { lang: Language; api: VistaApi; campaignId: string; campaignName: string }) {
  const x = VISTA_TEXT[lang];
  const [view, setView] = useState<{ revision: number; now: ApiViewNow | null }>();
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 700px) and (min-aspect-ratio: 1/1)").matches);

  useEffect(() => {
    let stop = false, timer = 0, last = "";
    const ask = async () => {
      if (stop) return;
      if (document.visibilityState === "visible") {
        try { const next = await api.following(); const key = JSON.stringify(next); if (key !== last) { last = key; setView(next); } } catch { /* try again later */ }
      }
      if (!stop) timer = window.setTimeout(ask, POLL);
    };
    void ask();
    return () => { stop = true; window.clearTimeout(timer); };
  }, [api]);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 700px) and (min-aspect-ratio: 1/1)");
    const change = () => setWide(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);
  useEffect(() => { if (!view?.now) setOpen(false); }, [view?.now]);

  const now = view?.now;
  if (!now) return null;
  const name = valueText("nombre", (now.items.find(i => i.kind === "field" && i.path === "nombre") as { value?: unknown } | undefined)?.value);
  const photo = now.photo ? followPhotoUrl(campaignId, view!.revision) : undefined;
  return (
    <>
      <div id="vista-follow-banner" role="status" className="flex flex-wrap items-center gap-3 px-3 py-2.5 mb-4 rounded-xl border border-[#e5a93c] bg-[rgba(42,29,16,0.9)] shadow-[0_0_12px_rgba(229,169,60,0.3)]">
        {photo && <img src={photo} alt="" className="w-10 aspect-[3/4] object-cover rounded-md border border-[#c8a248] shrink-0" />}
        <div className="flex-1 min-w-0 text-[13px] text-[#f5b841]">
          {name && <b className="block font-magic text-[13px] tracking-[0.06em] uppercase text-[#fce8a6] break-words">{name}</b>}
          {x.bannerText}
        </div>
        <button type="button" id="btn-vista-follow" onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 min-h-10 px-3.5 rounded-lg border border-[#9b7424] bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] text-[#1a1105] text-xs font-bold cursor-pointer">
          <Monitor className="w-4 h-4" />{x.open}
        </button>
      </div>
      {/* Over everything (banners included): in the document's own layer, not the page's. */}
      {open && createPortal(
        <div id="vista-follow-view" role="dialog" aria-modal="true" aria-label={x.title} className="fixed inset-0 z-[70] bg-[#07040b] [container-type:inline-size] overflow-hidden"
          style={{ backgroundImage: "radial-gradient(ellipse 70% 60% at 30% 40%, rgba(212,175,55,0.10), transparent 70%)" }}>
          <ViewContent lang={lang} now={now} photoUrl={photo} campaignName={campaignName} layout={wide ? "screen" : "phone"} />
          <button type="button" id="btn-vista-follow-close" onClick={() => setOpen(false)} aria-label={TRANSLATIONS[lang].pickerClose} title={TRANSLATIONS[lang].pickerClose}
            className="absolute top-[max(12px,env(safe-area-inset-top))] right-3 w-11 h-11 grid place-items-center rounded-lg border border-amber-600/50 bg-[#130f1e]/90 text-amber-300 cursor-pointer z-10">
            <X className="w-5 h-5" />
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}
