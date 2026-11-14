// The in-browser mock server (R3.3). It answers the same API as the Django
// backend for development and tests: each viewer's projection (GM, assigned
// player, shared reader) with hidden fields absent, capabilities, revisions,
// the field rules and the skill catalogue, operation receipts, images, bonds
// and GM notes, and the site administrator's accounts, campaigns, members,
// invitations and recovery codes (R4 a). A test panel simulates failures, other
// editors and connection drops. It is a development simulation, never authorization: it exists only
// in demo builds (VITE_MOCK_SERVER) and always shows the DEMO banner.
import type { ApiSheetProjection, EntityKind } from "../contracts/api-v1";
import { API_SCHEMA } from "../contracts/fieldRegistry.generated";
import { checkSkills, DEFAULT_SKILL_CATALOGUE, linkOwnSkills, nameClash, ownSkillsKey, type SkillCatalogue } from "../model/catalogue";
import { checkSheet, type Rule } from "../model/rules";
import { setApiTransport } from "../remote/client";
import { setAssetResolver } from "../remote/assets";
import { setPath, pathValue } from "../store/paths";
import { CAMPAIGN, demoAssets, demoSheets, PARTIDAS, USERS, type DemoRole, type DemoSheet, type DemoUser } from "./fixtures";

const STORAGE_KEY = "magistri_demo_server_v1";
const CODES: Record<string, string> = {
  maxLength: "field_too_long", required: "field_required", range: "field_out_of_range", notAboveMaximum: "field_out_of_range",
  maxItems: "too_many_items", choice: "invalid_field_value", integer: "invalid_field_value", type: "invalid_field_value",
  linkedOrOwn: "field_required", requireOneOf: "field_required", unknownField: "unknown_field", maxSheetBytes: "sheet_too_large",
};

