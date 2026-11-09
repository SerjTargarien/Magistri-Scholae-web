/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The tag menu (product-design.md, Controls, control 7; adopted 9 November 2026):
// a value already on a row, shown as a coloured tag. Whoever may change it taps
// the tag and picks from a small menu in the app's style: beside the tag on wide
// screens, a sheet from the bottom on phones. Readers see the plain tag. Never a
// browser-drawn selector.
import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type TagOption<T extends string> = {
  value: T;
  label: string;
  /** A second line in the menu. */
  hint?: string;
  /** The tag's colours for this value; none draws the value as plain text in the menu. */
  tone?: string;
};

/** Tags keep their natural width; a value too long for the row wraps to a second line, never cut with «…» (owner, 9 November 2026). */
const TAG = "inline-flex items-center gap-1 max-w-full min-h-6 px-2 py-0.5 rounded-full border font-mono text-[10px] leading-tight font-bold uppercase tracking-wide text-left break-words";
/** An empty tag looks like the others, only dashed and quieter (owner, 9 November 2026). */
const EMPTY = "border-dashed border-neutral-600 bg-neutral-900/60 text-neutral-500";
const PLAIN = "border-neutral-700 bg-neutral-900/60 text-neutral-300";
/** The tappable area reaches 40 px even though the tag is smaller (Controls, touch rule). */
export const HIT = "relative after:absolute after:content-[''] after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-[max(100%,40px)] after:h-[max(100%,40px)]";
const PHONE = 640;

export function TagMenu<T extends string>({ id, title, value, options, emptyLabel, editable, onChange }: {
  /** The tag's id; menu items are `${id}-option-${value || "none"}`. */
  id: string;
  /** The menu's heading and the tag's accessible name. */
  title: string;
  value: T | undefined;
  options: TagOption<T>[];
  /** Shown when there is no value yet. */
  emptyLabel: string;
  editable: boolean;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  // An empty value (undefined or "") shows the empty tag; a «none» option may still be offered in the menu.
  const current = value ? options.find((o) => o.value === value) : undefined;
  const text = current?.label ?? emptyLabel;

  if (!editable) {
    if (!current) return null;
    return (
      <span id={id} title={title} className={`${TAG} ${current.tone ?? PLAIN}`}>
        <span className="min-w-0">{current.label}</span>
      </span>
    );
  }

  const close = () => {
    setOpen(false);
    anchor.current?.focus();
  };
  return (
    <>
      <button
        id={id}
        ref={anchor}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${title}: ${text}`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`${TAG} ${HIT} ${current ? current.tone ?? PLAIN : EMPTY} cursor-pointer transition-colors hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950`}
      >
        <span className="min-w-0">{text}</span>
        <ChevronDown className="w-3 h-3 shrink-0 opacity-80" aria-hidden="true" />
      </button>
      {open && createPortal(
        <Menu id={id} title={title} value={value} options={options} anchor={anchor.current}
          onPick={(v) => { onChange(v); close(); }} onClose={close} />,
        document.body,
      )}
    </>
  );
}

function Menu<T extends string>({ id, title, value, options, anchor, onPick, onClose }: {
  id: string; title: string; value: T | undefined; options: TagOption<T>[]; anchor: HTMLElement | null;
  onPick: (value: T) => void; onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [phone] = useState(() => window.innerWidth < PHONE);
  const [place, setPlace] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    if (!phone && anchor) {
      const r = anchor.getBoundingClientRect();
      const w = el.offsetWidth, h = el.offsetHeight;
      const left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
      let top = r.bottom + 6;
      if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
      setPlace({ left, top });
    }
    const items = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
    (items.find((b) => b.getAttribute("aria-checked") === "true") ?? items[0])?.focus();
    const away = () => onClose();
    window.addEventListener("resize", away);
    return () => window.removeEventListener("resize", away);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(box.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const go = (n: number) => { e.preventDefault(); items[(n + items.length) % items.length]?.focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(items.length - 1);
    else if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); onClose(); }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] ${phone ? "bg-black/70" : ""}`}
        onPointerDown={(e) => { e.preventDefault(); onClose(); }}
        aria-hidden="true"
      />
      <div
        ref={box}
        id={`${id}-menu`}
        role="menu"
        aria-label={title}
        onKeyDown={onKeyDown}
        style={phone ? undefined : { left: place?.left ?? -9999, top: place?.top ?? 0 }}
        className={phone
          ? "fixed z-[61] inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-b-0 border-amber-600/50 bg-[#150f22] shadow-[0_-12px_40px_rgba(0,0,0,0.7)] px-2.5 pt-1.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] grid gap-0.5"
          : "fixed z-[61] min-w-[200px] max-w-[min(320px,calc(100vw-32px))] rounded-xl border border-amber-600/50 bg-[#150f22] shadow-[0_18px_44px_rgba(0,0,0,0.8)] p-1.5 grid gap-0.5"}
      >
        {phone && <div className="w-10 h-1 rounded bg-neutral-700 mx-auto mt-1 mb-1.5" aria-hidden="true" />}
        <div className="px-2.5 pt-2 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{title}</div>
        {options.map((o) => {
          const chosen = o.value === (value ?? "");
          return (
            <button
              key={o.value || "none"}
              id={`${id}-option-${o.value || "none"}`}
              type="button"
              role="menuitemradio"
              aria-checked={chosen}
              onClick={() => onPick(o.value)}
              className="flex items-center gap-2.5 w-full min-h-10 px-2.5 py-1 rounded-lg border border-transparent text-left text-[13px] text-neutral-200 hover:bg-white/5 hover:border-amber-600/30 focus:outline-none focus-visible:bg-white/5 focus-visible:border-amber-600/40 cursor-pointer"
            >
              <span className="min-w-0">
                {o.tone ? <span className={`${TAG} ${o.tone}`}>{o.label}</span> : <span>{o.label}</span>}
                {o.hint && <span className="block text-[11px] text-neutral-400 mt-0.5">{o.hint}</span>}
              </span>
              {chosen && <Check className="w-4 h-4 ml-auto shrink-0 text-amber-400" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </>
  );
}
