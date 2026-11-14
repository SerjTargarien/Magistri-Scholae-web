/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Jugadores de la campaña» (R4 d; product-design.md section 10c): the Máster's members
// list, «Invitar jugador» with the link shown once, pending invitations with «Anular»,
// and removing a player after asking (their sheets are kept). Opened from the main list.
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Link as LinkIcon, Users, X } from "lucide-react";
import type { ApiInvitation, ApiMember } from "../contracts/api-v1";
import { ADMIN_TEXT, CAMPAIGN_GM_TEXT, TRANSLATIONS, type Language } from "../localization";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { HIT } from "../components/TagMenu";
import type { IssuedLink } from "./admin";
import { IssuedLinkPanel } from "./IssuedLinkPanel";
import type { PlayersApi } from "./players";

const GM_TONE = "border-amber-500/50 bg-amber-950/50 text-amber-200";
const PLAYER_TONE = "border-violet-500/40 bg-violet-950/50 text-violet-200";
const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");

export function CampaignPlayers({ lang, api, meId, campaignName, onBack, onShowToast }: {
  lang: Language; api: PlayersApi; meId: string; campaignName: string;
  onBack: () => void; onShowToast: (type: "success" | "error", text: string) => void;
}) {
  const t = TRANSLATIONS[lang];
  const a = ADMIN_TEXT[lang];
  const g = CAMPAIGN_GM_TEXT[lang];
  const [members, setMembers] = useState<ApiMember[]>();
  const [pending, setPending] = useState<ApiInvitation[]>([]);
  const [issued, setIssued] = useState<IssuedLink | null>(null);
  const [asking, setAsking] = useState<{ id: string; title: string; message: string; confirmLabel: string; run: () => Promise<void> } | null>(null);
  const [busy, setBusy] = useState(false);
  const when = (iso: string) => new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  const nameOf = (m: ApiMember) => m.displayName || m.username;

  const load = useCallback(async () => {
    try {
      const [list, invitations] = await Promise.all([api.members(), api.invitations()]);
      setMembers(list); setPending(invitations);
    } catch { onShowToast("error", a.loadFailed); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);
  const act = async (run: () => Promise<void>) => {
    setBusy(true);
    try { await run(); } catch { onShowToast("error", a.failed); } finally { await load(); setBusy(false); }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 pb-16" id="campaign-players-screen">
      <div className="flex justify-between items-center mb-6 border-b border-violet-500/15 pb-4 gap-3">
        <button id="btn-campaign-players-back" onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-amber-400 bg-neutral-900/60 hover:bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/40 transition-all font-mono cursor-pointer">
          <ArrowLeft className="w-4 h-4" />{t.back}
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <Users className="w-5 h-5 text-amber-500 shrink-0" />
          <h1 className="font-magic text-base md:text-2xl text-neutral-100 uppercase tracking-widest glow-amber text-right">{g.playersTitle}</h1>
        </div>
      </div>
      <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-6">{g.playersIntro}</p>

      <section className="glass-panel p-5 rounded-xl border border-violet-500/15" id="players-card">
        <h2 className="font-magic text-sm text-neutral-100 uppercase tracking-widest break-words mb-3">{campaignName}</h2>
        <h3 className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono mb-2">{a.members}</h3>
        {!members ? <p className="text-xs text-neutral-400 animate-pulse">{a.loading}</p> : (
          <ul className="space-y-1.5">
            {members.map((m) => (
              <li key={m.userId} id={`player-${m.username}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 rounded-lg border border-neutral-800/80 bg-neutral-950/30">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-neutral-100 break-words">{nameOf(m)}{m.userId === meId && <span className="text-neutral-500 text-xs"> ({a.you})</span>}</div>
                  <div className="text-[10px] font-mono text-neutral-500 break-all">@{m.username}</div>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold uppercase tracking-wide ${m.role === "gm" ? GM_TONE : PLAYER_TONE}`}>
                  {m.role === "gm" ? a.gm : a.player}
                </span>
                {m.role === "player" && (
                  <button type="button" id={`btn-remove-player-${m.username}`} disabled={busy} title={a.removeMember} aria-label={`${a.removeMember}: ${nameOf(m)}`}
                    onClick={() => setAsking({ id: "remove-player", title: a.removeMemberTitle, confirmLabel: a.remove,
                      message: fill(a.removeMemberText, { name: nameOf(m), campaign: campaignName }), run: () => api.remove(m.userId) })}
                    className={`${HIT} w-7 h-7 flex items-center justify-center rounded text-neutral-500 hover:text-rose-400 cursor-pointer disabled:opacity-50`}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <button type="button" id="btn-invite-player" disabled={busy} onClick={() => void act(async () => setIssued(await api.invite()))}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 min-h-9 rounded-lg border text-xs font-mono cursor-pointer border-violet-500/35 bg-violet-900 text-violet-100 hover:bg-violet-800 disabled:opacity-50">
          <LinkIcon className="w-3.5 h-3.5" />{a.invitePlayer}
        </button>
        {issued && <IssuedLinkPanel id="players-issued" lang={lang} title={fill(a.invitationLinkTitle, { role: a.player })} note={a.linkOnce} issued={issued} onClose={() => setIssued(null)} />}

        <h3 className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono mt-5 mb-2">{a.pending}</h3>
        {pending.length ? (
          <ul className="space-y-1.5">
            {pending.map((i) => (
              <li key={i.id} id={`players-invitation-${i.id}`} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-neutral-800/80 bg-neutral-950/30 text-xs text-neutral-300">
                <span className="min-w-0 break-words">{fill(a.pendingLine, { role: i.role === "gm" ? a.gm : a.player, date: when(i.expiresAt), issuer: i.issuer })}</span>
                {i.role === "player" && (
                  <button type="button" id={`btn-cancel-player-invitation-${i.id}`} disabled={busy} title={a.cancelInvitation} aria-label={a.cancelInvitation}
                    onClick={() => setAsking({ id: "cancel-player-invitation", title: a.cancelInvitationTitle, confirmLabel: a.cancelConfirm,
                      message: fill(a.cancelInvitationText, { role: a.player, campaign: campaignName }), run: () => api.cancel(i.id) })}
                    className={`${HIT} w-7 h-7 shrink-0 flex items-center justify-center rounded text-neutral-500 hover:text-rose-400 cursor-pointer disabled:opacity-50`}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-neutral-500 italic">{a.noPending}</p>}
      </section>

      {asking && (
        <ConfirmDialog id={asking.id} title={asking.title} message={asking.message} confirmLabel={asking.confirmLabel} cancelLabel={a.cancel}
          onConfirm={() => { const run = asking.run; setAsking(null); void act(run); }} onCancel={() => setAsking(null)} />
      )}
    </div>
  );
}
