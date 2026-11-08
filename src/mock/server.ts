// The in-browser mock server (R3.3). It answers the same API as the Django
// backend for development and tests: each viewer's projection (GM, assigned
// player, shared reader) with hidden fields absent, capabilities, revisions,
// the field rules and the skill catalogue, operation receipts, images, bonds
// and GM notes. A test panel simulates failures, other editors and connection
// drops. It is a development simulation, never authorization: it exists only
// in demo builds (VITE_MOCK_SERVER) and always shows the DEMO banner.
import type { ApiSheetProjection, EntityKind } from "../contracts/api-v1";
import { API_SCHEMA } from "../contracts/fieldRegistry.generated";
import { checkSkills, DEFAULT_SKILL_CATALOGUE, linkOwnSkills, nameClash, ownSkillsKey, type SkillCatalogue } from "../model/catalogue";
import { checkSheet, type Rule } from "../model/rules";
import { setApiTransport } from "../remote/client";
import { setAssetResolver } from "../remote/assets";
import { setPath, pathValue } from "../store/paths";
import { CAMPAIGN, demoAssets, demoSheets, USERS, type DemoRole, type DemoSheet, type DemoUser } from "./fixtures";

const STORAGE_KEY = "magistri_demo_server_v1";
const CODES: Record<string, string> = {
  maxLength: "field_too_long", required: "field_required", range: "field_out_of_range", notAboveMaximum: "field_out_of_range",
  maxItems: "too_many_items", choice: "invalid_field_value", integer: "invalid_field_value", type: "invalid_field_value",
  linkedOrOwn: "field_required", requireOneOf: "field_required", unknownField: "unknown_field", maxSheetBytes: "sheet_too_large",
};

interface PersonalNote { id: string; author: string; sheetId: string | null; label: string; title: string; content: string; revision: number }
interface State {
  viewer: DemoRole | null; sheets: DemoSheet[]; notes: PersonalNote[]; uploads: Record<string, string>;
  /** The campaign's skill list, which the demo GM can change (C2). */
  catalogue: SkillCatalogue; catalogueRevision: number;
}
export type Failure = "network" | "server" | "lostReply";

class Reply { constructor(public status: number, public body: unknown) {} }
const fail = (status: number, code: string, details: object = {}) => new Reply(status, { error: { code, ...details } });
/** The server's paging rule (views.pagination): limit 1-100, default 50; offset 0-100000. */
function pageOf(query: URLSearchParams): { limit: number; offset: number } | null {
  const limit = Number(query.get("limit") ?? "50"), offset = Number(query.get("offset") ?? "0");
  return Number.isInteger(limit) && Number.isInteger(offset) && limit >= 1 && limit <= 100 && offset >= 0 && offset <= 100000 ? { limit, offset } : null;
}

const plural = (kind: EntityKind) => (kind === "character" ? "characters" : "familiars");
const hidden = (path: string, list: readonly string[]) => list.some(h => path === h || path.startsWith(h + "/"));

export class MockServer {
  state: State;
  readonly assets = demoAssets();
  offline = false;
  slow = false;
  nextFailure?: Failure;
  lastOpened?: string;
  private receipts = new Map<string, Reply>();

  constructor(private storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | undefined = globalThis.localStorage) {
    this.state = this.load() ?? this.fresh();
  }

