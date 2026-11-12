/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Plain words for the save panel (R3.5 step 1): which field, in the sheet's own
// words, what went wrong and what to do, never a stored path, an error code or
// JSON. The texts live in localization.ts (SAVE_STATUS_TEXT, FIELD_LABELS).
import { FIELD_LABELS, SAVE_STATUS_TEXT, type Language } from "../localization";
import type { EntityKind } from "../contracts/api-v1";
import type { Problem } from "../model/rules";
import type { StoreError } from "../store/sheetStore";

type Texts = (typeof SAVE_STATUS_TEXT)["es"];

const fill = (text: string, values: Record<string, unknown>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => (values[key] === undefined ? "" : String(values[key])));

/** "camposPersonalizados/custom-1/nombre" → "Campos personalizados (nombre)". */
export function fieldLabel(kind: EntityKind, path: string | undefined, lang: Language): string {
  const labels = FIELD_LABELS[lang];
  if (!path) return labels.sheet;
  const parts = path.split("/");
  const own = (labels.byKind[kind] as Record<string, string> | undefined)?.[parts[0]];
  const nested = parts.length > 1 ? (labels.fields as Record<string, string>)[`${parts[0]}/${parts[1]}`] : undefined;
  if (nested) return nested;
  const section = own ?? (labels.fields as Record<string, string>)[parts[0]] ?? labels.sheet;
  // A list entry's field: "notasList/<id>/contenido" → "Bitácora (texto)".
  const leaf = parts.length >= 3 ? (labels.itemFields as Record<string, string>)[parts[parts.length - 1]] : undefined;
  return leaf ? `${section} (${leaf})` : section;
}

/** A value as the viewer typed it: text as is, numbers, yes/no, an entry by its name. */
export function describeValue(value: unknown, lang: Language): string {
  const t = SAVE_STATUS_TEXT[lang];
  if (value === null || value === undefined || value === "") return t.empty;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? t.yes : t.no;
  if (Array.isArray(value)) return fill(t.entries, { n: value.length });
  if (typeof value === "object") {
    const entry = value as Record<string, unknown>;
    for (const key of ["nombre", "titulo", "descripcion", "value", "contenido"]) if (typeof entry[key] === "string" && entry[key]) return entry[key] as string;
    return t.anEntry;
  }
  return t.anEntry;
}

/** Why the app did not send an edit (checked before saving). */
export function problemText(problem: Problem, kind: EntityKind, lang: Language): string {
  const t = SAVE_STATUS_TEXT[lang];
  const field = fieldLabel(kind, problem.path, lang);
  const limit = problem.limit;
  switch (problem.rule) {
    case "required": return fill(t.ruleRequired, { field });
    case "maxLength": return fill(t.ruleMaxLength, { field, n: limit });
    case "maxItems": return fill(t.ruleMaxItems, { field, n: limit });
    case "range": {
      const [min, max] = Array.isArray(limit) ? limit : [];
      return fill(t.ruleRange, { field, min: min ?? "", max: max ?? "" });
    }
    case "notAboveMaximum": return fill(t.ruleNotAboveMaximum, { field });
    case "choice": return fill(t.ruleChoice, { field });
    case "notWritable": return fill(t.ruleNotWritable, { field });
    case "maxSheetBytes": return t.sheetFull;
    case "requireOneOf": return fill(t.ruleRequireOneOf, { field });
    default: return fill(t.ruleInvalid, { field });
  }
}

/** Errors the app retries by itself; «Reintentar» helps only with these. */
export const retryable = (code: string) => ["network_error", "server_error", "rate_limited"].includes(code);

/** Why the server did not save a change, and what to do. */
export function errorText(error: StoreError, kind: EntityKind, lang: Language): string {
  const t: Texts = SAVE_STATUS_TEXT[lang];
  const field = fieldLabel(kind, error.path, lang);
  // The server names the same rules the app checks (field_too_long + maxLength, …).
  if (error.rule && ["field_too_long", "field_required", "field_out_of_range", "too_many_items"].includes(error.code))
    return problemText({ path: error.path ?? "", rule: error.rule, limit: error.limit }, kind, lang);
  switch (error.code) {
    case "field_too_long": return fill(t.ruleMaxLength, { field, n: error.limit });
    case "field_required": case "name_required": return fill(t.ruleRequired, { field });
    case "too_many_items": return fill(t.ruleMaxItems, { field, n: error.limit });
    case "sheet_too_large": return t.sheetFull;
    case "field_out_of_range": case "invalid_field_value": case "unknown_field": case "invalid_path": case "invalid_item_id": case "duplicate_item_id":
      return fill(t.ruleInvalid, { field });
    case "field_forbidden": case "forbidden": return error.path ? fill(t.ruleNotWritable, { field }) : t.noAccess;
    case "item_not_found": case "parent_not_found": return t.entryGone;
    case "not_found": return t.notFound;
    case "archived": return t.archived;
    case "gm_only_skill": return t.gmOnlySkill;
    case "authentication_required": case "csrf_failed": return t.signedOut;
    case "rate_limited": return t.rateLimited;
    case "network_error": case "server_error": return t.connection;
    default: return t.refusedOther;
  }
}
