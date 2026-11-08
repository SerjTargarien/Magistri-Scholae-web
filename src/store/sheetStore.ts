// The sheet store (R3.3): the one path through which every screen reads and
// saves a character or a familiar. It holds the server's copy (only what the
// viewer may see), the viewer's unsent changes by path, and the save state.
//
// - Edits are checked against the viewer's permissions and the field rules
//   before they are queued; a refused edit comes back as problems, never sent.
// - Only changed paths are sent, grouped while typing, with the revision they
//   are based on and an operation ID. A save whose result is unknown (timeout,
//   server error) is retried with the same ID, so it is never applied twice.
// - When someone else changed the sheet (a stale revision), changes to paths
//   they did not touch are re-sent automatically; a change to a path they also
//   changed waits for the viewer's choice (owner decision, 8 November 2026).
// - Edits continue during a connection drop and are sent when it returns. The
//   unsent changes live in memory; R7.2 keeps them on the device (PendingSlot).
// - A server rejection is shown with its rule; it never becomes a whole-record
//   save, and a path the viewer cannot see is never sent as blank or removed.
import type { ApiPatch, ApiSheetProjection } from "../contracts/api-v1";
import { checkSheet, type Problem } from "../model/rules";
import { ApiFailure } from "../remote/client";
import { pathValue, setPath } from "./paths";

export type SaveState = "saved" | "unsaved" | "saving" | "offline" | "conflict" | "error";

export interface SheetTransport {
  read(): Promise<ApiSheetProjection>;
  patch(body: ApiPatch): Promise<ApiSheetProjection>;
}

/** Where unsent changes are kept: memory now, device storage in R7.2. */
export interface PendingSlot {
  load(): [string, unknown][] | undefined;
  save(pending: [string, unknown][]): void;
  clear(): void;
}

export interface Conflict { path: string; mine: unknown; theirs: unknown }
export interface StoreError { code: string; path?: string; rule?: string; limit?: unknown }

