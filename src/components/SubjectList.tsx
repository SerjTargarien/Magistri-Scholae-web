/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// An adult wizard's subjects taught: a list like the aspects (R3.4, field-rules.md),
// one entry per subject, added with a box and «+» and removed with «×». Shared by
// the creation form and the character sheet. Readers see the plain list.
import React, { useState } from "react";
import { Plus, X } from "lucide-react";

import type { TextEntry } from "../model/sheet";
import { HIT } from "./TagMenu";
import { limitAttrs } from "./LimitHint";

export function SubjectList({ id, items, editable, canRemove = () => editable, onAdd, onRemove, texts }: {
  /** Prefix of the element ids: `${id}-input`, `${id}-add`, `${id}-remove-${entry id}`. */
  id: string;
  items: TextEntry[];
  /** Whether new subjects can be added. */
  editable: boolean;
  canRemove?: (entryId: string) => boolean;
  onAdd: (value: string) => void;
  onRemove: (entryId: string) => void;
  texts: { placeholder: string; empty: string; remove: string; add: string };
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  };
  return (
    <div className="space-y-1.5" id={id}>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((subject) => (
            <li key={subject.id} className="flex items-center justify-between gap-2 px-2 py-1 rounded border border-neutral-800/80 bg-neutral-950/30 text-xs text-neutral-200">
              <span className="min-w-0 break-words">{subject.value}</span>
              {canRemove(subject.id) && (
                <button
                  id={`${id}-remove-${subject.id}`}
                  type="button"
                  onClick={() => onRemove(subject.id)}
                  className={`${HIT} w-6 h-6 shrink-0 flex items-center justify-center rounded text-neutral-500 hover:text-rose-400 cursor-pointer`}
                  title={texts.remove}
                  aria-label={`${texts.remove}: ${subject.value}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-neutral-500 italic">{texts.empty}</p>
      )}
      {editable && (
        <div className="flex gap-2 items-center">
          <input
            id={`${id}-input`}
            {...limitAttrs("character", "adultWizardProfile/teachingSubjects/x/value", { path: "adultWizardProfile/teachingSubjects", count: items.length })}
            type="text"
            placeholder={texts.placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            className="flex-1 min-w-0 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-100 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
          <button
            id={`${id}-add`}
            type="button"
            onClick={add}
            className={`${HIT} p-1.5 shrink-0 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded cursor-pointer`}
            title={texts.add}
            aria-label={texts.add}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
