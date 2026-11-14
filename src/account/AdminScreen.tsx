/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Administración» (R4 a; product-design.md, Administración): the site administrator's
// screen for campaigns, their members and invitations, and accounts with recovery links.
// It shows usernames and roles only, never sheet content, and does not depend on the
// administrator being in a campaign. Academia style and the shared controls: a tag menu
// for a member's role, a picker to add an account, a switch for an active account, and
// the one confirmation dialog before removing, cancelling or disabling.
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, KeyRound, Link as LinkIcon, Plus, ShieldCheck, UserPlus, X } from "lucide-react";
import type { ApiAdminUser, ApiCampaign, ApiInvitation, ApiMember, ApiRole, ApiUser } from "../contracts/api-v1";
import { ADMIN_TEXT, TRANSLATIONS, type Language } from "../localization";
import { ApiFailure } from "../remote/client";
import type { AdminApi, IssuedLink } from "./admin";
import { IssuedLinkPanel } from "./IssuedLinkPanel";
import { CompassStarDivider, FiligreeCorner } from "../components/AcademyOrnaments";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Picker, pickerTexts } from "../components/Picker";
import { HIT, TagMenu } from "../components/TagMenu";
import { Switch } from "../components/Toggle";

export interface AdminScreenProps {
  lang: Language;
  api: AdminApi;
  /** The signed-in administrator (who cannot disable their own account). */
  me: ApiUser;
  onBack: () => void;
  onShowToast: (type: "success" | "error", text: string) => void;
  /** Campaigns or memberships changed: the app reloads the viewer's campaigns. */
  onChanged: () => void;
}

type Shown = IssuedLink & { key: string; title: string; note: string };
/** «discard» (a warning sign) when nothing is removed, as disabling an account. */
type Asking = { id: string; title: string; message: string; confirmLabel: string; kind?: "remove" | "discard"; run: () => Promise<void> };

const GM_TONE = "border-amber-500/50 bg-amber-950/50 text-amber-200";
const PLAYER_TONE = "border-violet-500/40 bg-violet-950/50 text-violet-200";
const inputClass = "w-full text-xs bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none";
const buttonClass = "inline-flex items-center gap-1.5 px-3 py-1.5 min-h-9 rounded-lg border text-xs font-mono transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const QUIET = `${buttonClass} border-neutral-700/60 bg-neutral-900/60 text-neutral-300 hover:text-amber-300 hover:border-amber-500/40`;
const STRONG = `${buttonClass} border-violet-500/35 bg-violet-900 text-violet-100 hover:bg-violet-800`;

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");