const MAX_CHANGES = 100;
const MAX_RETRY_DELAY = 30_000;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export class SheetStore {
  sheet: ApiSheetProjection;
  readonly pending = new Map<string, unknown>();
  conflicts: Conflict[] = [];
  /** Unsent changes dropped because the viewer lost access to their path. */
  dropped: string[] = [];
  error?: StoreError;
  /** Why the last edit was not accepted (empty after an accepted edit). */
  problems: Problem[] = [];
  state: SaveState = "saved";

  private flight?: { body: ApiPatch; snapshot: Map<string, unknown> };
  private timer?: ReturnType<typeof setTimeout>;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private retryDelay = 0;
  private running = false;
  private disposed = false;
  private online = true;
  /** Saving waits for the viewer when the server refused changes without naming one. */
  private blocked = false;
  /** Paths the server refused; they wait for the viewer's correction while other changes keep saving. */
  private readonly rejected = new Set<string>();

  constructor(sheet: ApiSheetProjection, private transport: SheetTransport, private changed: () => void = () => {},
    private options: { delay?: number; slot?: PendingSlot } = {}) {
    this.sheet = sheet;
    for (const [path, value] of options.slot?.load() ?? []) if (this.allowed(path)) this.pending.set(path, value);
    this.updateState();
  }

  /** The sheet as the viewer sees it: the server's copy with unsent changes applied. */
  get fields(): Record<string, unknown> {
    let value: any = this.sheet.fields;
    for (const [path, entry] of [...(this.flight?.snapshot ?? []), ...this.pending]) {
      for (const parent of this.sheet.capabilities.collectionPaths)
        if (path.startsWith(parent + "/") && pathValue(value, parent) === undefined) value = setPath(value, parent, []);
      value = setPath(value, path, entry);
    }
    return value;
  }

  get busy() { return this.state !== "saved"; }
  get canEdit() { return !this.disposed; }

  /** Whether the viewer may write this path: a writable field, a removable entry, or a new entry in a list they can add to. */
  allowed(path: string, sheet = this.sheet): boolean {
    const { writablePaths, removablePaths, collectionPaths } = sheet.capabilities;
    if (writablePaths.includes(path) || removablePaths.includes(path)) return true;
    const unsaved = [...this.pending.keys(), ...(this.flight?.snapshot.keys() ?? [])];
    const pendingEntry = unsaved.find(key => path.startsWith(key + "/") && this.isNewEntry(key, sheet));
    if (pendingEntry) return true;
    return this.isNewEntry(path, sheet);
  }

  private isNewEntry(path: string, sheet: ApiSheetProjection) {
    return sheet.capabilities.collectionPaths.some(parent => path.startsWith(parent + "/") && path.slice(parent.length + 1).split("/").length === 1)
      && pathValue(sheet.fields, path) === undefined;
  }

  /** The rules an edit would break, checked locally (the server checks again). */
  check(path: string, value: unknown): Problem[] {
    const next = setPath(this.fields, path, value);
    return checkSheet(this.sheet.entityType, next).filter(p =>
      p.path === path || p.path.startsWith(path + "/")
      || (path.startsWith(p.path + "/") && (p.rule === "requireOneOf" || p.rule === "linkedOrOwn"))
      || (p.rule === "notAboveMaximum" && p.limit === path));
  }

  /** Queues an edit. Returns the problems that stopped it; an empty list means it was accepted. */
  edit(path: string, value: unknown): Problem[] {
    if (this.disposed) return [{ path, rule: "closed" }];
    const problems = !this.allowed(path) ? [{ path, rule: "notWritable" }] : value === null ? [] : this.check(path, value);
    this.problems = problems;
    if (problems.length) { this.emit(); return problems; }
    this.conflicts = this.conflicts.filter(c => c.path !== path && !c.path.startsWith(path + "/"));
    const parent = [...this.pending.keys()].find(key => path.startsWith(key + "/"));
    if (parent) {
      this.pending.set(parent, setPath({ entry: this.pending.get(parent) }, `entry/${path.slice(parent.length + 1)}`, value).entry);
    } else {
      for (const key of [...this.pending.keys()]) if (key.startsWith(path + "/")) this.pending.delete(key);
      if (same(pathValue(this.sheet.fields, path), value ?? undefined) && !this.flight?.snapshot.has(path)) this.pending.delete(path);
      else this.pending.set(path, structuredClone(value));
    }
    this.blocked = false;
    for (const key of [...this.rejected]) if (key === path || key.startsWith(path + "/") || path.startsWith(key + "/")) this.rejected.delete(key);
    if (this.error && !this.flight && !this.rejected.size) this.error = undefined;
    this.persist();
    this.schedule();
    this.emit();
    return [];
  }

  /** Settles a conflict: keep the viewer's value (sent on top of the current sheet) or the current one. */
  resolve(path: string, keep: "mine" | "theirs") {
    const conflict = this.conflicts.find(c => c.path === path);
    if (!conflict || this.disposed) return;
    this.conflicts = this.conflicts.filter(c => c !== conflict);
    if (keep === "mine" && this.allowed(path)) { this.pending.set(path, conflict.mine); this.blocked = false; this.schedule(0); }
    this.persist();
    this.emit();
  }

  async flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.disposed || this.running) return;
    if (!this.online) { this.emit(); return; }
    if (!this.flight && (this.blocked || ![...this.pending.keys()].some(path => !this.rejected.has(path)))) { this.emit(); return; }
    const flight = this.flight ??= this.nextFlight();
    this.running = true;
    this.state = "saving";
    this.emit();
    try {
      const result = await this.transport.patch(flight.body);
      if (this.disposed) return;
      this.sheet = result;
      for (const [path, value] of flight.snapshot) if (this.pending.has(path) && same(this.pending.get(path), value)) this.pending.delete(path);
      this.flight = undefined;
      this.error = undefined;
      this.retryDelay = 0;
    } catch (error) {
      if (this.disposed) return;
      await this.failed(error, flight);
    } finally {
      this.running = false;
      if (!this.disposed) {
        this.persist();
        this.updateState();
        this.emit();
        if (this.online && !this.blocked && !this.retryTimer && (this.flight || [...this.pending.keys()].some(path => !this.rejected.has(path)))) this.schedule(0);
      }
    }
  }

  private nextFlight() {
    const entries = [...this.pending].filter(([path]) => !this.rejected.has(path)).slice(0, MAX_CHANGES);
    for (const [path] of entries) this.pending.delete(path);
    // Values in flight stay visible through `fields` and return to pending if the save is refused.
    return { body: { operationId: crypto.randomUUID(), expectedRevision: this.sheet.revision, changes: entries.map(([path, value]) => ({ path, value })) },
      snapshot: new Map(entries.map(([path, value]) => [path, structuredClone(value)])) };
  }

  private restore(flight: { snapshot: Map<string, unknown> }) {
    // The unsent snapshot returns to pending; newer edits win, and edits made
    // inside a restored new entry fold back into it, so no change overlaps another.
    const newer = new Map(this.pending);
    this.pending.clear();
    for (const [path, value] of flight.snapshot) this.pending.set(path, value);
    for (const [path, value] of newer) {
      const parent = [...flight.snapshot.keys()].find(key => path.startsWith(key + "/"));
      if (parent) this.pending.set(parent, setPath({ entry: this.pending.get(parent) }, `entry/${path.slice(parent.length + 1)}`, value).entry);
      else this.pending.set(path, value);
    }
  }

  private async failed(error: unknown, flight: { body: ApiPatch; snapshot: Map<string, unknown> }) {
    if (error instanceof ApiFailure && error.status === 409 && error.code === "revision_conflict") {
      this.flight = undefined;
      this.restore(flight);
      await this.rebase();
    } else if (error instanceof ApiFailure && error.status === 429) {
      this.flight = undefined;
      this.restore(flight);
      this.error = { code: error.code };
      this.retryLater();
    } else if (error instanceof ApiFailure && error.status >= 400 && error.status < 500) {
      // Refused, not applied: keep the changes for the viewer to correct, never resend them as they are.
      this.flight = undefined;
      this.restore(flight);
      this.error = { code: error.code, ...error.details };
      const named = error.details?.path;
      const culprits = named === undefined ? [] : [...this.pending.keys()].filter(key => key === named || named.startsWith(key + "/") || key.startsWith(named + "/"));
      if (culprits.length) for (const key of culprits) this.rejected.add(key);
      else this.blocked = true;
      if ([403, 404].includes(error.status)) await this.rebase();
    } else {
      // Unknown result (connection lost, timeout, server error): keep the exact operation and retry it.
      this.error = { code: error instanceof ApiFailure ? error.code : "network_error" };
      this.retryLater();
    }
  }

  private retryLater() {
    if (!this.online) return;
    this.retryDelay = Math.min(MAX_RETRY_DELAY, this.retryDelay ? this.retryDelay * 2 : 1000);
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => { this.retryTimer = undefined; void this.flush(); }, this.retryDelay);
  }

  /** Someone else changed the sheet: take their version and keep the viewer's changes on top where they do not collide. */
  private async rebase() {
    let latest: ApiSheetProjection;
    try {
      latest = await this.transport.read();
    } catch (error) {
      if (this.disposed) return;
      if (error instanceof ApiFailure && [401, 403, 404].includes(error.status)) {
        this.dropped.push(...this.pending.keys());
        this.pending.clear();
        this.conflicts = [];
        this.error = { code: error.code };
        this.blocked = true;
      } else {
        this.error = { code: error instanceof ApiFailure ? error.code : "network_error" };
        this.retryLater();
      }
      return;
    }
    if (this.disposed) return;
    this.adopt(latest);
  }

  /** A newer server copy, from a refresh or another operation (image, bond, archive). */
  accept(latest: ApiSheetProjection) {
    if (this.disposed) return;
    this.adopt(latest);
    this.persist();
    this.updateState();
    this.emit();
    if (this.pending.size) this.schedule(0);
  }

  private adopt(latest: ApiSheetProjection) {
    const previous = this.sheet;
    for (const [path, mine] of [...this.pending]) {
      if (!this.allowed(path, latest)) { this.pending.delete(path); this.dropped.push(path); continue; }
      const before = pathValue(previous.fields, path), after = pathValue(latest.fields, path);
      if (!same(before, after)) {
        this.pending.delete(path);
        if (!same(mine, after)) this.conflicts.push({ path, mine, theirs: after });
      }
    }
    this.sheet = latest;
  }

  /** Re-reads the sheet when nothing is waiting to be saved (for example on returning to the tab). */
  async refresh(): Promise<boolean> {
    if (this.disposed || this.running || this.flight || this.pending.size || !this.online) return false;
    try {
      const latest = await this.transport.read();
      if (this.disposed || this.running || this.flight || this.pending.size) return false;
      this.sheet = latest;
      this.error = undefined;
      this.updateState();
      this.emit();
      return true;
    } catch (error) {
      if (!this.disposed) { this.error = { code: error instanceof ApiFailure ? error.code : "network_error" }; this.updateState(); this.emit(); }
      return false;
    }
  }

  setOnline(online: boolean) {
    if (this.disposed || online === this.online) return;
    this.online = online;
    clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    this.retryDelay = 0;
    this.updateState();
    this.emit();
    if (online) { if (this.flight || this.pending.size) void this.flush(); else void this.refresh(); }
  }

  /** Reopens a store after a development-mode remount (React StrictMode runs effects twice). */
  activate() { this.disposed = false; }

  /** Logout or closing the sheet: forgets every unsent change and ignores late responses. */
  dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
    clearTimeout(this.retryTimer);
    this.pending.clear();
    this.rejected.clear();
    this.conflicts = [];
    this.flight = undefined;
    this.options.slot?.clear();
  }

  private schedule(delay = this.options.delay ?? 350) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), delay);
  }

  private persist() { this.options.slot?.save([...this.pending]); }

  private updateState() {
    this.state = !this.online ? "offline"
      : this.running ? "saving"
      : this.conflicts.length ? "conflict"
      : this.error ? "error"
      : this.flight || this.pending.size ? "unsaved" : "saved";
  }

  private emit() { if (!this.disposed) { this.updateState(); this.changed(); } }
}
