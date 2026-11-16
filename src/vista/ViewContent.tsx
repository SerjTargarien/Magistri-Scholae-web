/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// What the players' view shows (7a; product-design.md 10d, approved demo): on a wide screen the
// photo fills the height on the left and the values sit on the right, readable from half across
// the room; on a phone, one column. The name keeps one line, shrinking to 55 % of its size (never
// below the values) before it wraps; nothing is ever cut. Sizes follow the width of the parent,
// which must be a size container (container-type: inline-size) and positioned.
import React, { useLayoutEffect, useRef } from "react";
import type { ApiViewNow } from "../contracts/api-v1";
import { itemLabel, valueText } from "../account/vista";
import type { Language } from "../localization";

const CREST = (
  <svg viewBox="0 0 100 120" aria-hidden="true" className="w-full h-auto">
    <path d="M50 4 92 20v36c0 30-19 50-42 60C27 106 8 86 8 56V20z" fill="rgba(212,175,55,0.12)" stroke="#d4af37" strokeWidth="3" />
    <path d="M50 22v76M24 50h52" stroke="#d4af37" strokeWidth="2.5" opacity="0.7" />
    <circle cx="50" cy="50" r="9" fill="none" stroke="#d4af37" strokeWidth="2.5" />
  </svg>
);

/** Shrinks each name to keep one line, down to 55 % of its size, and lets it wrap only past that. */
function useFittedNames(box: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const width = el.clientWidth;
      el.querySelectorAll<HTMLElement>("[data-view-name]").forEach((name) => {
        const max = parseFloat(name.dataset.viewName ?? "0.056") * width, min = max * 0.55;
        name.style.whiteSpace = "nowrap";
        let size = max;
        name.style.fontSize = `${size}px`;
        while (name.scrollWidth > name.clientWidth + 1 && size > min) { size = Math.max(min, size * 0.95); name.style.fontSize = `${size}px`; }
        if (name.scrollWidth > name.clientWidth + 1) name.style.whiteSpace = "normal";
      });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    void document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export function ViewContent({ lang, now, photoUrl, campaignName, layout }: {
  lang: Language;
  now: ApiViewNow | null;
  photoUrl?: string;
  campaignName: string;
  layout: "screen" | "phone";
}) {
  const box = useRef<HTMLDivElement>(null);
  useFittedNames(box, [now, layout, photoUrl]);
  const phone = layout === "phone";
  const items = now?.items ?? [];
  const photo = !!now?.photo && !!photoUrl && items.some((i) => i.kind === "photo");
  const rest = items.filter((i) => i.kind !== "photo");
  const centred = !photo;

  if (!now || !items.length) {
    return (
      <div ref={box} id="view-waiting" className="absolute inset-0 grid place-content-center justify-items-center gap-[2cqw] text-center">
        <div className={phone ? "w-[34cqw] opacity-50" : "w-[14cqw] opacity-55"}>{CREST}</div>
        <div className={`font-magic font-bold uppercase text-[#fce8a6]/45 ${phone ? "text-[4.2cqw] tracking-[0.2em]" : "text-[2.4cqw] tracking-[0.3em]"} break-words px-[4cqw]`}>{campaignName}</div>
      </div>
    );
  }

  const parts = rest.map((item, i) => {
    if (item.kind === "field" && item.path === "nombre") {
      return <h1 key={i} data-view-name={phone ? "0.085" : "0.056"} className={`font-magic font-bold uppercase text-[#fce8a6] leading-[1.05] tracking-[0.06em] [text-shadow:0_0_2cqw_rgba(212,175,55,0.4)] min-w-0 [overflow-wrap:anywhere] ${phone ? "text-center" : ""}`}>{valueText(item.path, item.value)}</h1>;
    }
    if (item.kind === "field") {
      const value = valueText(item.path, item.value);
      if (!value) return null;
      return (
        <div key={i} className={`grid gap-[0.5cqw] min-w-0 ${phone ? "text-center" : ""}`}>
          <div className={`font-mono font-semibold uppercase text-amber-400 tracking-[0.14em] ${phone ? "text-[3.6cqw]" : "text-[1.55cqw]"}`}>{itemLabel(now.sheetKind, item.path, item.value, lang)}</div>
          <div className={`font-medium text-neutral-100 leading-tight [overflow-wrap:anywhere] ${phone ? "text-[5.6cqw]" : "text-[2.9cqw]"}`}>{value}</div>
        </div>
      );
    }
    return (
      <p key={i} className={`font-serif italic text-[#f0e6d0] leading-snug [overflow-wrap:anywhere] ${phone ? "text-[6.4cqw] text-center" : `text-[3.4cqw] ${centred ? "" : "border-l-[0.35cqw] border-[#d4af37] pl-[1.8cqw]"}`}`}>{item.value}</p>
    );
  });

  if (phone) {
    return (
      <div ref={box} id="view-content" data-layout="phone" className="absolute inset-0 overflow-y-auto px-[6cqw] py-[7cqw] grid gap-[4cqw] content-start">
        {photo && <img src={photoUrl} alt="" className="w-full aspect-[3/4] object-cover rounded-[3cqw] border-[1cqw] border-[#c8a248]" />}
        {parts}
      </div>
    );
  }
  return (
    <div ref={box} id="view-content" data-layout="screen" className={`absolute inset-0 flex items-center gap-[4.5cqw] px-[5cqw] py-[4cqw] ${centred ? "justify-center" : ""}`}>
      {photo && <img src={photoUrl} alt="" className="h-full aspect-[3/4] object-cover shrink-0 rounded-[1.2cqw] border-[0.45cqw] border-[#c8a248] shadow-[0_0_3cqw_rgba(212,175,55,0.25)]" />}
      {parts.length > 0 && <div className={`grid gap-[2.2cqw] min-w-0 content-center ${centred ? "text-center max-w-full" : "flex-1 grid-cols-[minmax(0,1fr)]"}`}>{parts}</div>}
    </div>
  );
}
