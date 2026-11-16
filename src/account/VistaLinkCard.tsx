/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Vista de jugadores» in «Ajustes» → «Campaña» (7a; approved demo): the link the Máster opens on
// the screen the table sees, with «Copiar» and a QR code; «Cambiar enlace» (asks first: the old
// link stops at once) and «Desactivar»; and the switch that lets signed-in players of the session's
// partida follow it in the app.
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Copy, Monitor, RefreshCw, Trash2 } from "lucide-react";
import qrcode from "qrcode-generator";
import type { ApiPlayerView, ApiTable } from "../contracts/api-v1";
import { TRANSLATIONS, VISTA_TEXT, type Language } from "../localization";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Switch } from "../components/Toggle";
import { Picker, pickerTexts } from "../components/Picker";
import type { VistaApi } from "./vista";

const BUTTON = "inline-flex items-center justify-center gap-2 min-h-10 px-3.5 rounded-lg border text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
const QUIET = `${BUTTON} border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-neutral-200 hover:border-[#f3d88c]`;
const NONE = "__all";

/** The link as a QR code, drawn as squares (no image file). */
function QrCode({ text, label }: { text: string; label: string }) {
  const cells = useMemo(() => {
    const code = qrcode(0, "M");
    code.addData(text);
    code.make();
    const n = code.getModuleCount();
    const rects: string[] = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (code.isDark(y, x)) rects.push(`M${x} ${y}h1v1h-1z`);
    return { n, d: rects.join("") };
  }, [text]);
  return (
    <svg id="vista-link-qr" role="img" aria-label={label} viewBox={`-2 -2 ${cells.n + 4} ${cells.n + 4}`} shapeRendering="crispEdges"
      className="w-28 h-28 shrink-0 rounded-lg bg-[#f5f0e6]">
      <path d={cells.d} fill="#1a1105" />
    </svg>
  );
}

export function VistaLinkCard({ lang, api, partidas, onShowToast, onChanged }: {
  lang: Language; api: VistaApi; partidas: ApiTable[]; onShowToast: (type: "success" | "error", text: string) => void;
  /** The app's copy of the view follows (the panel says whether a link exists). */
  onChanged?: (view: ApiPlayerView) => void;
}) {
  const x = VISTA_TEXT[lang];
  const [view, setView] = useState<ApiPlayerView | null>();
  const [busy, setBusy] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { api.settings().then(setView, () => setView(null)); }, [api]);
  const act = async (body: Parameters<VistaApi["change"]>[0]) => {
    setBusy(true);
    try { const next = await api.change(body); setView(next); onChanged?.(next); } catch { onShowToast("error", x.failed); } finally { setBusy(false); }
  };
  const url = view?.token ? `${window.location.origin}/vista#${view.token}` : "";
  const when = (iso: string) => new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", { dateStyle: "long" }).format(new Date(iso));
  const partida = partidas.find(p => p.id === view?.tableId);

  if (view === undefined) return null;
  return (
    <div className="mt-5 pt-4 border-t border-violet-500/10 grid gap-3" id="vista-link-card">
      <h3 className="text-[10px] uppercase font-mono tracking-wider text-amber-500 font-bold flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" />{x.title}</h3>
      {!view?.active ? (
        <>
          <p className="text-xs text-neutral-400 leading-relaxed">{x.linkNone}</p>
          <div><button type="button" id="btn-vista-create" disabled={busy || view === null} onClick={() => void act({ action: "create" })}
            className={`${BUTTON} border-[#9b7424] bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] text-[#1a1105]`}><Monitor className="w-4 h-4" />{x.create}</button></div>
        </>
      ) : (
        <>
          <p className="text-xs text-neutral-400 leading-relaxed">{x.linkIntro}</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] grid gap-2">
              <div id="vista-link-url" className="font-mono text-xs text-neutral-100 px-2.5 py-2 rounded-lg border border-amber-600/50 bg-neutral-950/40 break-all select-all">{url}</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" id="btn-vista-copy" className={QUIET} onClick={() => {
                  navigator.clipboard?.writeText(url).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); }, () => undefined);
                }}><Copy className="w-4 h-4 text-amber-400" />{copied ? x.copied : x.copy}</button>
                <button type="button" id="btn-vista-renew" disabled={busy} className={QUIET} onClick={() => setRenewing(true)}><RefreshCw className="w-4 h-4 text-amber-400" />{x.renew}</button>
                <button type="button" id="btn-vista-disable" disabled={busy} onClick={() => void act({ action: "disable" })}
                  className={`${BUTTON} border-rose-500/50 bg-[#4c1420] text-rose-100 hover:border-rose-300`}><Trash2 className="w-4 h-4" />{x.disable}</button>
              </div>
              {view.expiresAt && <span className="text-[11px] text-neutral-500">{x.expires.replace("{date}", when(view.expiresAt))}</span>}
            </div>
            <QrCode text={url} label={x.qr} />
          </div>
        </>
      )}
      {view && (
        <Switch id="switch-vista-in-app" checked={view.inApp} disabled={busy} onChange={inApp => void act({ inApp })}
          label={x.inApp} hint={x.inAppHint} labelClassName="text-xs font-bold text-neutral-100" />
      )}
      {view?.inApp && (
        <div className="flex flex-wrap items-center gap-2 px-2.5">
          <span className="text-xs font-bold text-neutral-100">{x.partida}</span>
          <button type="button" id="btn-vista-partida" disabled={busy} aria-haspopup="dialog" onClick={() => setChoosing(true)}
            className="inline-flex items-center gap-2 min-h-10 px-3 rounded-lg border border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-amber-300 text-sm font-medium cursor-pointer hover:border-[#f3d88c] disabled:opacity-50">
            <span className="break-words text-left">{partida?.name ?? x.allPartidas}</span><ChevronDown className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}
      {choosing && view && (
        <Picker id="vista-partida-picker" title={x.partida} selected={view.tableId ?? NONE}
          items={[{ id: NONE, label: x.allPartidas, detail: x.allPartidasHint }, ...partidas.map(p => ({ id: p.id, label: p.name }))]}
          onPick={id => { setChoosing(false); void act({ tableId: id === NONE ? null : id }); }}
          onClose={() => setChoosing(false)} texts={pickerTexts({ ...TRANSLATIONS[lang], cancel: x.cancel })} />
      )}
      {renewing && (
        <ConfirmDialog id="vista-renew" kind="discard" title={x.renew} message={x.renewText} confirmLabel={x.renewConfirm} cancelLabel={x.cancel}
          onConfirm={() => { setRenewing(false); void act({ action: "renew" }); }} onCancel={() => setRenewing(false)} />
      )}
    </div>
  );
}
