/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A link shown once (R4 a, shared since R4 d): an invitation or recovery link with
// «Copiar enlace», the bare code to type by hand, and when it expires. The whole link
// wraps on narrow screens (no cut words). Used by «Administración» and the Máster's
// «Jugadores».
import { useState } from "react";
import { Check as CheckIcon, Copy, Link as LinkIcon, X } from "lucide-react";
import { ADMIN_TEXT, type Language } from "../localization";
import { HIT } from "../components/TagMenu";
import type { IssuedLink } from "./admin";

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");

export function IssuedLinkPanel({ id, lang, title, note, issued, onClose }: {
  /** Prefix of the element ids: `${id}`, `${id}-link`, `${id}-code`, `btn-${id}-close`, `btn-${id}-copy`. */
  id: string;
  lang: Language;
  title: string;
  /** Says how long it lasts; «{date}» becomes the expiry. */
  note: string;
  issued: IssuedLink;
  onClose: () => void;
}) {
  const a = ADMIN_TEXT[lang];
  const [copied, setCopied] = useState(false);
  const when = new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(issued.expiresAt));
  const copy = async () => {
    try { await navigator.clipboard.writeText(issued.link); setCopied(true); }
    catch {
      // No clipboard (an old browser or an insecure page): select the link so it can be copied by hand.
      const node = document.getElementById(`${id}-link`);
      if (node) window.getSelection()?.selectAllChildren(node);
    }
  };
  return (
    <div className="mt-3 p-3 rounded-lg border border-amber-500/40 bg-amber-950/20 space-y-2" id={id} role="status">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5 shrink-0" />{title}
        </h4>
        <button type="button" id={`btn-${id}-close`} onClick={onClose} title={a.close} aria-label={a.close}
          className={`${HIT} text-neutral-500 hover:text-amber-300 cursor-pointer shrink-0`}><X className="w-4 h-4" /></button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
        <p id={`${id}-link`} className="flex-1 min-w-0 text-xs font-mono text-neutral-100 bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 break-all select-all">{issued.link}</p>
        <button type="button" id={`btn-${id}-copy`} onClick={() => void copy()}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-9 rounded-lg border text-xs font-mono transition-colors cursor-pointer border-violet-500/35 bg-violet-900 text-violet-100 hover:bg-violet-800 shrink-0">
          {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? a.copied : a.copy}
        </button>
      </div>
      <p className="text-[11px] text-neutral-400 font-sans break-all" id={`${id}-code`}>{fill(a.code, { code: issued.link.slice(issued.link.indexOf("=") + 1) })}</p>
      <p className="text-[11px] text-amber-200/80 font-sans leading-relaxed">{fill(note, { date: when })}</p>
    </div>
  );
}