  private fresh(): State {
    return { viewer: "player", sheets: demoSheets(), notes: [], uploads: {}, catalogue: structuredClone(DEFAULT_SKILL_CATALOGUE), catalogueRevision: 1 };
  }
  private load(): State | undefined {
    try {
      const state = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? "null");
      // Demo data saved before the GM could change the list has none.
      return state ? { catalogue: structuredClone(DEFAULT_SKILL_CATALOGUE), catalogueRevision: 1, ...state } : undefined;
    } catch { return undefined; }
  }
  private save() { try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch { /* storage full: keep in memory */ } }

  reset() { this.state = this.fresh(); this.receipts.clear(); this.save(); }
  signInAs(role: DemoRole) { this.state.viewer = role; this.save(); }
  asset(id: string): string | undefined { return this.state.uploads[id] ?? this.assets[id]; }

  /** Someone else (the GM) saves a change to the sheet last opened. */
  otherEdit(path: "concepto" | "nombre") {
    const sheet = this.state.sheets.find(s => s.id === this.lastOpened);
    if (!sheet) return false;
    sheet.fields = setPath(sheet.fields, path, `${pathValue(sheet.fields, path) ?? ""} (cambiado por otra persona)`.slice(0, path === "nombre" ? 80 : 200));
    sheet.revision++;
    this.save();
    return true;
  }

  private viewer(): DemoUser | undefined { return this.state.viewer ? USERS[this.state.viewer] : undefined; }

  // ---- projections ---------------------------------------------------------

  private access(sheet: DemoSheet, user: DemoUser): "gm" | "assigned" | "shared" | undefined {
    if (user.role === "gm") return "gm";
    if (sheet.archived) return undefined;
    if (sheet.assignedPlayerId === user.id) return "assigned";
    if (sheet.sharedWith.includes(user.id)) return "shared";
    return undefined;
  }

  private hiddenFor(sheet: DemoSheet, access: "gm" | "assigned" | "shared") {
    return access === "gm" ? [] : access === "assigned" ? sheet.gmOnly : [...sheet.gmOnly, ...sheet.restricted];
  }

  private strip(value: any, list: readonly string[], prefix = ""): any {
    if (Array.isArray(value)) return value.map(item => ({ id: item.id, ...this.strip(Object.fromEntries(Object.entries(item).filter(([k]) => k !== "id")), list, `${prefix}/${item.id}`) }));
    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(value)) {
        const path = prefix ? `${prefix}/${key}` : key;
        if (!hidden(path, list)) result[key] = this.strip(entry, list, path);
      }
      return result;
    }
    return value;
  }

  projection(sheet: DemoSheet, user: DemoUser): ApiSheetProjection {
    const access = this.access(sheet, user)!;
    const list = this.hiddenFor(sheet, access);
    const fields = this.strip(sheet.fields, list);
    const writer = (access === "gm" || access === "assigned") && !sheet.archived;
    const readablePaths: string[] = [], writablePaths: string[] = [], collectionPaths: string[] = [], removablePaths: string[] = [];
    const leaves = (value: any, path: string) => {
      if (Array.isArray(value)) value.forEach(item => Object.entries(item).forEach(([k, v]) => k !== "id" && leaves(v, `${path}/${item.id}/${k}`)));
      else if (value && typeof value === "object") Object.entries(value).forEach(([k, v]) => leaves(v, path ? `${path}/${k}` : k));
      else readablePaths.push(path);
    };
    leaves(fields, "");
    const editable = (rule: Rule, value: any, path: string) => {
      if (hidden(path, list) && path) return;
      if (rule.type === "object") Object.entries(rule.fields ?? {}).forEach(([k, r]) => editable(r, value?.[k], path ? `${path}/${k}` : k));
      else if (rule.type === "items") {
        collectionPaths.push(path);
        for (const item of value ?? []) {
          removablePaths.push(`${path}/${item.id}`);
          Object.entries(rule.fields ?? {}).forEach(([k, r]) => editable(r, item[k], `${path}/${item.id}/${k}`));
        }
      } else writablePaths.push(path);
    };
    if (writer) editable({ type: "object", fields: API_SCHEMA.entities[sheet.kind] as Record<string, Rule> }, fields, "");
    let removable = removablePaths, writable = writablePaths;
    if (access !== "gm" && sheet.kind === "character") {
      // Like the server: only the GM names, moves or removes own skills.
      const own = new Set(((fields as any).habilidades ?? []).filter((e: any) => !e.catalogo).map((e: any) => `habilidades/${e.id}`));
      removable = removablePaths.filter(p => !own.has(p));
      writable = writablePaths.filter(p => !(p.startsWith("habilidades/") && /\/(nombre|categoria)$/.test(p)));
    }
    return {
      kind: "viewer-projection", id: sheet.id, entityType: sheet.kind, campaignId: CAMPAIGN.id, schemaVersion: 4,
      revision: `r${sheet.revision}-${user.role}`, fields: fields as any,
      capabilities: { readablePaths, writablePaths: writable, collectionPaths, removablePaths: removable, bondWritable: writer, isGM: access === "gm" },
      ...(sheet.bondId ? { bondId: sheet.bondId } : {}),
      ...(access === "gm" ? { assignedPlayerId: sheet.assignedPlayerId, archived: sheet.archived } : {}),
    };
  }

  // ---- requests --------------------------------------------------------------

  async fetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    if (this.slow) await new Promise(resolve => setTimeout(resolve, 1500));
    if (this.offline) throw new TypeError("Failed to fetch (demo: offline)");
    const method = (init.method ?? "GET").toUpperCase();
    const mutation = method !== "GET";
    const failure = mutation ? this.nextFailure : undefined;
    if (failure) this.nextFailure = undefined;
    if (failure === "network") throw new TypeError("Failed to fetch (demo: connection lost)");
    if (failure === "server") return this.respond(fail(500, "server_error"));
    const url = new URL(String(input instanceof Request ? input.url : input), "http://demo.invalid");
    const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
    const reply = this.route(method, url.pathname.replace(/^\/api\/v1\//, ""), url.searchParams, body);
    if (failure === "lostReply") throw new TypeError("Failed to fetch (demo: reply lost after saving)");
    return this.respond(reply);
  }

  private respond(reply: Reply) {
    return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { "Content-Type": "application/json" } });
  }

  private route(method: string, path: string, query: URLSearchParams, body: any): Reply {
    if (path === "auth/csrf") return new Reply(200, { csrfToken: "demo-csrf" });
    if (path === "auth/login" && method === "POST") {
      // Like the server (models.normalized_username): letters, digits, _ and -, compared in lowercase.
      const name = typeof body.username === "string" && /^[A-Za-z0-9_-]{3,30}$/.test(body.username) ? body.username.toLowerCase() : "";
      const user = Object.values(USERS).find(u => u.username === name);
      if (!user) return fail(401, "invalid_credentials"); // like the server
      this.signInAs(user.role);
      return new Reply(200, { user: this.userView(user), csrfToken: "demo-csrf" });
    }
    // The demo has no invitations or reset codes: every code is refused, as the server refuses a bad one.
    if (path === "auth/register" && method === "POST") return fail(400, "invalid_invitation");
    if (path === "auth/password-reset" && method === "POST") return fail(400, "invalid_reset_code");
    const user = this.viewer();
    if (path === "auth/logout" && method === "POST") { this.state.viewer = null; this.save(); return new Reply(200, {}); }
    if (!user) return fail(401, "authentication_required");
    if (path === "auth/me") return new Reply(200, this.userView(user));
    if (path === "campaigns" && method === "GET")
      return pageOf(query) ? new Reply(200, { items: [{ ...CAMPAIGN, role: user.role === "gm" ? "gm" : "player" }] }) : fail(400, "invalid_request");
    if (path === `campaigns/${CAMPAIGN.id}/skill-catalogue`) return method === "POST" ? this.saveCatalogue(body, user)
      : new Reply(200, { catalogue: this.state.catalogue, revision: this.state.catalogueRevision });
    if (path.startsWith("personal-notes")) return this.personalNotes(method, path, body, user);

    const match = path.match(/^(characters|familiars)(?:\/([^/]+))?(?:\/(assets|bond|manage|gm-notes))?$/);
    if (!match) return fail(501, "not_in_demo");
    const kind: EntityKind = match[1] === "characters" ? "character" : "familiar";
    const [, , id, action] = match;
    if (!id) {
      if (method === "POST") return this.receipt(body, () => this.create(kind, body, user));
      if (query.get("campaignId") !== CAMPAIGN.id) return fail(404, "not_found");
      const page = pageOf(query);
      if (!page) return fail(400, "invalid_request");
      // Newest first, like the server (sheets are stored in creation order).
      const items = this.state.sheets.filter(s => s.kind === kind && this.access(s, user)).reverse();
      return new Reply(200, { items: items.slice(page.offset, page.offset + page.limit).map(s => this.projection(s, user)) });
    }
    const sheet = this.state.sheets.find(s => s.id === id && s.kind === kind);
    if (!sheet || !this.access(sheet, user)) return fail(404, "not_found");
    if (!action && method === "GET") { this.lastOpened = sheet.id; return new Reply(200, this.projection(sheet, user)); }
    if (action === "gm-notes") return this.gmNotes(method, sheet, body, user);
    return this.receipt(body, () => {
      if (body.expectedRevision !== this.projection(sheet, user).revision) return fail(409, "revision_conflict");
      if (!action && method === "PATCH") return this.patch(sheet, body, user);
      if (action === "assets" && method === "POST") return this.upload(sheet, body, user);
      if (action === "bond" && method === "POST") return this.bond(sheet, body, user);
      if (action === "manage" && method === "POST") return this.manage(sheet, body, user);
      return fail(405, "method_not_allowed");
    });
  }

  private userView(user: DemoUser) { return { id: user.id, username: user.username, displayName: user.displayName, isAdministrator: false }; }

  /** Retrying an operation ID returns its first outcome, like the server's receipts. */
  private receipt(body: any, run: () => Reply): Reply {
    const id = typeof body.operationId === "string" ? body.operationId : undefined;
    if (id && this.receipts.has(id)) return this.receipts.get(id)!;
    const reply = run();
    if (id && reply.status < 500) this.receipts.set(id, reply);
    if (reply.status < 300) this.save();
    return reply;
  }

  private problems(kind: EntityKind, fields: Record<string, unknown>, touched?: ReadonlySet<string>): Reply | undefined {
    const problem = checkSheet(kind, fields)[0];
    if (problem) return fail(400, CODES[problem.rule] ?? "invalid_field_value", problem);
    if (kind === "character") {
      const skills = checkSkills((fields as any).habilidades, this.state.catalogue, touched);
      if (skills) return fail(400, skills.code, { path: skills.path, rule: skills.rule });
    }
    return undefined;
  }

  /** Like services.save_catalogue: GM only, current revision, nothing removed, unique names; matching own skills become links. */
  private saveCatalogue(body: any, user: DemoUser): Reply {
    if (user.role !== "gm") return fail(403, "forbidden");
    if (body?.expectedRevision !== this.state.catalogueRevision) return fail(409, "revision_conflict");
    const next = body.catalogue as SkillCatalogue;
    if (!next || !Array.isArray(next.categorias) || !Array.isArray(next.habilidades)) return fail(400, "invalid_catalogue");
    for (const section of ["categorias", "habilidades"] as const) {
      const ids = new Set(next[section].map(e => e.id));
      if (this.state.catalogue[section].some(e => !ids.has(e.id))) return fail(400, "catalogue_entry_removed");
    }
    if (next.habilidades.some(s => !(s.nombre?.es?.trim() || s.nombre?.en?.trim()) || !next.categorias.some(c => c.id === s.categoria)))
      return fail(400, "invalid_catalogue");
    const clash = nameClash(next);
    if (clash) return fail(400, "duplicate_skill", { path: `habilidades/${clash.id}/nombre`, rule: "unique" });
    this.state.catalogue = structuredClone(next);
    this.state.catalogueRevision++;
    for (const sheet of this.state.sheets) {
      if (sheet.kind !== "character") continue;
      const linked = linkOwnSkills((sheet.fields as any).habilidades, next);
      if (linked) { sheet.fields = { ...sheet.fields, habilidades: linked } as any; sheet.revision++; }
    }
    return new Reply(200, { catalogue: this.state.catalogue, revision: this.state.catalogueRevision });
  }

  private create(kind: EntityKind, body: any, user: DemoUser): Reply {
    if (body.campaignId !== CAMPAIGN.id || !body.fields || typeof body.fields !== "object") return fail(400, "invalid_request");
    const refused = this.problems(kind, body.fields);
    if (refused) return refused;
    if (user.role !== "gm" && ownSkillsKey((body.fields as any).habilidades) !== "[]") return fail(403, "gm_only_skill");
    const sheet: DemoSheet = { id: `demo-${crypto.randomUUID()}`, kind, fields: structuredClone(body.fields), assignedPlayerId: user.id,
      archived: false, revision: 1, gmOnly: [], restricted: [], sharedWith: [], gmNote: { content: "", revision: 0 } };
    this.state.sheets.push(sheet);
    return new Reply(200, this.projection(sheet, user));
  }

  private patch(sheet: DemoSheet, body: any, user: DemoUser): Reply {
    const changes = body.changes;
    if (!Array.isArray(changes) || changes.length < 1 || changes.length > 100) return fail(400, "invalid_request");
    const capabilities = this.projection(sheet, user).capabilities;
    const paths: string[] = [];
    let fields: any = sheet.fields;
    const touched = new Set<string>();
    for (const { path, value } of changes) {
      if (typeof path !== "string" || paths.some(p => p === path || p.startsWith(path + "/") || path.startsWith(p + "/"))) return fail(400, "overlapping_changes");
      paths.push(path);
      const parent = capabilities.collectionPaths.find(c => path.startsWith(c + "/") && path.slice(c.length + 1).split("/").length === 1);
      const allowed = capabilities.writablePaths.includes(path) || capabilities.removablePaths.includes(path)
        || (parent !== undefined && value !== null && pathValue(fields, path) === undefined);
      if (!allowed) return fail(403, "field_forbidden");
      if (path.startsWith("habilidades/")) touched.add(path.split("/")[1]);
      else if (path === "habilidades") (value ?? []).forEach((e: any) => touched.add(e.id));
      fields = setPath(fields, path, value);
    }
    const refused = this.problems(sheet.kind, fields, touched);
    if (refused) return refused;
    if (this.access(sheet, user) !== "gm" && ownSkillsKey(fields.habilidades) !== ownSkillsKey((sheet.fields as any).habilidades))
      return fail(403, "gm_only_skill");
    sheet.fields = fields;
    sheet.revision++;
    return new Reply(200, this.projection(sheet, user));
  }

  private upload(sheet: DemoSheet, body: any, user: DemoUser): Reply {
    const capabilities = this.projection(sheet, user).capabilities;
    if (typeof body.path !== "string" || !capabilities.writablePaths.includes(body.path) && !capabilities.collectionPaths.some(c => body.path.startsWith(c + "/")))
      return fail(403, "field_forbidden");
    if (typeof body.imageBase64 !== "string" || body.imageBase64.length > 4 * 1024 * 1024 * 4 / 3 + 4) return fail(413, "image_too_large");
    const mime = body.imageBase64.startsWith("iVBOR") ? "image/png" : body.imageBase64.startsWith("UklGR") ? "image/webp" : "image/jpeg";
    const id = crypto.randomUUID();
    this.state.uploads[id] = `data:${mime};base64,${body.imageBase64}`;
    sheet.fields = setPath(sheet.fields, body.path, id);
    sheet.revision++;
    return new Reply(200, this.projection(sheet, user));
  }

  private bond(sheet: DemoSheet, body: any, user: DemoUser): Reply {
    const target = body.targetId === null ? undefined : this.state.sheets.find(s => s.id === body.targetId && s.kind !== sheet.kind);
    if (body.targetId !== null && (!target || !this.access(target, user))) return fail(400, "invalid_bond");
    if (!this.projection(sheet, user).capabilities.bondWritable || (target && !this.projection(target, user).capabilities.bondWritable)) return fail(403, "forbidden");
    for (const s of this.state.sheets) if (s.bondId === sheet.id || (target && s.bondId === target.id)) { delete s.bondId; s.revision++; }
    delete sheet.bondId;
    if (target) { sheet.bondId = target.id; target.bondId = sheet.id; target.revision++; }
    sheet.revision++;
    return new Reply(200, this.projection(sheet, user));
  }

  private manage(sheet: DemoSheet, body: any, user: DemoUser): Reply {
    if (user.role !== "gm") return fail(403, "forbidden");
    if (typeof body.archived === "boolean") sheet.archived = body.archived;
    sheet.revision++;
    return new Reply(200, this.projection(sheet, user));
  }

  private gmNotes(method: string, sheet: DemoSheet, body: any, user: DemoUser): Reply {
    if (user.role !== "gm") return fail(403, "forbidden");
    if (method === "PATCH") {
      if (body.expectedRevision !== sheet.gmNote.revision) return fail(409, "revision_conflict");
      sheet.gmNote = { content: String(body.content ?? "").slice(0, 64000), revision: sheet.gmNote.revision + 1 };
      this.save();
    }
    return new Reply(200, sheet.gmNote);
  }

  private personalNotes(method: string, path: string, body: any, user: DemoUser): Reply {
    const view = ({ author: _a, ...note }: PersonalNote) => note;
    if (path === "personal-notes") {
      if (method === "POST") {
        if (typeof body.title !== "string" || !body.title.trim()) return fail(400, "invalid_request");
        const note = { id: crypto.randomUUID(), author: user.id, sheetId: body.sheetId ?? null, label: String(body.label ?? ""),
          title: body.title, content: String(body.content ?? ""), revision: 1 };
        this.state.notes.push(note); this.save();
        return new Reply(200, view(note));
      }
      return new Reply(200, { items: this.state.notes.filter(n => n.author === user.id).map(view) });
    }
    const match = path.match(/^personal-notes\/([^/]+)(\/promote(\/preview)?)?$/);
    const note = this.state.notes.find(n => n.id === match?.[1] && n.author === user.id);
    if (!match || !note) return fail(404, "not_found");
    if (match[2]) return fail(501, "not_in_demo");
    if (method === "GET") return new Reply(200, view(note));
    if (body.expectedRevision !== note.revision) return fail(409, "revision_conflict");
    if (method === "DELETE") { this.state.notes = this.state.notes.filter(n => n !== note); this.save(); return new Reply(200, {}); }
    Object.assign(note, { title: body.title ?? note.title, content: body.content ?? note.content, label: body.label ?? note.label, revision: note.revision + 1 });
    this.save();
    return new Reply(200, view(note));
  }
}

let installed: MockServer | undefined;
export const mockServer = () => installed;

/** Routes the app's API calls and images to the mock, and lets the panel simulate a connection drop. */
export function installMockServer(server = new MockServer()): MockServer {
  installed = server;
  setApiTransport((input, init) => server.fetch(input, init));
  setAssetResolver(id => server.asset(id) ?? "");
  const real = Object.getOwnPropertyDescriptor(Navigator.prototype, "onLine");
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => !server.offline && (real?.get?.call(navigator) ?? true) });
  return server;
}

export function setOffline(offline: boolean) {
  if (!installed) return;
  installed.offline = offline;
  window.dispatchEvent(new Event(offline ? "offline" : "online"));
}
