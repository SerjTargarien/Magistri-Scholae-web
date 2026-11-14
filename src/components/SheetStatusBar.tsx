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
import { Archive, ChevronDown, EyeOff, FileClock, PauseCircle, RotateCcw, Send, Trash2, Undo2, UserCheck, UserCog } from "lucide-react";
import type { SheetStore } from "../store/sheetStore";
import { STATUS_TEXT, type Language } from "../localization";
import { ConfirmDialog } from "./ConfirmDialog";
import { Check, Switch } from "./Toggle";
import { Picker, pickerTexts } from "./Picker";
import { TRANSLATIONS } from "../localization";

export type StatusAction = "propose" | "withdraw" | "return" | "confirm";
export interface SheetStatusProps {
  /** Runs a step; `as` only for «confirm». Rejects when the server refuses. */
  onAction: (action: StatusAction, as?: "player" | "npc") => Promise<void>;
  /** The Máster only, on confirmed sheets. */
  onSetActive?: (active: boolean) => Promise<void>;
  /** The Máster only, on confirmed sheets (R4 d): who the sheet belongs to. */
  assignment?: {
    /** The campaign's members to choose from; null is «Sin asignar». */
    options: { id: string | null; label: string; detail?: string; isPlayer: boolean }[];
    onAssign: (userId: string | null) => Promise<void>;
  };
  /** The Máster only, on archived sheets (R4 d). */
  onRestore?: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

const NOBODY = "__none";

const BUTTON = "inline-flex items-center justify-center gap-1.5 min-h-10 px-3.5 rounded-lg border text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
const PRIMARY = `${BUTTON} border-[#9b7424] bg-gradient-to-b from-[#f3d88c] via-[#d4af37] to-[#9b7424] text-[#1a1105]`;
const QUIET = `${BUTTON} border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-neutral-200 hover:border-[#f3d88c]`;

export function SheetStatusBar({ lang, store, editing, status }: { lang: Language; store: SheetStore; editing: boolean; status?: SheetStatusProps }) {
  const s = STATUS_TEXT[lang];
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [choice, setChoice] = useState<"player" | "npc">("player");
  const [givingBack, setGivingBack] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [taking, setTaking] = useState<string | null | undefined>(undefined);
  const [removing, setRemoving] = useState(false);
  const [ticked, setTicked] = useState(false);
  const [typed, setTyped] = useState("");
  const sheet = store.sheet;
  const gm = sheet.capabilities.isGM;
  const state = sheet.status ?? "confirmed";
  const name = String((sheet.fields as { nombre?: string }).nombre ?? "");
  const current = status?.assignment?.options.find((o) => o.id === (sheet.assignedPlayerId ?? null));
  /** Taking a sheet from a player asks first; their private notes stay theirs. */
  const assign = (userId: string | null) => {
    setChoosing(false);
    if (userId === (sheet.assignedPlayerId ?? null)) return;
    if (current?.isPlayer) setTaking(userId);
    else void busyWhile(() => status!.assignment!.onAssign(userId));
  };
  const busyWhile = async (work: () => Promise<void>) => { setBusy(true); try { await work(); } finally { setBusy(false); } };
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

      {state === "confirmed" && gm && editing && !sheet.archived && (status?.onSetActive || status?.assignment) && (
        <div id="sheet-status" data-status="confirmed" className="mb-5 p-3 rounded-xl border border-[#c8a248]/35 bg-[#120e1c]/90 grid gap-3 md:grid-cols-2 md:items-center">
          {status.assignment && (
            <div className="flex flex-wrap items-center gap-2 px-2.5">
              <span className="text-xs font-bold text-neutral-100">{s.assigned}</span>
              <button type="button" id="btn-sheet-assigned" disabled={busy} aria-haspopup="dialog" onClick={() => setChoosing(true)}
                className="inline-flex items-center gap-2 min-h-10 px-3 rounded-lg border border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-amber-300 text-sm font-medium cursor-pointer hover:border-[#f3d88c] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50">
                <span className="break-words text-left">{current?.label ?? s.nobody}</span>
                <ChevronDown className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}
          {status.onSetActive && (
            <Switch id="switch-sheet-active" checked={sheet.active !== false} disabled={busy}
              onChange={(on) => { setBusy(true); void status.onSetActive!(on).finally(() => setBusy(false)); }}
              label={s.activeSwitch} hint={s.activeHint} labelClassName="text-xs font-bold text-neutral-100" />
          )}
        </div>
      )}

      {state === "confirmed" && gm && sheet.archived && panel(Archive, s.archivedTitle, s.archivedText, (status?.onRestore || status?.onDelete) && (
        <>
          {status?.onRestore && (
            <button type="button" id="btn-status-restore" disabled={busy} onClick={() => void busyWhile(status.onRestore!)} className={QUIET}>
              <RotateCcw className="w-4 h-4" />{s.restore}
            </button>
          )}
          {status?.onDelete && (
            <button type="button" id="btn-status-delete" disabled={busy} onClick={() => { setTicked(false); setTyped(""); setRemoving(true); }}
              className={`${BUTTON} border-rose-500/50 bg-[#4c1420] text-rose-100 hover:border-rose-300`}>
              <Trash2 className="w-4 h-4" />{s.remove}
            </button>
          )}
        </>
      ), "border-rose-500/40 bg-rose-950/20 text-rose-200")}

      {choosing && status?.assignment && (
        <Picker
          id="assign-picker"
          title={s.assigned}
          items={status.assignment.options.map((o) => ({ id: o.id ?? NOBODY, label: o.label, detail: o.detail }))}
          selected={sheet.assignedPlayerId ?? NOBODY}
          onPick={(id) => assign(id === NOBODY ? null : id)}
          onClose={() => setChoosing(false)}
          texts={pickerTexts(TRANSLATIONS[lang])}
        />
      )}

      {taking !== undefined && (
        <ConfirmDialog id="take-sheet" kind="discard" title={s.takeTitle} message={s.takeText.replace("{name}", current?.label ?? "")}
          confirmLabel={s.change} cancelLabel={s.cancel}
          onConfirm={() => { const userId = taking; setTaking(undefined); void busyWhile(() => status!.assignment!.onAssign(userId)); }}
          onCancel={() => setTaking(undefined)} />
      )}

      {removing && status?.onDelete && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="status-delete-title" id="modal-delete-sheet"
          onKeyDown={(e) => { if (e.key === "Escape") setRemoving(false); }}>
          <div className="w-full max-w-md rounded-2xl border border-rose-500/50 bg-[#150f22] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.85)] space-y-4">
            <h3 id="status-delete-title" className="font-magic text-sm font-bold uppercase tracking-[0.1em] text-rose-300 flex items-center gap-2"><Trash2 className="w-4 h-4" />{s.remove}</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">{s.removeText}</p>
            <Check id="check-delete-sheet" checked={ticked} onChange={setTicked}>{s.removeTick}</Check>
            <label className="grid gap-1.5 text-xs text-neutral-300">
              <span>{s.removeType.replace("{name}", name)}</span>
              <input id="input-delete-sheet-name" type="text" value={typed} disabled={!ticked} autoComplete="off" onChange={(e) => setTyped(e.target.value)}
                className="w-full text-sm bg-neutral-950 border border-neutral-800 text-neutral-100 rounded px-2 py-1.5 focus:ring-1 focus:ring-rose-500 focus:outline-none disabled:opacity-50" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" id="btn-delete-sheet-cancel" onClick={() => setRemoving(false)} className={QUIET}>{s.cancel}</button>
              <button type="button" id="btn-delete-sheet-confirm" disabled={!ticked || typed.trim() !== name.trim()}
                onClick={() => { setRemoving(false); void busyWhile(status.onDelete!); }}
                className={`${BUTTON} border-rose-400 bg-rose-700 text-white`}>
                <Trash2 className="w-4 h-4" />{s.remove}
              </button>
            </div>
          </div>
        </div>
      )}

      {state === "confirmed" && sheet.active === false && !sheet.archived && !(gm && editing) &&
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
