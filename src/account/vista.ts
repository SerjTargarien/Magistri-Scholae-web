/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Vista de jugadores (7a; product-design.md 10d): what the Máster shows the table on another
// screen. Campaign records, not sheet fields, so they have this adapter. «Ahora» holds values the
// server captured when they were shown; «Preparado» holds what to show next for one sheet.
import type { ApiPlayerView, ApiSheetProjection, ApiViewNow, ApiViewSpec } from "../contracts/api-v1";
import type { RemoteClient } from "../remote/client";
import { HOUSES } from "../data/gameData";
import { fieldLabel } from "./saveMessages";
import { FIELD_LABELS, type Language } from "../localization";

export interface VistaApi {
  settings(): Promise<ApiPlayerView>;
  change(body: { action?: "create" | "renew" | "disable"; inApp?: boolean; tableId?: string | null }): Promise<ApiPlayerView>;
  /** Puts a sheet on screen (without items: what was prepared for it), or empties it (null). */
  show(sheetId: string | null, items?: ApiViewSpec[]): Promise<ApiPlayerView>;
  prepared(kind: "character" | "familiar", sheetId: string): Promise<ApiViewSpec[]>;
  savePrepared(kind: "character" | "familiar", sheetId: string, items: ApiViewSpec[]): Promise<ApiViewSpec[]>;
  /** What shows now, as a signed-in member may follow it in the app. */
  following(): Promise<{ revision: number; now: ApiViewNow | null }>;
}

const plural = (kind: "character" | "familiar") => (kind === "character" ? "characters" : "familiars");

export function remoteVista(client: RemoteClient, campaignId: string): VistaApi {
  const base = `campaigns/${campaignId}/view`;
  return {
    settings: async () => (await client.request<{ view: ApiPlayerView }>(base)).view,
    change: async body => (await client.request<{ view: ApiPlayerView }>(base, "POST", body)).view,
    show: async (sheetId, items) => (await client.request<{ view: ApiPlayerView }>(`${base}/now`, "POST", items ? { sheetId, items } : { sheetId })).view,
    prepared: async (kind, sheetId) => (await client.request<{ items: ApiViewSpec[] }>(`${plural(kind)}/${sheetId}/prepared-view`)).items,
    savePrepared: async (kind, sheetId, items) => (await client.request<{ items: ApiViewSpec[] }>(`${plural(kind)}/${sheetId}/prepared-view`, "POST", { items })).items,
    following: () => client.request<{ revision: number; now: ApiViewNow | null }>(`${base}/now`),
  };
}

export const DEFAULT_SPECS: ApiViewSpec[] = [{ kind: "photo" }, { kind: "field", path: "nombre" }];
export const MAX_VIEW_ITEMS = 20;
export const MAX_VIEW_TEXT = 300;

// The values a sheet can show, as the server's allowlist (backend/domain/player_view.py).
const SHOWABLE: Record<"character" | "familiar", string[]> = {
  character: ["nombre", "concepto", "jugador", "edad", "curso", "puestoClase", "casa", "linaje", "economia", "varitaSintonia",
    "adultWizardProfile/role", "adultWizardProfile/institution", "adultWizardProfile/reputation", "adultWizardProfile/formerHouse",
    "adultWizardProfile/teachingSubjects", "aspectosPersonales", "complicaciones", "aspectoTemporal", "clubesList", "puntosDestino", "pxs"],
  familiar: ["nombre", "especie", "descripcion"],
};
/** Whether a path may be shown for this sheet: the allowlist, or one of its custom fields. */
export function showable(kind: "character" | "familiar", fields: Record<string, unknown>, path: string): boolean {
  if (path.startsWith(CUSTOM)) return kind === "character" && raw(fields, path) !== undefined;
  return SHOWABLE[kind].includes(path);
}
const VALUE_LISTS = new Set(["aspectosPersonales", "complicaciones", "aspectoTemporal", "adultWizardProfile/teachingSubjects"]);
const CUSTOM = "camposPersonalizados/";

export function raw(fields: Record<string, unknown>, path: string): unknown {
  if (path.startsWith(CUSTOM)) {
    const found = (fields.camposPersonalizados as { id?: string; nombre?: string; valor?: string }[] | undefined)?.find(i => i.id === path.slice(CUSTOM.length));
    return found ? { nombre: found.nombre ?? "", valor: found.valor ?? "" } : undefined;
  }
  let value: unknown = fields;
  for (const part of path.split("/")) value = value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined;
  if (VALUE_LISTS.has(path)) return ((value as { value?: string }[]) ?? []).map(i => i.value ?? "");
  if (path === "clubesList") return ((value as { nombre?: string }[]) ?? []).map(i => i.nombre ?? "");
  return value;
}

/** A value as it reads on screen: house names, lists joined, custom fields by their own value. */
export function valueText(path: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (path === "casa") return HOUSES[String(value)]?.nombre ?? "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "object") return String((value as { valor?: string }).valor ?? "");
  return String(value);
}

/** A field's name on screen: the sheet's own words; a custom field's own name. */
export function itemLabel(kind: "character" | "familiar", path: string, value: unknown, lang: Language): string {
  if (path.startsWith(CUSTOM)) return String((value as { nombre?: string } | undefined)?.nombre ?? "") || FIELD_LABELS[lang].fields.camposPersonalizados;
  return fieldLabel(kind, path, lang);
}

export interface ViewChoice { spec: ApiViewSpec; label: string; preview: string }

/** Everything this sheet can show that is not already in the list, for the search box. */
export function choicesFor(sheet: ApiSheetProjection, used: ApiViewSpec[], lang: Language, portraitWord: string): ViewChoice[] {
  const kind = sheet.entityType;
  const fields = sheet.fields as Record<string, unknown>;
  const taken = new Set(used.map(s => (s.kind === "field" ? s.path : s.kind)));
  const out: ViewChoice[] = [];
  if (!taken.has("photo")) out.push({ spec: { kind: "photo" }, label: portraitWord, preview: "" });
  const paths = [...SHOWABLE[kind], ...(kind === "character" ? ((fields.camposPersonalizados as { id: string }[] | undefined) ?? []).map(i => CUSTOM + i.id) : [])];
  for (const path of paths) {
    if (taken.has(path)) continue;
    const value = raw(fields, path);
    out.push({ spec: { kind: "field", path }, label: itemLabel(kind, path, value, lang), preview: valueText(path, value) });
  }
  return out;
}

/** How one item of a list reads in the panel, before it is shown (from the open sheet). */
export function describeSpec(sheet: ApiSheetProjection | undefined, spec: ApiViewSpec, lang: Language, portraitWord: string): { label: string; value: string } {
  if (spec.kind === "photo") return { label: portraitWord, value: "" };
  if (spec.kind === "text") return { label: "", value: spec.value };
  const kind = sheet?.entityType ?? "character";
  const value = sheet ? raw(sheet.fields as Record<string, unknown>, spec.path) : undefined;
  return { label: itemLabel(kind, spec.path, value, lang), value: valueText(spec.path, value) };
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const matches = (choice: ViewChoice, query: string) => {
  const q = fold(query.trim());
  return !q || fold(choice.label).includes(q) || fold(choice.preview).includes(q);
};
