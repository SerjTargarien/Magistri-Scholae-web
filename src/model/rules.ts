// The server's field rules, read from its field list (R3.2;
// docs/field-rules.md). The screens use them for input limits and for the
// warnings near a limit; the server remains the authority and checks every
// save (backend/domain/fields.py). Catalogue rules for skills live in
// catalogue.ts and on the server.
import { API_SCHEMA } from "../contracts/fieldRegistry.generated";
import type { EntityKind } from "../contracts/api-v1";

export interface Rule {
  readonly type: "string" | "number" | "boolean" | "media" | "object" | "items";
  readonly maxLength?: number;
  readonly required?: boolean;
  readonly choices?: readonly string[];
  readonly integer?: boolean;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly maxItems?: number;
  readonly requireOneOf?: readonly string[];
  readonly skillEntry?: boolean;
  readonly fields?: Readonly<Record<string, Rule>>;
}

export interface Problem { path: string; rule: string; limit?: unknown }

/** Text stored per sheet; images are separate files (server: MAX_SHEET_BYTES). */
export const MAX_SHEET_BYTES = 5 * 1024 * 1024;
/** Above this share of a limit, the screen shows a counter (owner decision). */
export const WARNING_SHARE = 0.9;
const STRESS = [["estresFisico", "estresFisicoMax"], ["estresMental", "estresMentalMax"], ["estresSocial", "estresSocialMax"]] as const;

const entity = (kind: EntityKind): Rule => ({ type: "object", fields: API_SCHEMA.entities[kind] as Record<string, Rule> });

/** The rule for a path such as "nombre", "habilidades" or "habilidades/<id>/valor". */
export function ruleAt(kind: EntityKind, path: string): Rule | undefined {
  let rule: Rule | undefined = entity(kind);
  for (const part of path.split("/")) {
    if (!rule) return undefined;
    if (rule.type === "items") rule = { type: "object", fields: rule.fields };
    else rule = rule.type === "object" ? rule.fields?.[part] : undefined;
  }
  return rule;
}

/** How full a text or list is, from 0 to 1 (or more when over the limit); undefined without a limit. */
export function usage(rule: Rule | undefined, value: unknown): number | undefined {
  if (rule?.type === "string" && rule.maxLength && typeof value === "string") return value.length / rule.maxLength;
  if (rule?.type === "items" && rule.maxItems && Array.isArray(value)) return value.length / rule.maxItems;
  return undefined;
}

export const nearLimit = (rule: Rule | undefined, value: unknown) => (usage(rule, value) ?? 0) >= WARNING_SHARE;

function check(value: unknown, rule: Rule, path: string, problems: Problem[]) {
  switch (rule.type) {
    case "string":
      if (typeof value !== "string") { problems.push({ path, rule: "type" }); return; }
      if (rule.choices && !rule.choices.includes(value)) problems.push({ path, rule: "choice", limit: rule.choices });
      else if (rule.maxLength !== undefined && value.length > rule.maxLength) problems.push({ path, rule: "maxLength", limit: rule.maxLength });
      else if (rule.required && !value.trim()) problems.push({ path, rule: "required" });
      return;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value) || (rule.integer && !Number.isInteger(value))) { problems.push({ path, rule: rule.integer ? "integer" : "type" }); return; }
      if (value < (rule.minimum ?? -1e12) || value > (rule.maximum ?? 1e12)) problems.push({ path, rule: "range", limit: [rule.minimum, rule.maximum] });
      return;
    case "boolean":
      if (typeof value !== "boolean") problems.push({ path, rule: "type" });
      return;
    case "media":
      if (value !== null && value !== "" && typeof value !== "string") problems.push({ path, rule: "type" });
      return;
    case "object":
      if (!value || typeof value !== "object" || Array.isArray(value)) { problems.push({ path, rule: "type" }); return; }
      for (const [key, entry] of Object.entries(value)) {
        const child = rule.fields?.[key];
        if (!child) problems.push({ path: join(path, key), rule: "unknownField" });
        else check(entry, child, join(path, key), problems);
      }
      return;
    case "items": {
      if (!Array.isArray(value)) { problems.push({ path, rule: "type" }); return; }
      if (rule.maxItems !== undefined && value.length > rule.maxItems) problems.push({ path, rule: "maxItems", limit: rule.maxItems });
      for (const entry of value as Record<string, unknown>[]) {
        const { id, ...fields } = entry ?? {};
        const itemPath = join(path, String(id));
        check(fields, { type: "object", fields: rule.fields }, itemPath, problems);
        if (rule.requireOneOf && !rule.requireOneOf.some(name => typeof fields[name] === "string" && (fields[name] as string).trim()))
          problems.push({ path: itemPath, rule: "requireOneOf", limit: rule.requireOneOf });
        if (rule.skillEntry) {
          const linked = !!fields.catalogo;
          const own = !!String(fields.nombre ?? "").trim() && !!fields.categoria;
          if (linked === own || (linked && ("nombre" in fields || "categoria" in fields)))
            problems.push({ path: itemPath, rule: "linkedOrOwn" });
        }
      }
    }
  }
}

const join = (path: string, key: string) => (path ? `${path}/${key}` : key);

/** Every rule a whole sheet breaks, as the server would see it (without catalogue checks). */
export function checkSheet(kind: EntityKind, data: Record<string, unknown>): Problem[] {
  const problems: Problem[] = [];
  check(data, entity(kind), "", problems);
  // A present but blank name is already reported by its field rule.
  if (data.nombre === undefined) problems.push({ path: "nombre", rule: "required" });
  if (kind === "character") for (const [current, maximum] of STRESS) {
    const value = data[current], max = (data[maximum] as number | undefined) ?? 10;
    if (typeof value === "number" && value > max) problems.push({ path: current, rule: "notAboveMaximum", limit: maximum });
  }
  if (new TextEncoder().encode(JSON.stringify(data)).length > MAX_SHEET_BYTES) problems.push({ path: "", rule: "maxSheetBytes", limit: MAX_SHEET_BYTES });
  return problems;
}