export function AdminScreen({ lang, api, me, onBack, onShowToast, onChanged }: AdminScreenProps) {
  const t = TRANSLATIONS[lang];
  const a = ADMIN_TEXT[lang];
  const [users, setUsers] = useState<ApiAdminUser[]>();
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [members, setMembers] = useState<Record<string, ApiMember[]>>({});
  const [invitations, setInvitations] = useState<ApiInvitation[]>([]);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState<Shown | null>(null);
  const [adding, setAdding] = useState<ApiCampaign | null>(null);
  const [asking, setAsking] = useState<Asking | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const roleName = (role: ApiRole) => (role === "gm" ? a.gm : a.player);
  const when = (iso: string) => new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  const nameOf = (u: { displayName: string; username: string }) => u.displayName || u.username;

  const load = useCallback(async () => {
    try {
      const [userList, campaignList, pending] = await Promise.all([api.users(), api.campaigns(), api.invitations()]);
      const memberLists = await Promise.all(campaignList.map(c => api.members(c.id)));
      setUsers(userList);
      setCampaigns(campaignList);
      setInvitations(pending);
      setMembers(Object.fromEntries(campaignList.map((c, i) => [c.id, memberLists[i]])));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [api]);
  useEffect(() => { void load(); }, [load]);

  /** Runs a change, then reloads everything; a refusal is said plainly. */
  const act = async (run: () => Promise<void>, changesCampaigns = false) => {
    setBusy(true);
    try {
      await run();
      if (changesCampaigns) onChanged();
    } catch (e) {
      onShowToast("error", e instanceof ApiFailure && e.code === "last_gm" ? a.lastGm : a.failed);
    } finally {
      await load();
      setBusy(false);
    }
  };

  const show = (key: string, title: string, note: string, issued: IssuedLink) => setShown({ key, title, note, ...issued });
  const issuedPanel = (key: string) => shown?.key === key && (
    <IssuedLinkPanel id="admin-issued" lang={lang} title={shown.title} note={shown.note} issued={shown} onClose={() => setShown(null)} />
  );

  const heading = (text: string, Icon: typeof KeyRound) => (
    <h2 className="font-magic text-sm text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-3 mt-8">
      <Icon className="w-4 h-4" />{text}
    </h2>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-16" id="admin-screen">
      <div className="flex justify-between items-center mb-6 border-b border-violet-500/15 pb-4 gap-3">
        <button id="btn-admin-back" onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-amber-400 bg-neutral-900/60 hover:bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/40 transition-all font-mono cursor-pointer">
          <ArrowLeft className="w-4 h-4" />{t.back}
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
          <h1 className="font-magic text-base md:text-2xl text-neutral-100 uppercase tracking-widest glow-amber text-right">{a.title}</h1>
        </div>
      </div>
      <p className="text-xs text-neutral-400 font-sans leading-relaxed">{a.intro}</p>

      {failed && !users && <p className="mt-6 text-sm text-rose-300" role="alert">{a.loadFailed}</p>}
      {!failed && !users && <p className="mt-6 text-sm text-neutral-400 animate-pulse" id="admin-loading">{a.loading}</p>}

      {users && (
        <>
          {heading(a.campaigns, ShieldCheck)}
          <div className="space-y-6">
            {campaigns.map(campaign => {
              const list = members[campaign.id] ?? [];
              const pending = invitations.filter(i => i.campaignId === campaign.id);
              const outside = users.filter(u => u.isActive && !list.some(m => m.userId === u.id));
              return (
                <section key={campaign.id} id={`admin-campaign-${campaign.id}`} className="glass-panel relative overflow-hidden p-5 sm:p-6 rounded-xl border border-violet-500/15">
                  <FiligreeCorner position="tl" className="w-6 h-6" />
                  <FiligreeCorner position="tr" className="w-6 h-6" />
                  <h3 className="font-magic text-sm text-neutral-100 uppercase tracking-widest break-words">{campaign.name}</h3>
                  <CompassStarDivider className="my-3" />

                  <h4 className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono mb-2">{a.members}</h4>
                  {list.length ? (
                    <ul className="space-y-1.5">
                      {list.map(m => (
                        <li key={m.userId} id={`admin-member-${campaign.id}-${m.username}`}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 rounded-lg border border-neutral-800/80 bg-neutral-950/30">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-neutral-100 break-words">{nameOf(m)}{m.userId === me.id && <span className="text-neutral-500 text-xs"> ({a.you})</span>}</div>
                            <div className="text-[10px] font-mono text-neutral-500 break-all">@{m.username}</div>
                          </div>
                          <TagMenu<ApiRole>
                            id={`tag-role-${campaign.id}-${m.username}`}
                            title={a.roleTitle}
                            value={m.role}
                            emptyLabel={a.roleTitle}
                            editable={!busy}
                            onChange={role => { if (role !== m.role) void act(() => api.setMember(campaign.id, m.userId, role), m.userId === me.id); }}
                            options={[{ value: "gm", label: a.gm, tone: GM_TONE }, { value: "player", label: a.player, tone: PLAYER_TONE }]}
                          />
                          <button type="button" id={`btn-remove-member-${campaign.id}-${m.username}`} disabled={busy}
                            title={a.removeMember} aria-label={`${a.removeMember}: ${nameOf(m)}`}
                            onClick={() => setAsking({ id: "admin-remove-member", title: a.removeMemberTitle, confirmLabel: a.remove,
                              message: fill(a.removeMemberText, { name: nameOf(m), campaign: campaign.name }),
                              run: () => api.setMember(campaign.id, m.userId, null) })}
                            className={`${HIT} w-7 h-7 flex items-center justify-center rounded text-neutral-500 hover:text-rose-400 cursor-pointer disabled:opacity-50`}>
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-neutral-500 italic">{a.noMembers}</p>}

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" id={`btn-add-member-${campaign.id}`} disabled={busy || !outside.length} onClick={() => setAdding(campaign)} className={QUIET}>
                      <UserPlus className="w-3.5 h-3.5" />{a.addMember}
                    </button>
                    {(["player", "gm"] as const).map(role => (
                      <button key={role} type="button" id={`btn-invite-${role}-${campaign.id}`} disabled={busy} className={STRONG}
                        onClick={() => void act(async () => {
                          show(`campaign-${campaign.id}`, fill(a.invitationLinkTitle, { role: roleName(role) }), a.linkOnce, await api.invite(campaign.id, role));
                        })}>
                        <LinkIcon className="w-3.5 h-3.5" />{role === "gm" ? a.inviteGm : a.invitePlayer}
                      </button>
                    ))}
                  </div>
                  {issuedPanel(`campaign-${campaign.id}`)}

                  <h4 className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono mt-5 mb-2">{a.pending}</h4>
                  {pending.length ? (
                    <ul className="space-y-1.5">
                      {pending.map(i => (
                        <li key={i.id} id={`admin-invitation-${i.id}`} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-neutral-800/80 bg-neutral-950/30 text-xs text-neutral-300">
                          <span className="min-w-0 break-words">{fill(a.pendingLine, { role: roleName(i.role), date: when(i.expiresAt), issuer: i.issuer })}</span>
                          <button type="button" id={`btn-cancel-invitation-${i.id}`} disabled={busy} title={a.cancelInvitation} aria-label={a.cancelInvitation}
                            onClick={() => setAsking({ id: "admin-cancel-invitation", title: a.cancelInvitationTitle, confirmLabel: a.cancelConfirm,
                              message: fill(a.cancelInvitationText, { role: roleName(i.role), campaign: campaign.name }),
                              run: () => api.cancelInvitation(i.id) })}
                            className={`${HIT} w-7 h-7 shrink-0 flex items-center justify-center rounded text-neutral-500 hover:text-rose-400 cursor-pointer disabled:opacity-50`}>
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-neutral-500 italic">{a.noPending}</p>}
                </section>
              );
            })}

            <section id="admin-new-campaign" className="glass-panel p-5 rounded-xl border border-violet-500/15">
              <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest mb-3">{a.newCampaign}</h3>
              <form className="flex gap-2 max-w-md" onSubmit={e => {
                e.preventDefault();
                const name = newName.trim();
                if (name) void act(async () => { await api.createCampaign(name); setNewName(""); }, true);
              }}>
                <input id="input-new-campaign" type="text" maxLength={120} value={newName} placeholder={a.campaignName} aria-label={a.campaignName}
                  onChange={e => setNewName(e.target.value)} className={inputClass} />
                <button id="btn-create-campaign" type="submit" disabled={busy || !newName.trim()} className={`${STRONG} shrink-0`}>
                  <Plus className="w-3.5 h-3.5" />{a.create}
                </button>
              </form>
            </section>
          </div>

          {heading(a.users, KeyRound)}
          <section className="glass-panel p-5 sm:p-6 rounded-xl border border-violet-500/15" id="admin-users">
            <ul className="space-y-2">
              {users.map(u => (
                <li key={u.id} id={`admin-user-${u.username}`} className="px-3 py-2.5 rounded-lg border border-neutral-800/80 bg-neutral-950/30">
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                    <div className="min-w-0 flex-1 basis-48">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-sm break-words ${u.isActive ? "text-neutral-100" : "text-neutral-500 line-through"}`}>{nameOf(u)}</span>
                        {u.id === me.id && <span className="text-neutral-500 text-xs">({a.you})</span>}
                        {u.isAdministrator && <span className={`inline-flex px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold uppercase tracking-wide ${GM_TONE}`}>{a.administrator}</span>}
                        {!u.isActive && <span className="inline-flex px-2 py-0.5 rounded-full border border-rose-500/40 bg-rose-950/50 text-rose-200 font-mono text-[10px] font-bold uppercase tracking-wide">{a.disabled}</span>}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500 break-all">@{u.username}</div>
                      <div className="text-[11px] text-neutral-400 mt-1 break-words">
                        {u.campaigns.length ? u.campaigns.map(c => fill(a.inCampaign, { role: roleName(c.role), campaign: c.name })).join(" · ") : a.noCampaign}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {u.isActive && (
                        <button type="button" id={`btn-recovery-${u.username}`} disabled={busy} className={QUIET}
                          onClick={() => void act(async () => {
                            show(`user-${u.id}`, fill(a.recoveryLinkTitle, { name: nameOf(u) }), a.recoveryOnce, await api.recoveryLink(u.id));
                          })}>
                          <KeyRound className="w-3.5 h-3.5" />{a.recoveryLink}
                        </button>
                      )}
                      {u.id !== me.id && (
                        <Switch id={`switch-active-${u.username}`} inline checked={u.isActive} disabled={busy} label={a.active}
                          labelClassName="text-[10px] font-mono uppercase tracking-wider text-neutral-300"
                          onChange={on => on
                            ? void act(() => api.setActive(u.id, true))
                            : setAsking({ id: "admin-disable", title: a.disableTitle, confirmLabel: a.disable, kind: "discard",
                                message: fill(a.disableText, { name: nameOf(u) }), run: () => api.setActive(u.id, false) })} />
                      )}
                    </div>
                  </div>
                  {issuedPanel(`user-${u.id}`)}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {adding && (
        <Picker
          id="admin-add-member"
          title={fill(a.addMemberTitle, { campaign: adding.name })}
          intro={a.addMemberIntro}
          items={(users ?? []).filter(u => u.isActive && !(members[adding.id] ?? []).some(m => m.userId === u.id))
            .map(u => ({ id: u.id, label: nameOf(u), detail: `@${u.username}` }))}
          onPick={userId => { const campaign = adding; setAdding(null); void act(() => api.setMember(campaign.id, userId, "player"), userId === me.id); }}
          onClose={() => setAdding(null)}
          texts={pickerTexts(t)}
        />
      )}

      {asking && (
        <ConfirmDialog
          id={asking.id}
          title={asking.title}
          message={asking.message}
          confirmLabel={asking.confirmLabel}
          cancelLabel={a.cancel}
          kind={asking.kind}
          onConfirm={() => { const run = asking.run; setAsking(null); void act(run, asking.id === "admin-remove-member"); }}
          onCancel={() => setAsking(null)}
        />
      )}
    </div>
  );
}
