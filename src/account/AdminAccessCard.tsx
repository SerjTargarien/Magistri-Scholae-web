/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Acceso de administración» (R4 e; product-design.md, Roles): the Máster lets the site
// administrator into his campaign for an issue he describes. It lasts 24 hours, until he
// withdraws it, or until the administrator marks it solved; it covers every sheet, players'
// drafts included (owner, 14 November 2026), never private notes. The Máster sees which
// sheets were opened or changed. Shown in «Ajustes», on the Máster's «Campaña» card.
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { ApiAdminAccess } from "../contracts/api-v1";
import { ACCESS_TEXT, type Language } from "../localization";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { AccessApi } from "./access";

const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));

export function AdminAccessCard({ lang, api, onShowToast }: { lang: Language; api: AccessApi; onShowToast: (type: "success" | "error", text: string) => void }) {
  const x = ACCESS_TEXT[lang];
  const [access, setAccess] = useState<ApiAdminAccess | null>();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const when = (iso: string) => new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  const load = useCallback(async () => { try { setAccess(await api.latest()); } catch { setAccess(null); } }, [api]);
  useEffect(() => { void load(); }, [load]);
  const act = async (run: () => Promise<ApiAdminAccess | null>) => {
    setBusy(true);
    try { setAccess(await run()); } catch { onShowToast("error", x.failed); } finally { setBusy(false); }
  };
  const times = (n: number) => (n === 1 ? x.once : x.times);
  const why = (a: ApiAdminAccess) => (a.endReason === "withdrawn" ? x.withdrawn : a.endReason === "solved" ? x.solved : x.expired);

  return (
    <div className="mt-5 pt-4 border-t border-violet-500/10" id="admin-access-card">
      <h3 className="text-[10px] uppercase font-mono tracking-wider text-amber-500 font-bold flex items-center gap-1.5 mb-2">
        <ShieldCheck className="w-3.5 h-3.5" />{x.title}
      </h3>
      {access?.active ? (
        <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-950/20 space-y-2" id="admin-access-active">
          <div className="text-sm text-amber-200 font-semibold">{fill(x.activeUntil, { date: when(access.expiresAt) })}</div>
          <p className="text-xs text-neutral-300 break-words">«{access.reason}»</p>
          <button type="button" id="btn-withdraw-admin-access" disabled={busy} onClick={() => setWithdrawing(true)}
            className="px-3 py-1.5 rounded-lg border border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-neutral-200 text-xs font-semibold cursor-pointer hover:border-[#f3d88c] disabled:opacity-50">
            {x.withdraw}
          </button>
        </div>
      ) : (
        <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); const text = reason.trim(); if (text) void act(async () => { const a = await api.grant(text); setReason(""); return a; }); }}>
          <p className="text-xs text-neutral-400 leading-relaxed">{x.explain}</p>
          <label htmlFor="input-admin-access-reason" className="text-xs text-neutral-200 font-semibold">{x.reason}</label>
          <textarea id="input-admin-access-reason" rows={2} maxLength={300} value={reason} placeholder={x.reasonHint} onChange={(e) => setReason(e.target.value)}
            className="w-full text-sm bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
          <div>
            <button id="btn-grant-admin-access" type="submit" disabled={busy || !reason.trim()}
              className="px-3 py-1.5 bg-violet-900 border border-violet-500/35 hover:bg-violet-800 text-violet-100 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {x.grant}
            </button>
          </div>
          {access && !access.active && <p className="text-[11px] text-neutral-500">{fill(x.last, { date: when(access.endedAt ?? access.expiresAt), why: why(access) })}</p>}
        </form>
      )}

      {access && (
        <div className="mt-3" id="admin-access-log">
          <div className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono mb-1.5">{x.log}</div>
          {access.events?.length ? (
            <ul className="space-y-1">
              {access.events.map((e, i) => (
                <li key={i} className="text-xs text-neutral-300 px-2.5 py-1.5 rounded border border-neutral-800/80 bg-neutral-950/30 break-words">
                  <span className="text-neutral-100 font-semibold">{e.name || x.deleted}</span>
                  {" · "}
                  {e.action === "read" ? fill(x.read, { n: e.count, times: times(e.count) }) : fill(x.write, { n: e.count, times: times(e.count), date: when(e.lastAt) })}
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-neutral-500 italic">{x.noLog}</p>}
        </div>
      )}

      {withdrawing && (
        <ConfirmDialog id="withdraw-admin-access" kind="discard" title={x.withdraw} message={x.withdrawText} confirmLabel={x.withdraw} cancelLabel={x.cancel}
          onConfirm={() => { setWithdrawing(false); void act(() => api.withdraw()); }} onCancel={() => setWithdrawing(false)} />
      )}
    </div>
  );
}
