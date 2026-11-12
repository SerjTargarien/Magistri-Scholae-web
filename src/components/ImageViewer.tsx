/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The image viewer (product-design.md, Image viewer; owner's verdicts of 12 November 2026):
// one viewer for portraits and galleries on both sheets. The image is whole, as large as the
// screen allows (never stretched past its own size), and has the whole screen; what is shown
// floats over it and stays out of the way:
// - on a computer, ×, the magnifier and ‹ › are invisible until the mouse comes near one (or
//   the keyboard reaches it); arrow keys, the wheel, double-click, + and − work too; a click
//   anywhere or Escape closes;
// - on a phone there are no buttons: swipe sideways to change image, pinch or double-tap to
//   zoom, drag to move, tap or swipe down to close;
// - on both, the back button closes the viewer instead of leaving the sheet; the name and
//   counter show for a moment; the gesture hint shows only the first time on a device.
// Only for looking: no delete, edit or download.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

export interface ViewerTexts {
  imageViewerPortrait: string;
  imageViewerPrev: string;
  imageViewerNext: string;
  imageViewerZoomIn: string;
  imageViewerZoomOut: string;
  imageViewerClose: string;
  imageViewerHintPc: string;
  imageViewerHintTouch: string;
  imageExpandedAlt: string;
}

/** What to show: the images' addresses, which one first, the sheet's name, and whether it is the portrait. */
export interface ViewerRequest { images: string[]; index: number; title: string; portrait?: boolean }

/** A sheet's viewer: `open` shows it; `request` is null while it is closed. */
export function useImageViewer() {
  const [request, setRequest] = useState<ViewerRequest | null>(null);
  return {
    request,
    open: (images: string[], index: number, title: string, portrait = false) => { if (images.length) setRequest({ images, index, title, portrait }); },
    close: () => setRequest(null),
  };
}

const MAX_ZOOM = 4;
const TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 320;
const NEAR_PX = 120;      // a button appears when the mouse is this close to its centre
const META_MS = 1800;     // how long the name and counter stay after a change
const HINT_MS = 3500;     // how long the first-time hint stays
const HINT_KEY = "magistri_image_viewer_hint_seen";
const PAGE_TOKEN = Math.random().toString(36).slice(2);

type Control = "zoom" | "close" | "prev" | "next";

export function ImageViewer({ request, t, onClose }: { request: ViewerRequest; t: ViewerTexts; onClose: () => void }) {
  const { images, title } = request;
  const [index, setIndex] = useState(request.index);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0, animate: false });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null); // a swipe in progress, unzoomed
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const many = images.length > 1;
  const zoomed = view.scale > 1;

  // A computer (a mouse that hovers) gets fading buttons; a phone gets gestures only.
  const isPC = useMemo(() => typeof matchMedia === "function" && matchMedia("(hover: hover) and (pointer: fine)").matches, []);

  // ---- The phone's back button closes the viewer: one history entry while it is open.
  const pushed = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    try {
      // The token tells this page's entry apart from one left by a reload; a second
      // development-mode mount finds its own entry and adds no other.
      if ((history.state as { imageViewer?: string } | null)?.imageViewer !== PAGE_TOKEN) history.pushState({ ...(history.state ?? {}), imageViewer: PAGE_TOKEN }, "");
      pushed.current = true;
    } catch { pushed.current = false; }
    const onPop = () => { pushed.current = false; closeRef.current(); };
    window.addEventListener("popstate", onPop);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("popstate", onPop); document.body.style.overflow = overflow; };
  }, []);
  const close = useCallback(() => {
    // Leaving through history keeps the back button in step; popstate then closes.
    if (pushed.current) { try { history.back(); return; } catch { /* closes below */ } }
    closeRef.current();
  }, []);

  // ---- What floats over the image: buttons near the mouse, the name and counter for a moment, the hint once.
  const controlRefs = useRef<Partial<Record<Control, HTMLButtonElement | null>>>({});
  const [near, setNear] = useState<Partial<Record<Control, boolean>>>({});
  const [mouseNearTop, setMouseNearTop] = useState(false);
  const [metaShown, setMetaShown] = useState(true);
  useEffect(() => {
    setMetaShown(true);
    const timer = window.setTimeout(() => setMetaShown(false), META_MS);
    return () => window.clearTimeout(timer);
  }, [index]);
  const [hintShown, setHintShown] = useState(() => {
    try { return localStorage.getItem(HINT_KEY) !== "1"; } catch { return true; }
  });
  useEffect(() => {
    if (!hintShown) return;
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* shown, not remembered */ }
    const timer = window.setTimeout(() => setHintShown(false), HINT_MS);
    return () => window.clearTimeout(timer);
  }, [hintShown]);
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPC) return;
    const next: Partial<Record<Control, boolean>> = {};
    for (const [name, el] of Object.entries(controlRefs.current) as [Control, HTMLButtonElement | null][]) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      next[name] = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < NEAR_PX;
    }
    setNear((old) => (Object.keys({ ...old, ...next }).some((k) => !!old[k as Control] !== !!next[k as Control]) ? next : old));
    setMouseNearTop(e.clientY < 110);
  };

  // ---- Moving and zooming
  const reset = () => setView({ scale: 1, x: 0, y: 0, animate: false });
  /** Moves through the gallery; it stops at the first and last image. */
  const go = useCallback((step: number) => {
    const next = index + step;
    if (next < 0 || next >= images.length) return;
    setIndex(next);
    setView({ scale: 1, x: 0, y: 0, animate: false });
  }, [index, images.length]);

  /** Keeps a zoomed image from being dragged out of sight. */
  const clamp = (scale: number, x: number, y: number) => {
    const stage = stageRef.current?.getBoundingClientRect();
    const img = imgRef.current;
    if (!stage || !img || scale <= 1) return { x: 0, y: 0 };
    const mx = Math.max(0, (img.offsetWidth * scale - stage.width) / 2 + 20);
    const my = Math.max(0, (img.offsetHeight * scale - stage.height) / 2 + 20);
    return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  };
  /** Zooms keeping the point (px, py), measured from the screen's centre, still. */
  const zoomAt = useCallback((target: number, px: number, py: number, animate: boolean) => {
    setView((v) => {
      const scale = Math.min(MAX_ZOOM, Math.max(1, target));
      const k = scale / v.scale;
      return { scale, ...clamp(scale, px - (px - v.x) * k, py - (py - v.y) * k), animate };
    });
  }, []);
  const fromCentre = (clientX: number, clientY: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return [clientX - r.left - r.width / 2, clientY - r.top - r.height / 2] as const;
  };
  const toggleZoom = () => (zoomed ? setView({ scale: 1, x: 0, y: 0, animate: true }) : zoomAt(TAP_ZOOM, 0, 0, true));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "+" || e.key === "=") zoomAt(view.scale * 1.5, view.x, view.y, true);
      else if (e.key === "-") zoomAt(view.scale / 1.5, view.x, view.y, true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, go, zoomAt, view]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const [px, py] = fromCentre(e.clientX, e.clientY);
      setView((v) => {
        const scale = Math.min(MAX_ZOOM, Math.max(1, v.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
        const k = scale / v.scale;
        return { scale, ...clamp(scale, px - (px - v.x) * k, py - (py - v.y) * k), animate: false };
      });
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);

  // ---- Pointers: one finger pans (zoomed) or swipes (not zoomed); two pinch; a tap closes;
  // two quick taps zoom.
  const pointers = useRef(new Map<number, [number, number]>());
  // `pinched`: this touch included a pinch, so what is left of it is never a swipe or a tap.
  const gesture = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean; pinched: boolean } | null>(null);
  const pinch = useRef<{ d: number; scale: number; mid: readonly [number, number] } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const tapTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(tapTimer.current), []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.current.size === 1) gesture.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false, pinched: false };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, scale: view.scale, mid: fromCentre((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) };
      if (gesture.current) { gesture.current.moved = true; gesture.current.pinched = true; }
      setDrag(null); // undo any swipe the first finger had started
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const p = pinch.current;
      zoomAt(p.scale * Math.hypot(a[0] - b[0], a[1] - b[1]) / p.d, p.mid[0], p.mid[1], false);
      return;
    }
    const g = gesture.current;
    if (pointers.current.size !== 1 || !g) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (Math.hypot(dx, dy) > 8) g.moved = true;
    if (!g.moved) return;
    if (view.scale > 1) setView((v) => ({ ...v, ...clamp(v.scale, g.vx + dx, g.vy + dy), animate: false }));
    else if (!g.pinched) setDrag(dy > 0 && dy > Math.abs(dx) ? { x: 0, y: dy } : { x: dx, y: 0 });
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const g = gesture.current;
    if (pointers.current.size > 0) {
      // One finger of a pinch lifted: the other carries on from where it is now. Measuring it
      // from where the first finger touched down made the image jump (owner's test, 12 Nov).
      const [rx, ry] = [...pointers.current.values()][0];
      if (g) { g.x = rx; g.y = ry; g.vx = view.x; g.vy = view.y; }
      pinch.current = null;
      return;
    }
    gesture.current = null;
    pinch.current = null;
    setDrag(null);
    if (!g || g.pinched) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.moved) {
      const now = Date.now();
      const last = lastTap.current;
      if (last && now - last.t < DOUBLE_TAP_MS && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 30) {
        lastTap.current = null;
        window.clearTimeout(tapTimer.current);
        const [px, py] = fromCentre(e.clientX, e.clientY);
        zoomAt(view.scale > 1 ? 1 : TAP_ZOOM, px, py, true);
        return;
      }
      lastTap.current = { t: now, x: e.clientX, y: e.clientY };
      // A single tap or click closes, once it is clearly not the first of a double one.
      if (view.scale === 1) tapTimer.current = window.setTimeout(() => { if (lastTap.current?.t === now) close(); }, DOUBLE_TAP_MS + 10);
      return;
    }
    if (view.scale > 1) return;
    if (dy > 110 && dy > Math.abs(dx)) { close(); return; }
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  const transform = drag
    ? `translate(${drag.x}px, ${drag.y}px)`
    : `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  const fade = drag && drag.y > 0 ? Math.max(0.4, 0.96 - drag.y / 600) : 0.96;
  /** A computer's button: invisible until the mouse is near or the keyboard reaches it. */
  const controlClass = (name: Control) =>
    `w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-[#1a1428]/85 border border-[#c8a248]/35 text-neutral-200 hover:text-[#f3d88c] hover:border-[#f3d88c] cursor-pointer pointer-events-auto transition-opacity duration-200 focus-visible:opacity-100 ${near[name] ? "opacity-100" : "opacity-0"}`;
  const setControl = (name: Control) => (el: HTMLButtonElement | null) => { controlRefs.current[name] = el; };

  // Drawn into the page's body, so no layer of the sheet (or the demo banner) covers it.
  return createPortal(
    <div
      id="image-viewer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-viewer-title"
      data-input={isPC ? "pc" : "touch"}
      className="fixed inset-0 z-[120] select-none touch-none"
      style={{ background: `rgba(4, 3, 8, ${fade})` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { setNear({}); setMouseNearTop(false); }}
    >
      <div ref={stageRef} className="absolute inset-0 overflow-hidden">
        <img
          ref={imgRef}
          id="image-viewer-img"
          src={images[index]}
          alt={t.imageExpandedAlt}
          draggable={false}
          onLoad={reset}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 m-auto max-w-[calc(100%-24px)] max-h-[calc(100%-24px)] w-auto h-auto rounded-md shadow-2xl will-change-transform ${view.animate ? "transition-transform duration-200 motion-reduce:transition-none" : ""}`}
          style={{ transform }}
        />
        {isPC && many && (
          <>
            {index > 0 && (
              <button type="button" id="btn-image-viewer-prev" ref={setControl("prev")} aria-label={t.imageViewerPrev} onClick={() => go(-1)}
                className={`${controlClass("prev")} absolute top-1/2 -translate-y-1/2 left-2.5`}>
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {index < images.length - 1 && (
              <button type="button" id="btn-image-viewer-next" ref={setControl("next")} aria-label={t.imageViewerNext} onClick={() => go(1)}
                className={`${controlClass("next")} absolute top-1/2 -translate-y-1/2 right-2.5`}>
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="absolute inset-x-0 top-0 z-[1] flex items-center gap-3 min-h-14 px-3 pt-[env(safe-area-inset-top)] pointer-events-none">
        <div className="flex-1 min-w-0 flex">
          <div className={`flex flex-col min-w-0 px-2.5 py-1.5 rounded-lg bg-black/60 transition-opacity duration-300 ${metaShown || mouseNearTop ? "opacity-100" : "opacity-0"}`}>
            <span id="image-viewer-title" className="font-magic text-[15px] text-[#f3d88c] break-words">{title}</span>
            <span id="image-viewer-count" className="font-mono text-xs text-neutral-400 tabular-nums">
              {request.portrait ? t.imageViewerPortrait : `${index + 1} / ${images.length}`}
            </span>
          </div>
        </div>
        {isPC && (
          <>
            <button type="button" id="btn-image-viewer-zoom" ref={setControl("zoom")} onClick={toggleZoom}
              aria-label={zoomed ? t.imageViewerZoomOut : t.imageViewerZoomIn} title={zoomed ? t.imageViewerZoomOut : t.imageViewerZoomIn}
              className={controlClass("zoom")}>
              {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>
            <button type="button" id="btn-image-viewer-close" ref={setControl("close")} onClick={close}
              aria-label={t.imageViewerClose} title={t.imageViewerClose} className={controlClass("close")}>
              <X className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[1] flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))] pointer-events-none">
        <span
          id="image-viewer-hint"
          className={`font-mono text-[11px] text-neutral-200 text-center px-3 py-1.5 rounded-lg bg-black/70 transition-opacity duration-300 ${hintShown ? "opacity-100" : "opacity-0"}`}
          aria-hidden={!hintShown}
        >
          {isPC ? t.imageViewerHintPc : t.imageViewerHintTouch}
        </span>
      </div>
    </div>,
    document.body,
  );
}
