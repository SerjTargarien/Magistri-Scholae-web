/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A text box for a required field on a saved sheet (a name, a familiar's species):
// it can be emptied while retyping (R3.4), but an empty value is never saved.
// While empty it says so; leaving it empty brings the saved value back.
import React, { useEffect, useRef, useState } from "react";

export function RequiredTextInput({ value, onSave, emptyHint, id, disabled, placeholder, className, maxLength }: {
  value: string;
  onSave: (text: string) => void;
  /** Shown under the box while it is empty. */
  emptyHint: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  // A change from elsewhere (another device, a reload) shows unless the viewer is typing here.
  useEffect(() => { if (!focused.current) setDraft(value); }, [value]);
  const empty = !draft.trim();
  return (
    <>
      <input
        id={id}
        type="text"
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={empty}
        aria-describedby={empty && id ? `${id}-hint` : undefined}
        onFocus={() => { focused.current = true; }}
        onChange={(e) => {
          setDraft(e.target.value);
          if (e.target.value.trim()) onSave(e.target.value);
        }}
        onBlur={() => {
          focused.current = false;
          if (!draft.trim()) setDraft(value);
        }}
        className={className}
      />
      {empty && (
        <p id={id ? `${id}-hint` : undefined} role="status" className="mt-1 text-[11px] text-rose-300">{emptyHint}</p>
      )}
    </>
  );
}
