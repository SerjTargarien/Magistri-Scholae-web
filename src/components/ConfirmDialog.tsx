/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The one confirmation dialog (product-design.md, Confirmations): removing anything
// from a saved sheet, archiving a character or familiar (with a tick box), and
// discarding a draft. Ids: modal-{id}, btn-{id}-cancel, btn-{id}-confirm, check-{id}.
import React, { useEffect, useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import { Check } from "./Toggle";

export function ConfirmDialog({ id, title, message, understood, confirmLabel, cancelLabel, kind = "remove", onConfirm, onCancel }: {
  id: string;
  title: string;
  message: string;
  /** A tick box the viewer must tick before the button works (archiving). */
  understood?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** «remove» shows a bin; «discard» a warning sign. */
  kind?: "remove" | "discard";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [ticked, setTicked] = useState(false);
  const ready = !understood || ticked;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const Icon = kind === "discard" ? ShieldAlert : Trash2;
  return (
    <div
      id={`modal-${id}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`modal-${id}-title`}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-rose-500/30 bg-[#0e0a16] shadow-2xl space-y-4">
        <h3 id={`modal-${id}-title`} className="font-magic text-base text-rose-400 font-bold border-b border-rose-500/10 pb-2 flex items-center gap-2">
          <Icon className="w-5 h-5 shrink-0 text-rose-400" />
          {title}
        </h3>
        <p className="text-neutral-300 text-sm leading-relaxed">{message}</p>

        {understood && (
          <div className="bg-neutral-950/40 p-1.5 rounded-lg border border-neutral-900">
            <Check id={`check-${id}`} checked={ticked} onChange={setTicked}>
              <span className="text-xs text-neutral-300 leading-relaxed">{understood}</span>
            </Check>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            id={`btn-${id}-cancel`}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-neutral-700/60 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            id={`btn-${id}-confirm`}
            type="button"
            disabled={!ready}
            onClick={onConfirm}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${ready
              ? "bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/25 cursor-pointer"
              : "bg-neutral-900 text-neutral-600 border border-neutral-950 cursor-not-allowed"}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** What a sheet asks before removing: the question, and what to do on «Eliminar». */
export interface RemoveRequest { message: string; confirmLabel?: string; run: () => void }

/** A sheet's pending question: `ask` opens the dialog; `request` is null when none is open. */
export function useAskFirst() {
  const [request, setRequest] = useState<RemoveRequest | null>(null);
  return {
    request,
    ask: (message: string, run: () => void, confirmLabel?: string) => setRequest({ message, run, confirmLabel }),
    close: () => setRequest(null),
  };
}
