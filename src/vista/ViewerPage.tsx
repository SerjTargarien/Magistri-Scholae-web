/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The players' view (7a): what /vista#<link> shows on the screen the table sees, or on a phone.
// No account and no sign-in: the link is the only key, and it reads only what the Máster sent.
// It asks the server every 2.5 seconds while visible (the server answers requests with plain
// workers, so no push), keeps the screen awake where the browser allows, and says plainly when
// the link no longer works.
import React, { useEffect, useState } from "react";
import { Maximize } from "lucide-react";
import type { ApiViewNow } from "../contracts/api-v1";
import { apiTransport } from "../remote/client";
import { viewPhotoUrl } from "../remote/assets";
import { VISTA_TEXT } from "../localization";
import { ViewContent } from "./ViewContent";

const POLL = 2500;
const lang = "es" as const; // the first version is Spanish only (AGENTS.md)
const WIDE = "(min-width: 700px) and (min-aspect-ratio: 1/1)";

interface Snapshot { campaignName: string; revision: number; now: ApiViewNow | null }

export function ViewerPage() {
  const token = decodeURIComponent(window.location.hash.slice(1));
  const x = VISTA_TEXT[lang];
  const [view, setView] = useState<Snapshot>();
  const [dead, setDead] = useState(!token);
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches);
  const [pointer, setPointer] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(WIDE);
    const change = () => setWide(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    if (!token) return;
    let stop = false, timer = 0, last = "";
    const ask = async () => {
      if (stop) return;
      if (document.visibilityState === "visible") {
        try {
          const response = await apiTransport(`/api/v1/view/${encodeURIComponent(token)}`, { cache: "no-store", credentials: "omit" });
          if (response.status === 404) { setDead(true); setView(undefined); last = ""; }
          else if (response.ok) {
            const body = (await response.json()) as Snapshot;
            const key = JSON.stringify(body);
            if (key !== last) { last = key; setView(body); }
            setDead(false);
          }
        } catch { /* a dropped connection keeps the last picture; the next try may work */ }
      }
      if (!stop) timer = window.setTimeout(ask, POLL);
    };
    void ask();
    const wake = () => { if (document.visibilityState === "visible") { window.clearTimeout(timer); void ask(); } };
    document.addEventListener("visibilitychange", wake);
    return () => { stop = true; window.clearTimeout(timer); document.removeEventListener("visibilitychange", wake); };
  }, [token]);

  // Keep the screen awake while the view is open, where the browser allows it.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | undefined;
    const request = async () => {
      try { lock = await (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen"); } catch { /* not offered */ }
    };
    void request();
    const again = () => { if (document.visibilityState === "visible") void request(); };
    document.addEventListener("visibilitychange", again);
    return () => { document.removeEventListener("visibilitychange", again); void lock?.release().catch(() => undefined); };
  }, []);

  // The full-screen button shows briefly when the mouse moves, like the image viewer's controls.
  useEffect(() => {
    let timer = 0;
    const moved = () => { setPointer(true); window.clearTimeout(timer); timer = window.setTimeout(() => setPointer(false), 2500); };
    window.addEventListener("pointermove", moved);
    return () => { window.removeEventListener("pointermove", moved); window.clearTimeout(timer); };
  }, []);

  return (
    <div id="view-page" className="fixed inset-0 bg-[#07040b] text-neutral-100 [container-type:inline-size] overflow-hidden"
      style={{ backgroundImage: "radial-gradient(ellipse 70% 60% at 30% 40%, rgba(212,175,55,0.10), transparent 70%)" }}>
      {dead ? (
        <p id="view-dead" role="status" className="absolute inset-0 grid place-content-center text-center px-6 font-magic uppercase tracking-[0.12em] text-[#fce8a6]/70 text-[clamp(16px,2.4cqw,40px)]">{x.deadLink}</p>
      ) : view ? (
        <ViewContent lang={lang} now={view.now} campaignName={view.campaignName} layout={wide ? "screen" : "phone"}
          photoUrl={view.now?.photo ? viewPhotoUrl(token, view.revision) : undefined} />
      ) : null}
      {document.fullscreenEnabled && (
        <button type="button" id="btn-view-fullscreen" title={x.fullscreen} aria-label={x.fullscreen}
          onClick={() => { void document.documentElement.requestFullscreen?.().catch(() => undefined); }}
          className={`absolute right-4 bottom-4 w-11 h-11 grid place-items-center rounded-lg border border-amber-600/50 bg-[#130f1e]/90 text-amber-300 cursor-pointer transition-opacity duration-300 focus:opacity-100 ${pointer ? "opacity-100" : "opacity-0"}`}>
          <Maximize className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
