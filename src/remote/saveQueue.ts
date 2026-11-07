import type { ApiPatch, ApiSheetProjection } from "../contracts/api-v1";
import { ApiFailure } from "./client";

export type SaveState = "saved" | "unsaved" | "saving" | "offline" | "conflict" | "error";
export function pathValue(data: any, path: string): any {
  return path.split("/").reduce((value, part) => Array.isArray(value) ? value.find(item => item.id === part) : value?.[part], data);
}
export function setPath(data: any, path: string, value: unknown): any {
  const result = structuredClone(data);
  const parts = path.split("/");
  let target = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (Array.isArray(target)) target = target.find(item => item.id === key);
    else target = target[key] ??= {};
    if (!target) return result;
  }
  const last = parts.at(-1)!;
  if (Array.isArray(target)) {
    const index = target.findIndex(item => item.id === last);
    if (value === null) { if (index >= 0) target.splice(index, 1); }
    else if (index < 0) target.push({ id: last, ...(value as object) });
    else target[index] = { id: last, ...(value as object) };
  } else target[last] = structuredClone(value);
  return result;
}

export class SaveQueue {
  state: SaveState = "saved";
  errorCode = "";
  pending = new Map<string, unknown>();
  private flight?: { body: ApiPatch; snapshot: Map<string, unknown> };
  private timer?: ReturnType<typeof setTimeout>;
  private running = false;
  private disposed = false;
  private online = true;
  private refreshQueued = false;
  private newItems = new Set<string>();
  constructor(public sheet: ApiSheetProjection,
    private send: (body: ApiPatch) => Promise<ApiSheetProjection>,
    private read: () => Promise<ApiSheetProjection>, private changed = () => {}, private delay = 350) {}
  get fields() { let value: any = this.sheet.fields; for (const [path, entry] of this.pending) {
    for (const parent of this.sheet.capabilities.collectionPaths) if (path.startsWith(parent + "/") && pathValue(value, parent) === undefined) value = setPath(value, parent, []);
    value = setPath(value, path, entry);
  } return value; }
  get busy() { return this.state !== "saved"; }
  get canEdit() { return this.online && this.state !== "conflict" && !(this.state === "error" && (this.flight || this.errorCode === "network_error")); }
  private emit() { if (!this.disposed) this.changed(); }
  activate() { this.disposed = false; }
  accept(sheet: ApiSheetProjection) { if (this.disposed) return; this.sheet = sheet; this.scrub(); this.state = this.pending.size ? "unsaved" : "saved"; this.emit(); }
  allowed(path: string) {
    return this.sheet.capabilities.writablePaths.includes(path) || this.sheet.capabilities.removablePaths.includes(path) ||
      this.newItems.has(path) && this.sheet.capabilities.collectionPaths.some(parent => path.startsWith(parent + "/") && path.slice(parent.length + 1).split("/").length === 1);
  }
  edit(path: string, value: unknown) {
    if (this.disposed || !this.canEdit) return;
    if (value !== null && typeof value === "object" && pathValue(this.sheet.fields, path) === undefined &&
      this.sheet.capabilities.collectionPaths.some(parent => path.startsWith(parent + "/") && path.slice(parent.length + 1).split("/").length === 1)) this.newItems.add(path);
    if (!this.allowed(path)) return;
    // Avoid overlapping parent/child writes; structural changes wait for saves.
    if ([...this.pending.keys()].some(p => p !== path && (p.startsWith(path + "/") || path.startsWith(p + "/")))) return;
    this.pending.set(path, structuredClone(value)); this.state = "unsaved";
    clearTimeout(this.timer); this.timer = setTimeout(() => void this.flush(), this.delay); this.emit();
  }
  async flush() {
    clearTimeout(this.timer);
    if (this.disposed || this.running || !this.online || this.state === "conflict") return;
    if (this.state === "error" && this.errorCode === "network_error" && !this.flight) return;
    if (!this.flight && !this.pending.size) { this.state = "saved"; this.emit(); return; }
    this.flight ??= { body: { operationId: crypto.randomUUID(), expectedRevision: this.sheet.revision,
      changes: [...this.pending].slice(0, 100).map(([path, value]) => ({ path, value })) }, snapshot: new Map([...this.pending].slice(0, 100)) };
    this.running = true; this.state = "saving"; this.emit();
    const flight = this.flight;
    try {
      const result = await this.send(flight.body);
      if (this.disposed) return;
      this.sheet = result;
      for (const [path, value] of flight.snapshot) if (JSON.stringify(this.pending.get(path)) === JSON.stringify(value)) this.pending.delete(path);
      this.flight = undefined;
      this.scrub(); this.errorCode = ""; this.state = this.pending.size ? "unsaved" : "saved";
    } catch (error) {
      if (this.disposed) return;
      this.errorCode = error instanceof ApiFailure ? error.code : "network_error";
      if (error instanceof ApiFailure && error.status < 500) {
        this.flight = undefined;
        if ([400, 413, 415, 429].includes(error.status)) this.state = "error";
        else { this.state = "conflict"; await this.refresh(); }
      } else this.state = "error"; // Keep exact flight for an uncertain network result.
    } finally {
      this.running = false; this.emit();
      if (this.refreshQueued && !this.disposed) { this.refreshQueued = false; await this.refresh(); }
      if (!this.disposed && this.state === "unsaved" && this.online) this.timer = setTimeout(() => void this.flush(), 0);
    }
  }
  private scrub() { for (const path of this.pending.keys()) if (!this.allowed(path)) this.pending.delete(path); }
  async refresh() {
    if (this.disposed || !this.online) return false;
    if (this.running) { this.refreshQueued = true; return false; }
    clearTimeout(this.timer);
    const before = this.sheet.revision;
    let success = false;
    try {
      const latest = await this.read();
      if (this.disposed) return false;
      if (this.running || before !== this.sheet.revision) { this.refreshQueued = true; return false; }
      this.sheet = latest; this.scrub();
      this.errorCode = ""; success = true;
      this.state = this.pending.size || this.flight ? "conflict" : "saved";
    } catch (error) { if (!this.disposed) {
      if (error instanceof ApiFailure && [401, 403, 404].includes(error.status)) {
        this.sheet = { ...this.sheet, fields: {}, capabilities: { readablePaths: [], writablePaths: [], collectionPaths: [], removablePaths: [], bondWritable: false, isGM: false } }; this.pending.clear();
      }
      this.errorCode = error instanceof ApiFailure ? error.code : "network_error"; this.state = "error";
    } }
    this.emit();
    return success;
  }
  setOnline(online: boolean) {
    this.online = online; clearTimeout(this.timer);
    this.state = online ? (this.pending.size || this.flight ? "conflict" : "saved") : "offline";
    if (online) void this.refresh(); this.emit();
  }
  async retry() { if (this.flight) { this.state = "error"; await this.flush(); } else if (this.errorCode === "network_error") { await this.refresh(); } else if (this.state === "conflict") return; else await this.flush(); }
  async reconcile(discard: boolean) {
    if (this.running || !this.online) return;
    // An uncertain operation must be resolved using its original ID first.
    if (this.flight) { await this.retry(); return; }
    if (!await this.refresh()) return;
    if (discard) this.pending.clear();
    this.state = this.pending.size ? "unsaved" : "saved"; this.emit();
    if (this.pending.size) await this.flush();
  }
  dispose() { this.disposed = true; clearTimeout(this.timer); this.pending.clear(); this.newItems.clear(); this.flight = undefined; }
}
