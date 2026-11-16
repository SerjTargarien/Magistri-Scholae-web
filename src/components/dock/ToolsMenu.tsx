/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Herramientas» (owner, 16 November 2026; product-design.md 10e; approved demo, draft b): the
// Máster's tools behind one button in the main list's top bar. Two groups: «Paneles», the side
// panels, each with a switch (the menu stays open); and «Pantallas», screens that open in place of
// the list, each with a chevron (the menu closes). Under the button on a wide screen, like the
// search's «Todo» menu; a sheet from the bottom on a phone. «Esc», a tap outside or «×» closes it.
// The button shows how many panels are open, and a green dot while the players' view is live.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Wrench, X } from "lucide-react";
import { Switch } from "../Toggle";

const PHONE = 640;
const WIDTH = 380;

export interface ToolPanel { id: string; icon: React.ReactNode; label: string; hint?: React.ReactNode; on: boolean; onToggle: (on: boolean) => void; extra?: React.ReactNode }
export interface ToolScreen { id: string; icon: React.ReactNode; label: string; hint?: string; onOpen: () => void }

export function ToolsMenu({ texts, panels, screens, live }: {
  texts: { title: string; panels: string; screens: string; close: string; liveLabel: string };
  panels: ToolPanel[];
  screens: ToolScreen[];
  /** The players' view shows something now. */
  live: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [place, setPlace] = useState<{ top: number; left: number }>();
  const anchor = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const count = panels.filter(p => p.on).length;

  const close = (refocus = true) => { setOpen(false); if (refocus) anchor.current?.focus(); };
  useLayoutEffect(() => {
    if (!open || !anchor.current) return;
    const narrow = window.innerWidth < PHONE;
    setPhone(narrow);
    if (!narrow) {
      const r = anchor.current.getBoundingClientRect();
      setPlace({ top: r.bottom + 8, left: Math.max(12, Math.min(window.innerWidth - WIDTH - 12, r.right - WIDTH)) });
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    box.current?.querySelector<HTMLElement>("button")?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    const resize = () => close(false);
    window.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("resize", resize); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button
        ref={anchor}
        id="btn-tools"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        title={texts.title}
        className={`academy-header-btn relative flex items-center justify-center gap-1 px-3.5 py-2 rounded-lg transition-all font-mono text-xs cursor-pointer min-h-[38px] ${open ? "!border-[#e5a93c] !bg-[rgba(42,29,16,0.9)] text-[#f5b841] shadow-[0_0_12px_rgba(229,169,60,0.3)]" : "text-neutral-200 hover:text-amber-200"}`}
      >
        <Wrench className="w-4 h-4 mr-0.5 md:mr-1.5 text-amber-400" />
        <span className="hidden md:inline">{texts.title}</span>
        {count > 0 && <span id="btn-tools-count" className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#d4af37] text-[#1a1105] font-mono text-[10px] font-bold leading-[18px] text-center">{count}</span>}
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
        {live && <span id="btn-tools-live" aria-label={texts.liveLabel} className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />}
      </button>
      {open && createPortal(
        <>
          <div className={`fixed inset-0 z-[60] ${phone ? "bg-black/70" : ""}`} onPointerDown={e => { e.preventDefault(); close(); }} />
          <div
            ref={box}
            id="tools-menu"
            role="dialog"
            aria-label={texts.title}
            style={phone ? undefined : { top: place?.top ?? 0, left: place?.left ?? 0, width: WIDTH }}
            className={phone
              ? "fixed z-[61] inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-b-0 border-amber-600/50 bg-[#150f22] shadow-[0_-12px_40px_rgba(0,0,0,0.7)] px-3 pt-1.5 pb-[calc(12px+env(safe-area-inset-bottom,0px))] grid gap-1"
              : "fixed z-[61] max-h-[calc(100vh-96px)] overflow-y-auto rounded-xl border border-amber-600/50 bg-[#150f22] shadow-[0_18px_44px_rgba(0,0,0,0.8)] p-2 grid gap-1"}
          >
            {phone && <div className="w-10 h-1 rounded bg-neutral-700 mx-auto mt-1 mb-1" aria-hidden="true" />}
            <div className="flex items-center justify-between gap-2 pl-2.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">{texts.title}</span>
              <button type="button" id="tools-menu-close" onClick={() => close()} aria-label={texts.close} title={texts.close}
                className="w-8 h-8 grid place-items-center rounded-md text-neutral-400 hover:text-amber-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            {panels.length > 0 && <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 px-2.5 pt-1">{texts.panels}</div>}
            {panels.map(p => (
              <div key={p.id} className="grid gap-1">
                <Switch id={`tool-${p.id}`} checked={p.on} onChange={p.onToggle}
                  label={<span className="flex items-center gap-2.5"><span className="w-8 h-8 shrink-0 grid place-items-center rounded-lg border border-[#c8a248]/35 bg-neutral-950/40 text-amber-400">{p.icon}</span><span className="font-semibold text-[13px] text-neutral-100 break-words">{p.label}</span></span>}
                  hint={p.hint ? <span className="block pl-[42px]">{p.hint}</span> : undefined} />
                {p.extra}
              </div>
            ))}
            {screens.length > 0 && <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 px-2.5 pt-2">{texts.screens}</div>}
            {screens.map(s => (
              <button key={s.id} type="button" id={`tool-${s.id}`} onClick={() => { setOpen(false); s.onOpen(); }}
                className="flex items-center gap-2.5 w-full min-h-12 px-2 py-1 rounded-lg border border-transparent text-left cursor-pointer hover:border-amber-600/30 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                <span className="w-8 h-8 shrink-0 grid place-items-center rounded-lg border border-[#c8a248]/35 bg-neutral-950/40 text-amber-400">{s.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-[13px] text-neutral-100 break-words">{s.label}</span>
                  {s.hint && <span className="block text-[11px] text-neutral-400">{s.hint}</span>}
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
