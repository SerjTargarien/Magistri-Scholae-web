/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Counters near limits (R3.4; field-rules.md, «Warnings»). Every text box gets its
// field's limit from the server's rules (`limitAttrs`); while the viewer types in
// one, a small counter appears under it once the text passes 90% of its limit,
// or once the list the box adds to is 90% full. One `LimitHint` per app watches
// the focused box, so no screen needs its own counter markup.
import React, { useEffect, useState } from "react";

import type { EntityKind } from "../contracts/api-v1";
import { ruleAt, WARNING_SHARE } from "../model/rules";

/** The box's limit, and the size of the list it adds to: spread onto an input or textarea. */
export function limitAttrs(kind: EntityKind, path: string, list?: { path: string; count: number }) {
  const attrs: { maxLength?: number; "data-list-count"?: number; "data-list-max"?: number } = {};
  const rule = ruleAt(kind, path);
  if (rule?.type === "string" && rule.maxLength) attrs.maxLength = rule.maxLength;
  const listRule = list && ruleAt(kind, list.path);
  if (list && listRule?.maxItems) {
    attrs["data-list-count"] = list.count;
    attrs["data-list-max"] = listRule.maxItems;
  }
  return attrs;
}

/** Only the text limit, for components that take a `maxLength` prop. */
export const maxLengthOf = (kind: EntityKind, path: string) => limitAttrs(kind, path).maxLength;

type Part = { text: string; full: boolean };

export function LimitHint({ entriesWord, fullWord }: { entriesWord: string; fullWord: string }) {
  const [hint, setHint] = useState<{ parts: Part[]; top: number; right: number } | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = document.activeElement;
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) { setHint(null); return; }
        const parts: Part[] = [];
        const max = el.maxLength > 0 ? el.maxLength : 0;
        if (max && el.value.length >= WARNING_SHARE * max) parts.push({ text: `${el.value.length} / ${max}`, full: el.value.length >= max });
        const count = Number(el.dataset.listCount), listMax = Number(el.dataset.listMax);
        if (listMax && count >= WARNING_SHARE * listMax) parts.push({ text: `${count} / ${listMax} ${entriesWord}`, full: count >= listMax });
        if (!parts.length) { setHint(null); return; }
        const r = el.getBoundingClientRect();
        setHint({ parts, top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) });
      });
    };
    const events = ["focusin", "focusout", "input", "resize"] as const;
    events.forEach((name) => window.addEventListener(name, update));
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      events.forEach((name) => window.removeEventListener(name, update));
      window.removeEventListener("scroll", update, true);
    };
  }, [entriesWord]);

  return (
    <div role="status" aria-live="polite">
      {hint && (
        <div
          id="limit-hint"
          style={{ top: hint.top, right: hint.right }}
          className="fixed z-[70] pointer-events-none flex gap-1.5"
        >
          {hint.parts.map((part) => (
            <span
              key={part.text}
              className={`px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold tracking-wide shadow-[0_6px_16px_rgba(0,0,0,0.6)] ${part.full
                  ? "bg-rose-950/90 border-rose-500/60 text-rose-200"
                  : "bg-amber-950/90 border-amber-500/50 text-amber-200"
                }`}
            >
              {part.text}{part.full ? ` · ${fullWord}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** A list's counter shown in place (lists added to without a text box, such as the galleries): only near the limit. */
export function ListCounter({ kind, path, count, word, fullWord, id }: {
  kind: EntityKind; path: string; count: number; word: string; fullWord: string; id?: string;
}) {
  const max = ruleAt(kind, path)?.maxItems;
  if (!max || count < WARNING_SHARE * max) return null;
  const full = count >= max;
  return (
    <span id={id} className={`inline-block mt-1 px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold tracking-wide ${full
        ? "bg-rose-950/60 border-rose-500/60 text-rose-200"
        : "bg-amber-950/60 border-amber-500/50 text-amber-200"
      }`}>
      {count} / {max} {word}{full ? ` · ${fullWord}` : ""}
    </span>
  );
}
