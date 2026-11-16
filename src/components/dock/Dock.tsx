/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The Máster's side panels (owner, 16 November 2026; product-design.md 10d). With no panel open
// the page is exactly as before. With panels open, the content (the main list or a sheet) takes
// the left and the panels a column on the right, together using the whole width; on a narrower
// screen the content narrows (nothing is covered); below 1024 px the panels are a sheet from the
// bottom. Panels stack, each can be folded or closed, and stay open across screens. The content's
// own width is measured and given to its layout as two flags (`group/content` with data-wide at
// 1152 px and data-roomy at 1340 px), so a narrower column beside the panels lays out for its own
// width. (Not a CSS size container: containment would make every fixed dialog inside it position
// against the content instead of the screen.)
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";

const WIDE = "(min-width: 1024px)";

function useWide() {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(WIDE).matches);
  useEffect(() => {
    const query = window.matchMedia(WIDE);
    const change = () => setWide(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  return wide;
}

/** The same elements whether or not panels are open, so the content never remounts. */
export function DockLayout({ panels, children, uncap, label }: {
  panels: React.ReactNode[];
  children: React.ReactNode;
  /** The main list and the sheets drop their width cap beside the panels; other screens keep their own column. */
  uncap: boolean;
  /** The panel column's name for screen readers. */
  label: string;
}) {
  const wide = useWide();
  const content = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = content.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const open = panels.filter(Boolean);
  const docked = open.length > 0;
  return (
    <div id="dock-layout" data-docked={docked ? (wide ? "side" : "bottom") : "none"} className={docked && wide ? "flex items-start gap-5 pr-4" : ""}>
      {/* Beside the panels the screen's own width cap goes, so content and panels use the whole width. */}
      {/* As wide as the screens' own box (max-w-7xl) when nothing is docked, so the measured width matches today's layout;
          beside the panels it takes the rest of the width. */}
      <div ref={content} data-wide={width >= 1152} data-roomy={width >= 1340}
        className={`group/content min-w-0 ${docked && wide ? `flex-1 ${uncap ? "[&>*]:max-w-none" : ""}` : "w-full max-w-7xl mx-auto"} ${docked && !wide ? "pb-[45vh]" : ""}`}>{children}</div>
      {docked && (
        <aside
          id="dock"
          aria-label={label}
          className={wide
            ? "w-[340px] xl:w-[380px] 2xl:w-[400px] shrink-0 sticky top-4 mt-6 max-h-[calc(100vh-2rem)] overflow-y-auto grid gap-3.5 content-start pb-4"
            : "fixed inset-x-0 bottom-0 z-40 max-h-[62vh] overflow-y-auto rounded-t-2xl border border-b-0 border-[#c89d3c]/55 bg-[#150f22] shadow-[0_-12px_40px_rgba(0,0,0,0.7)] pb-[calc(10px+env(safe-area-inset-bottom,0px))] divide-y divide-[#c8a248]/35"}
        >
          {!wide && <div className="w-10 h-1 rounded bg-neutral-700 mx-auto mt-2 mb-1" aria-hidden="true" />}
          {open}
        </aside>
      )}
    </div>
  );
}

export function DockPanel({ id, icon, title, live, folded, onFold, onClose, texts, children }: {
  id: string;
  icon: React.ReactNode;
  title: string;
  /** Showing something to the players: the panel glows. */
  live?: boolean;
  folded: boolean;
  onFold: () => void;
  onClose: () => void;
  texts: { fold: string; unfold: string; close: string };
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-label={title}
      className={`lg:rounded-2xl lg:border bg-[#150f22] lg:shadow-[0_12px_32px_rgba(0,0,0,0.7)] ${live ? "lg:border-[#e5a93c] lg:shadow-[0_0_12px_rgba(229,169,60,0.3),0_12px_32px_rgba(0,0,0,0.7)]" : "lg:border-[#c89d3c]/55"}`}>
      <div className={`flex items-center gap-2 pl-3.5 pr-2 py-2.5 ${folded ? "" : "border-b border-[#c8a248]/35"}`}>
        <h2 className="flex-1 min-w-0 flex items-center gap-2 font-magic text-xs font-bold tracking-[0.1em] uppercase text-amber-400">{icon}<span className="break-words">{title}</span></h2>
        <button type="button" id={`${id}-fold`} onClick={onFold} aria-expanded={!folded} title={folded ? texts.unfold : texts.fold} aria-label={folded ? texts.unfold : texts.fold}
          className="w-8 h-8 grid place-items-center rounded-md text-neutral-400 hover:text-amber-400 cursor-pointer">
          {folded ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
        </button>
        <button type="button" id={`${id}-close`} onClick={onClose} title={texts.close} aria-label={texts.close}
          className="w-8 h-8 grid place-items-center rounded-md text-neutral-400 hover:text-amber-400 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      {!folded && <div className="p-3 grid gap-3">{children}</div>}
    </section>
  );
}
