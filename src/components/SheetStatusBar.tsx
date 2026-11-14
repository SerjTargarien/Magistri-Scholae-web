/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Where a sheet stands (R4 c; product-design.md, Roles), under the top bar of the character
// and familiar sheets. A player's draft is theirs alone until they propose it; a proposal
// is read-only while the Máster reviews it; the Máster confirms it as the player's
// character or as his own NPC (option cards, Controls 8) or returns it. The Máster marks a
// confirmed sheet active or inactive with a switch in edit mode (Controls 3).
import React, { useState } from "react";
import { EyeOff, FileClock, PauseCircle, Send, Undo2, UserCheck, UserCog } from "lucide-react";
import type { SheetStore } from "../store/sheetStore";
import { STATUS_TEXT, type Language } from "../localization";
import { ConfirmDialog } from "./ConfirmDialog";
import { Switch } from "./Toggle";

export type StatusAction = "propose" | "withdraw" | "return" | "confirm";
export interface SheetStatusProps {
  /** Runs a step; `as` only for «confirm». Rejects when the server refuses. */
  onAction: (action: StatusAction, as?: "player" | "npc") => Promise<void>;
  /** The Máster only, on confirmed sheets. */
  onSetActive?: (active: boolean) => Promise<void>;
}

const BUTTON = "inline-flex items-center justify-center gap-1.5 min-h-10 px-3.5 rounded-lg border text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
const PRIMARY = `${BUTTON} border-[#9b7424] bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] text-[#1a1105]`;
const QUIET = `${BUTTON} border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-neutral-200 hover:border-[#f3d88c]`;

export function SheetStatusBar({ lang, store, editing, status }: { lang: Language; store: SheetStore; editing: boolean; status?: SheetStatusProps }) {
  const s = STATUS_TEXT[lang];
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [choice, setChoice] = useState<"player" | "npc">("player");
  const [givingBack, setGivingBack] = useState(false);
  const sheet = store.sheet;
  const gm = sheet.capabilities.isGM;
  const state = sheet.status ?? "confirmed";
  const run = async (action: StatusAction, as?: "player" | "npc") => {
    if (!status) return;
    setBusy(true);
    try { await status.onAction(action, as); } finally { setBusy(false); }
  };

  const panel = (Icon: typeof FileClock, title: string, text: string, actions: React.ReactNode, tone: string) => (
    <div id="sheet-status" data-status={state} className={`mb-5 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 ${tone}`}>
      <Icon className="w-6 h-6 shrink-0 hidden sm:block" />
      <div className="flex-1 min-w-0">
        <div className="font-magic text-sm font-bold uppercase tracking-widest">{title}</div>
        <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">{text}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
  const DRAFT_TONE = "border-sky-500/40 bg-sky-950/30 text-sky-200";
  const PROPOSED_TONE = "border-amber-500/50 bg-amber-950/30 text-amber-200";

  return (
    <>
      {state === "draft" && panel(EyeOff, s.draftTitle, s.draftText, status && (
        <button type="button" id="btn-status-propose" disabled={busy} onClick={() => void run("propose")} className={PRIMARY}>
          <Send className="w-4 h-4" />{s.propose}
        </button>
      ), DRAFT_TONE)}

      {state === "proposed" && !gm && panel(FileClock, s.proposedTitle, s.proposedText, status && (
        <button type="button" id="btn-status-withdraw" disabled={busy} onClick={() => void run("withdraw")} className={QUIET}>
          <Undo2 className="w-4 h-4" />{s.withdraw}
        </button>
      ), PROPOSED_TONE)}

      {state === "proposed" && gm && panel(FileClock, s.reviewTitle, s.reviewText, status && (
        <>
          <button type="button" id="btn-status-giveback" disabled={busy} onClick={() => setGivingBack(true)} className={QUIET}>
            <Undo2 className="w-4 h-4" />{s.giveBack}
          </button>
          <button type="button" id="btn-status-confirm" disabled={busy} onClick={() => { setChoice("player"); setConfirming(true); }} className={PRIMARY}>
            <UserCheck className="w-4 h-4" />{s.confirm}
          </button>
        </>
      ), PROPOSED_TONE)}

      {state === "confirmed" && gm && editing && status?.onSetActive && (
        <div id="sheet-status" data-status="confirmed" className="mb-5 p-3 rounded-xl border border-[#c8a248]/35 bg-[#120e1c]/90">
          <Switch id="switch-sheet-active" checked={sheet.active !== false} disabled={busy}
            onChange={(on) => { setBusy(true); void status.onSetActive!(on).finally(() => setBusy(false)); }}
            label={s.activeSwitch} hint={s.activeHint} labelClassName="text-xs font-bold text-neutral-100" />
        </div>
      )}

      {state === "confirmed" && sheet.active === false && !(gm && editing) &&
        panel(PauseCircle, s.inactiveTitle, s.inactiveText, null, "border-neutral-600/60 bg-neutral-900/60 text-neutral-200")}

      {givingBack && (
        <ConfirmDialog id="status-giveback" kind="discard" title={s.giveBack} message={s.giveBackText} confirmLabel={s.giveBack} cancelLabel={s.cancel}
          onConfirm={() => { setGivingBack(false); void run("return"); }} onCancel={() => setGivingBack(false)} />
      )}

      {confirming && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="status-confirm-title" id="modal-status-confirm"
          onKeyDown={(e) => { if (e.key === "Escape") setConfirming(false); }}>
          <div className="w-full max-w-lg rounded-2xl border border-amber-600/50 bg-[#150f22] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
            <h3 id="status-confirm-title" className="font-magic text-sm font-bold uppercase tracking-[0.1em] text-amber-400 mb-4">{s.confirmTitle}</h3>
            {/* Option cards (Controls 8): a choice made once, that needs explaining */}
            <div role="radiogroup" aria-label={s.confirmTitle} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([["player", UserCheck, s.asPlayer, s.asPlayerText], ["npc", UserCog, s.asNpc, s.asNpcText]] as const).map(([value, Icon, title, text]) => (
                <button key={value} type="button" role="radio" aria-checked={choice === value} id={`status-confirm-${value}`} onClick={() => setChoice(value)}
                  className={`grid gap-2 content-start text-left p-4 rounded-xl border min-h-[120px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${choice === value
                    ? "border-[#e5a93c] bg-[rgba(42,29,16,0.9)] shadow-[0_0_12px_rgba(229,169,60,0.3)]" : "border-amber-600/30 bg-neutral-950/45 hover:border-[#f3d88c]"}`}>
                  <span className="w-9 h-9 rounded-lg grid place-items-center bg-neutral-950/60 border border-amber-600/30 text-amber-400"><Icon className="w-5 h-5" /></span>
                  <span className="font-magic text-[13px] font-bold uppercase tracking-wider text-[#fce8a6]">{title}</span>
                  <span className="text-xs text-neutral-400">{text}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" id="btn-status-confirm-cancel" onClick={() => setConfirming(false)} className={QUIET}>{s.cancel}</button>
              <button type="button" id="btn-status-confirm-ok" disabled={busy} onClick={() => { setConfirming(false); void run("confirm", choice); }} className={PRIMARY}>{s.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