interface PersonalNote { id: string; author: string; sheetId: string | null; label: string; title: string; content: string; revision: number; createdAt: number; updatedAt: number }
type Role = "gm" | "player";
interface Account { id: string; username: string; displayName: string; admin: boolean; active: boolean }
interface Invite { id: string; token: string; campaignId: string; role: Role; issuer: string; expiresAt: number; used: boolean }
/** Accounts, campaigns and invitations (R4 a). Accounts registered in the demo appear here but cannot sign in. */
interface Directory {
  accounts: Account[]; campaigns: { id: string; name: string }[];
  members: { campaignId: string; userId: string; role: Role }[];
  invitations: Invite[]; resets: { code: string; userId: string; expiresAt: number }[];
}
interface State {
  viewer: DemoRole | null; sheets: DemoSheet[]; notes: PersonalNote[]; uploads: Record<string, string>;
  /** The campaign's skill list, which the demo GM can change (C2). */
  catalogue: SkillCatalogue; catalogueRevision: number;
  directory: Directory;
  /** The demo campaign's partidas (R4 b), the GM's only. */
  partidas: { id: string; name: string }[];
}
const DAY = 24 * 60 * 60 * 1000;
function freshDirectory(): Directory {
  return {
    accounts: Object.values(USERS).map(u => ({ id: u.id, username: u.username, displayName: u.displayName, admin: u.role === "admin", active: true })),
    campaigns: [{ id: CAMPAIGN.id, name: CAMPAIGN.name }],
    members: Object.values(USERS).map(u => ({ campaignId: CAMPAIGN.id, userId: u.id, role: u.role === "gm" ? "gm" as const : "player" as const })),
    invitations: [], resets: [],
  };
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
    return { viewer: "player", sheets: demoSheets(), notes: [], uploads: {}, catalogue: structuredClone(DEFAULT_SKILL_CATALOGUE), catalogueRevision: 1, directory: freshDirectory(), partidas: structuredClone(PARTIDAS) };
  }
  private load(): State | undefined {
    try {
      const state = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? "null");
      // Demo data saved before the GM could change the list has none.
      return state ? { catalogue: structuredClone(DEFAULT_SKILL_CATALOGUE), catalogueRevision: 1, directory: freshDirectory(), partidas: [], ...state } : undefined;
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
    // Like permissions.gm_of: the GM's powers cover every sheet except a player's drafts (R4 c).
    if (user.role === "gm" && sheet.status !== "draft") return "gm";
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
    // A proposal is read-only for everyone while the GM reviews it (R4 c).
    const writer = (access === "gm" || access === "assigned") && !sheet.archived && sheet.status !== "proposed";
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
      status: sheet.status ?? "confirmed", active: sheet.active !== false,
      capabilities: { readablePaths, writablePaths: writable, collectionPaths, removablePaths: removable, bondWritable: writer, isGM: access === "gm" },
      ...(sheet.bondId ? { bondId: sheet.bondId } : {}),
      ...(access === "gm" ? { assignedPlayerId: sheet.assignedPlayerId, archived: sheet.archived } : {}),
      // The partida: the GM's only, characters only (R4 b).
      ...(access === "gm" && sheet.kind === "character" ? { tableId: sheet.tableId ?? null } : {}),
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
      // Like the server: unknown and disabled accounts are refused alike.
      if (!user || !this.account(user.id)?.active) return fail(401, "invalid_credentials");
      this.signInAs(user.role);
      return new Reply(200, { user: this.userView(user), csrfToken: "demo-csrf" });
    }
    // Codes issued in this demo work once, like the server's (an account registered here cannot sign in).
    if (path === "auth/register" && method === "POST") return this.register(body);
    if (path === "auth/password-reset" && method === "POST") return this.passwordReset(body);
    const user = this.viewer();
    if (path === "auth/logout" && method === "POST") { this.state.viewer = null; this.save(); return new Reply(200, {}); }
    if (!user) return fail(401, "authentication_required");
    if (path === "auth/me") return new Reply(200, this.userView(user));
    if (path === "campaigns" || path.startsWith("campaigns/") && path.endsWith("/members") || path.startsWith("admin/") || path === "auth/invitations" || path === "auth/reset-codes") {
      const reply = this.directoryRoute(method, path, query, body, user);
      if (reply) return reply;
    }
    if (path === `campaigns/${CAMPAIGN.id}/skill-catalogue`) return method === "POST" ? this.saveCatalogue(body, user)
      : new Reply(200, { catalogue: this.state.catalogue, revision: this.state.catalogueRevision });
    if (path.startsWith("personal-notes")) return this.personalNotes(method, path, query, body, user);
    if (path.startsWith(`campaigns/${CAMPAIGN.id}/tables`)) return this.partidas(method, path, body, user);

    const match = path.match(/^(characters|familiars)(?:\/([^/]+))?(?:\/(assets|bond|manage|status))?$/);
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
    return this.receipt(body, () => {
      if (body.expectedRevision !== this.projection(sheet, user).revision) return fail(409, "revision_conflict");
      if (!action && method === "PATCH") return this.patch(sheet, body, user);
      if (action === "assets" && method === "POST") return this.upload(sheet, body, user);
      if (action === "bond" && method === "POST") return this.bond(sheet, body, user);
      if (action === "manage" && method === "POST") return this.manage(sheet, body, user);
      if (action === "status" && method === "POST") return this.changeStatus(sheet, body, user);
      return fail(405, "method_not_allowed");
    });
  }

  private userView(user: DemoUser) { return { id: user.id, username: user.username, displayName: user.displayName, isAdministrator: user.role === "admin" }; }

  // ---- administration (R4 a), like accounts.py and the membership service -----

  private get directory() { return this.state.directory; }
  private account(id: string) { return this.directory.accounts.find(a => a.id === id); }
  private roleIn(campaignId: string, userId: string) { return this.directory.members.find(m => m.campaignId === campaignId && m.userId === userId)?.role; }

  private directoryRoute(method: string, path: string, query: URLSearchParams, body: any, user: DemoUser): Reply | undefined {
    const admin = user.role === "admin";
    const d = this.directory;
    const page = pageOf(query);
    const done = (reply: Reply) => { if (reply.status < 300) this.save(); return reply; };
    if (path === "campaigns" && method === "GET") {
      if (!page) return fail(400, "invalid_request");
      const visible = d.campaigns.filter(c => admin || this.roleIn(c.id, user.id));
      return new Reply(200, { items: visible.slice(page.offset, page.offset + page.limit)
        .map(c => ({ ...c, policyRevision: 1, role: this.roleIn(c.id, user.id) ?? null })) });
    }
    if (path === "campaigns" && method === "POST") {
      if (!admin) return fail(403, "forbidden");
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name || name.length > 120) return fail(400, "invalid_request");
      const campaign = { id: `demo-campaign-${crypto.randomUUID()}`, name };
      d.campaigns.push(campaign);
      return done(new Reply(200, { ...campaign, policyRevision: 1 }));
    }
    const members = path.match(/^campaigns\/([^/]+)\/members$/);
    if (members) {
      const campaign = d.campaigns.find(c => c.id === members[1]);
      if (!campaign) return fail(404, "not_found");
      const gm = this.roleIn(campaign.id, user.id) === "gm";
      if (method === "GET") {
        if (!admin && !gm) return fail(this.roleIn(campaign.id, user.id) ? 403 : 404, this.roleIn(campaign.id, user.id) ? "forbidden" : "not_found");
        if (!page) return fail(400, "invalid_request");
        return new Reply(200, { items: d.members.filter(m => m.campaignId === campaign.id).slice(page.offset, page.offset + page.limit).map(m => {
          const a = this.account(m.userId)!;
          return { userId: a.id, username: a.username, displayName: a.displayName, role: m.role };
        }) });
      }
      if (!admin && !gm) return fail(403, "forbidden");
      const target = this.account(body.userId);
      if (!target || ![null, "gm", "player"].includes(body.role)) return fail(400, "invalid_request");
      const existing = d.members.find(m => m.campaignId === campaign.id && m.userId === target.id);
      if ((body.role === "gm" || existing?.role === "gm") && !admin) return fail(403, "forbidden");
      if (existing?.role === "gm" && body.role !== "gm" && d.members.filter(m => m.campaignId === campaign.id && m.role === "gm").length < 2) return fail(400, "last_gm");
      if (body.role === null) d.members = d.members.filter(m => m !== existing);
      else if (!target.active) return fail(400, "invalid_member");
      else if (existing) existing.role = body.role;
      else d.members.push({ campaignId: campaign.id, userId: target.id, role: body.role });
      return done(new Reply(200, {}));
    }
    if (path === "auth/invitations" && method === "POST") {
      const campaign = d.campaigns.find(c => c.id === body.campaignId);
      if (!campaign) return fail(404, "not_found");
      if (!["gm", "player"].includes(body.role)) return fail(400, "invalid_role");
      if (!admin && (body.role === "gm" || this.roleIn(campaign.id, user.id) !== "gm")) return fail(403, "forbidden");
      const invite: Invite = { id: crypto.randomUUID(), token: crypto.randomUUID().replace(/-/g, ""), campaignId: campaign.id, role: body.role,
        issuer: user.username, expiresAt: Date.now() + 7 * DAY, used: false };
      d.invitations.push(invite);
      return done(new Reply(200, { token: invite.token, expiresAt: new Date(invite.expiresAt).toISOString() }));
    }
    if (!admin) return fail(403, "forbidden");
    if (path === "auth/reset-codes" && method === "POST") {
      const target = this.account(body.userId);
      if (!target?.active) return fail(404, "not_found");
      const code = crypto.randomUUID().replace(/-/g, "");
      d.resets = [...d.resets.filter(r => r.userId !== target.id), { code, userId: target.id, expiresAt: Date.now() + DAY }];
      return done(new Reply(200, { code, expiresAt: new Date(Date.now() + DAY).toISOString() }));
    }
    if (path === "admin/users" && method === "GET") {
      if (!page) return fail(400, "invalid_request");
      const sorted = [...d.accounts].sort((a, b) => a.username.localeCompare(b.username));
      return new Reply(200, { items: sorted.slice(page.offset, page.offset + page.limit).map(a => ({
        id: a.id, username: a.username, displayName: a.displayName, isAdministrator: a.admin, isActive: a.active,
        campaigns: d.members.filter(m => m.userId === a.id).map(m => ({ id: m.campaignId, name: d.campaigns.find(c => c.id === m.campaignId)!.name, role: m.role })),
      })) });
    }
    const state = path.match(/^admin\/users\/([^/]+)\/state$/);
    if (state && method === "POST") {
      const target = this.account(state[1]);
      if (!target) return fail(404, "not_found");
      if (typeof body.active !== "boolean" || (target.id === user.id && !body.active)) return fail(400, "invalid_account_state");
      target.active = body.active;
      return done(new Reply(200, {}));
    }
    if (path === "admin/invitations" && method === "GET") {
      if (!page) return fail(400, "invalid_request");
      const pending = d.invitations.filter(i => !i.used && i.expiresAt > Date.now()).sort((a, b) => a.expiresAt - b.expiresAt);
      return new Reply(200, { items: pending.slice(page.offset, page.offset + page.limit).map(i => ({
        id: i.id, campaignId: i.campaignId, campaignName: d.campaigns.find(c => c.id === i.campaignId)!.name, role: i.role,
        issuer: i.issuer, expiresAt: new Date(i.expiresAt).toISOString() })) });
    }
    const invitation = path.match(/^admin\/invitations\/([^/]+)$/);
    if (invitation && method === "DELETE") {
      const target = d.invitations.find(i => i.id === invitation[1] && !i.used);
      if (!target) return fail(404, "not_found");
      d.invitations = d.invitations.filter(i => i !== target);
      return done(new Reply(200, {}));
    }
    return undefined;
  }

  private register(body: any): Reply {
    const d = this.directory;
    const invite = d.invitations.find(i => i.token === body.invitationToken && !i.used && i.expiresAt > Date.now());
    if (!invite) return fail(400, "invalid_invitation");
    const name = typeof body.username === "string" && /^[A-Za-z0-9_-]{3,30}$/.test(body.username.trim()) ? body.username.trim().toLowerCase() : "";
    if (!name) return fail(400, "invalid_username");
    if (d.accounts.some(a => a.username === name)) return fail(409, "username_unavailable");
    if (typeof body.password !== "string" || body.password.length < 12) return fail(400, "invalid_password");
    const account = { id: `demo-user-${crypto.randomUUID()}`, username: name, displayName: String(body.displayName ?? ""), admin: false, active: true };
    d.accounts.push(account);
    d.members.push({ campaignId: invite.campaignId, userId: account.id, role: invite.role });
    invite.used = true;
    this.save();
    return new Reply(200, { user: { id: account.id, username: account.username, displayName: account.displayName, isAdministrator: false } });
  }

  private passwordReset(body: any): Reply {
    const d = this.directory;
    const reset = d.resets.find(r => r.code === body.code && r.expiresAt > Date.now());
    if (!reset || !this.account(reset.userId)?.active) return fail(400, "invalid_reset_code");
    if (typeof body.newPassword !== "string" || body.newPassword.length < 12) return fail(400, "invalid_password");
    d.resets = d.resets.filter(r => r.userId !== reset.userId);
    this.save();
    return new Reply(200, {});
  }

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
      archived: false, revision: 1, gmOnly: [], restricted: [], sharedWith: [],
      // Like services.create_sheet: a player's new sheet is a draft only they see (R4 c).
      status: user.role === "gm" ? "confirmed" : "draft" };
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
    if (target && (sheet.status === "draft") !== (target.status === "draft")) return fail(400, "invalid_bond");
    if (!this.projection(sheet, user).capabilities.bondWritable || (target && !this.projection(target, user).capabilities.bondWritable)) return fail(403, "forbidden");
    for (const s of this.state.sheets) if (s.bondId === sheet.id || (target && s.bondId === target.id)) { delete s.bondId; s.revision++; }
    delete sheet.bondId;
    if (target) { sheet.bondId = target.id; target.bondId = sheet.id; target.revision++; }
    sheet.revision++;
    return new Reply(200, this.projection(sheet, user));
  }

  /** Like services.change_status (R4 c): propose, withdraw, return, confirm as PJ or PNJ; a bonded counterpart moves with it. */
  private changeStatus(sheet: DemoSheet, body: any, user: DemoUser): Reply {
    const access = this.access(sheet, user);
    const owner = sheet.assignedPlayerId === user.id;
    const steps: Record<string, [string, "draft" | "proposed" | "confirmed", boolean]> = {
      propose: ["draft", "proposed", owner], withdraw: ["proposed", "draft", owner],
      return: ["proposed", "draft", access === "gm"], confirm: ["proposed", "confirmed", access === "gm"],
    };
    const step = steps[body.action];
    if (!step) return fail(400, "invalid_status_action");
    const [before, after, allowed] = step;
    if (!allowed) return fail(403, "forbidden");
    if ((sheet.status ?? "confirmed") !== before) return fail(409, "invalid_status");
    if (body.action === "confirm" && !["player", "npc"].includes(body.as)) return fail(400, "invalid_status_action");
    const bonded = this.state.sheets.find(s => s.bondId === sheet.id && (s.status ?? "confirmed") === before);
    for (const target of [sheet, bonded]) {
      if (!target) continue;
      target.status = after;
      if (body.as === "npc") { target.assignedPlayerId = user.id; target.sharedWith = []; }
      target.revision++;
    }
    return this.access(sheet, user) ? new Reply(200, this.projection(sheet, user)) : new Reply(200, { status: sheet.status });
  }

  private manage(sheet: DemoSheet, body: any, user: DemoUser): Reply {
    if (user.role !== "gm") return fail(403, "forbidden");
    if ((sheet.status ?? "confirmed") !== "confirmed") return fail(409, "not_confirmed");
    if (typeof body.active === "boolean") sheet.active = body.active;
    if ("tableId" in body) {
      // Like services.manage_sheet: characters only, one of this campaign's partidas or none.
      if (sheet.kind !== "character" || (body.tableId !== null && !this.state.partidas.some(p => p.id === body.tableId))) return fail(400, "invalid_table");
      if (body.tableId === null) delete sheet.tableId; else sheet.tableId = body.tableId;
    }
    if (typeof body.archived === "boolean") sheet.archived = body.archived;
    sheet.revision++;
    return new Reply(200, this.projection(sheet, user));
  }

  /** The campaign's partidas (R4 b), like services.create_table and friends: the GM's only. */
  private partidas(method: string, path: string, body: any, user: DemoUser): Reply {
    if (user.role !== "gm") return fail(403, "forbidden");
    const list = this.state.partidas;
    const id = path.split("/")[3];
    const named = (exclude?: string): string | Reply => {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return fail(400, "field_required");
      if (name.length > 60) return fail(400, "field_too_long");
      if (list.some(p => p.id !== exclude && p.name.toLowerCase() === name.toLowerCase())) return fail(400, "duplicate_table");
      return name;
    };
    if (!id) {
      if (method === "GET") return new Reply(200, { items: list });
      if (list.length >= 12) return fail(400, "too_many_items");
      const name = named();
      if (name instanceof Reply) return name;
      const table = { id: `demo-partida-${crypto.randomUUID()}`, name };
      list.push(table); this.save();
      return new Reply(200, table);
    }
    const table = list.find(p => p.id === id);
    if (!table) return fail(404, "not_found");
    if (method === "DELETE") {
      this.state.partidas = list.filter(p => p !== table);
      for (const sheet of this.state.sheets) if (sheet.tableId === table.id) { delete sheet.tableId; sheet.revision++; }
      this.save();
      return new Reply(200, {});
    }
    const name = named(table.id);
    if (name instanceof Reply) return name;
    table.name = name; this.save();
    return new Reply(200, table);
  }

  private personalNotes(method: string, path: string, query: URLSearchParams, body: any, user: DemoUser): Reply {
    const view = ({ author: _a, ...note }: PersonalNote) => note;
    if (path === "personal-notes") {
      if (method === "POST") {
        // As the server since R3.5: the title is optional; a note keeps when it was written.
        const now = Date.now();
        const note = { id: crypto.randomUUID(), author: user.id, sheetId: body.sheetId ?? null, label: String(body.label ?? ""),
          title: String(body.title ?? ""), content: String(body.content ?? ""), revision: 1, createdAt: now, updatedAt: now };
        this.state.notes.push(note); this.save();
        return new Reply(200, view(note));
      }
      // Newest written first, optionally about one sheet, like the server.
      const sheetId = query.get("sheetId");
      const mine = this.state.notes.filter(n => n.author === user.id && (sheetId === null || n.sheetId === sheetId));
      return new Reply(200, { items: mine.sort((a, b) => b.createdAt - a.createdAt).map(view) });
    }
    const match = path.match(/^personal-notes\/([^/]+)(\/promote(\/preview)?)?$/);
    const note = this.state.notes.find(n => n.id === match?.[1] && n.author === user.id);
    if (!match || !note) return fail(404, "not_found");
    if (match[2]) return match[3] ? this.promote(note, body, user, false) : this.receipt(body, () => this.promote(note, body, user, true));
    if (method === "GET") return new Reply(200, view(note));
    if (body.expectedRevision !== note.revision) return fail(409, "revision_conflict");
    if (method === "DELETE") { this.state.notes = this.state.notes.filter(n => n !== note); this.save(); return new Reply(200, {}); }
    Object.assign(note, { title: body.title ?? note.title, content: body.content ?? note.content, label: body.label ?? note.label, revision: note.revision + 1, updatedAt: Date.now() });
    this.save();
    return new Reply(200, view(note));
  }

  /** «Mover a la bitácora», like notes.promote: the entry is checked against the journal's rules in the preview. */
  private promote(note: PersonalNote, body: any, user: DemoUser, apply: boolean): Reply {
    const sheet = this.state.sheets.find(s => s.id === body.sheetId);
    if (!sheet || !this.access(sheet, user)) return fail(404, "not_found");
    if (body.noteRevision !== note.revision) return fail(409, "revision_conflict");
    const projection = this.projection(sheet, user);
    if (body.expectedRevision !== projection.revision) return fail(409, "revision_conflict");
    const fecha = body.fecha ?? note.createdAt;
    if (!Number.isInteger(fecha) || fecha < 0 || fecha > 8640000000000000) return fail(400, "field_out_of_range", { path: "fecha", rule: "range" });
    let token: { note: string; sheet: string; revision: string; noteRevision: number; itemId: string };
    if (apply) {
      try { token = JSON.parse(atob(String(body.previewToken))); } catch { return fail(409, "invalid_preview"); }
      if (token.note !== note.id || token.sheet !== sheet.id || token.revision !== projection.revision || token.noteRevision !== note.revision) return fail(409, "invalid_preview");
    } else token = { note: note.id, sheet: sheet.id, revision: projection.revision, noteRevision: note.revision, itemId: crypto.randomUUID().replace(/-/g, "") };
    // Adding to the journal needs write access to it (the projection already reflects the viewer's access).
    if (!projection.capabilities.collectionPaths.includes("notasList")) return fail(403, "field_forbidden");
    const path = `notasList/${token.itemId}`;
    const fields = setPath(sheet.fields, path, { titulo: note.title, contenido: note.content, fecha });
    const refused = this.problems(sheet.kind, fields as Record<string, unknown>);
    if (refused) return refused;
    if (!apply) {
      // Who reads the new entry: GM only, the assigned player too, or shared readers too.
      const tier = sheet.gmOnly.includes("notasList") ? "gm" : sheet.restricted.includes("notasList") ? "assigned" : "shared";
      return new Reply(200, { previewToken: btoa(JSON.stringify(token)), audiences: { titulo: tier, contenido: tier, fecha: tier },
        sourceWillBeDeleted: true, title: note.title, content: note.content, fecha });
    }
    sheet.fields = fields as any;
    sheet.revision++;
    this.state.notes = this.state.notes.filter(n => n !== note);
    return new Reply(200, this.projection(sheet, user));
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
