import assert from "node:assert/strict";
import { test } from "node:test";
import type { ApiSheetProjection } from "../src/contracts/api-v1";
import { ApiFailure, RemoteClient } from "../src/remote/client";
import { SaveQueue } from "../src/remote/saveQueue";

function projection(revision = "r1", fields: any = { nombre: "Original", notas: "Visible" }): ApiSheetProjection {
  return { kind: "viewer-projection", id: "fixture", entityType: "character", campaignId: "campaign", schemaVersion: 1, revision, fields,
    capabilities: { readablePaths: Object.keys(fields), writablePaths: ["nombre", "notas"], collectionPaths: ["notasList"], removablePaths: [], isGM: false, bondWritable: true } };
}
function deferred<T>() { let resolve!: (result: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { resolve, reject, promise }; }

test("remote queue serializes rapid edits and uses the returned revision without losing the newer draft", async t => {
  const first = deferred<ApiSheetProjection>(); const sent: any[] = [];
  const q = new SaveQueue(projection(), async body => { sent.push(body); return sent.length === 1 ? first.promise : projection("r3", { nombre: "Newest" }); }, async () => projection(), () => {}, 100000);
  t.after(() => q.dispose());
  q.edit("nombre", "First"); const saving = q.flush();
  q.edit("nombre", "Newest"); assert.equal(q.fields.nombre, "Newest");
  await q.flush(); assert.equal(sent.length, 1);
  first.resolve(projection("r2", { nombre: "First" })); await saving;
  assert.equal(q.fields.nombre, "Newest"); await q.flush();
  assert.equal(sent[1].expectedRevision, "r2"); assert.equal(sent[1].changes[0].value, "Newest"); assert.equal(q.state, "saved");
});

test("timeout retry keeps the exact operation ID, revision and body", async t => {
  const sent: any[] = [];
  const q = new SaveQueue(projection(), async body => { sent.push(structuredClone(body)); if (sent.length === 1) throw new TypeError("connection lost after commit"); return projection("r2", { nombre: "Once" }); }, async () => projection(), () => {}, 100000);
  t.after(() => q.dispose()); q.edit("nombre", "Once"); await q.flush(); assert.equal(q.state, "error"); await q.retry();
  assert.deepEqual(sent[0], sent[1]); assert.equal(q.state, "saved");
});

test("an ambiguous server failure also retries the same operation instead of creating a second write", async t => {
  const sent: any[] = [];
  const q = new SaveQueue(projection(), async body => { sent.push(structuredClone(body)); if (sent.length === 1) throw new ApiFailure(500, "server_error"); return projection("r2"); }, async () => projection(), () => {}, 100000);
  t.after(() => q.dispose()); q.edit("nombre", "Once"); await q.flush(); assert.equal(q.canEdit, false); await q.retry();
  assert.deepEqual(sent[0], sent[1]); assert.equal(q.state, "saved");
});

test("known validation rejection allows correcting the draft without losing other pending changes", async t => {
  let calls = 0;
  const q = new SaveQueue(projection(), async () => { if (++calls === 1) throw new ApiFailure(400, "name_required"); return projection("r2", { nombre: "Corrected" }); }, async () => projection(), () => {}, 100000);
  t.after(() => q.dispose()); q.edit("nombre", ""); await q.flush(); assert.equal(q.canEdit, true);
  q.edit("nombre", "Corrected"); await q.flush(); assert.equal(q.fields.nombre, "Corrected"); assert.equal(q.state, "saved");
});

test("conflicts retain visible drafts, fetch the current projection and require explicit reapply", async t => {
  const sent: any[] = []; const fresh = projection("r2", { nombre: "Other editor", notas: "Visible" });
  const q = new SaveQueue(projection(), async body => { sent.push(body); if (sent.length === 1) throw new ApiFailure(409, "revision_conflict"); return projection("r3", { nombre: "Mine" }); }, async () => fresh, () => {}, 100000);
  t.after(() => q.dispose()); q.edit("nombre", "Mine"); await q.flush();
  assert.equal(q.state, "conflict"); assert.equal(q.fields.nombre, "Mine"); assert.equal(q.sheet.fields.nombre, "Other editor");
  await q.flush(); assert.equal(sent.length, 1); await q.reconcile(false);
  assert.equal(sent[1].expectedRevision, "r2"); assert.notEqual(sent[1].operationId, sent[0].operationId);
});

test("revalidation removes newly hidden draft fields and cannot reapply them", async t => {
  const fresh = projection("r2", { nombre: "Current" }); fresh.capabilities.writablePaths = ["nombre"];
  const sent: any[] = [];
  const q = new SaveQueue(projection(), async body => { sent.push(body); throw new ApiFailure(409, "revision_conflict"); }, async () => fresh, () => {}, 100000);
  t.after(() => q.dispose()); q.edit("notas", "Old visible private draft"); await q.flush();
  assert.equal(q.pending.size, 0); assert.equal(q.fields.notas, undefined); await q.reconcile(false); assert.equal(sent.length, 1);
});

test("offline edits are refused and reconnect never automatically transmits an unsent draft", async t => {
  let writes = 0; const q = new SaveQueue(projection(), async () => { writes++; return projection("r2"); }, async () => projection("r2"), () => {}, 100000);
  t.after(() => q.dispose()); q.edit("nombre", "Online draft"); q.setOnline(false); q.edit("nombre", "Forbidden offline edit"); await q.flush();
  assert.equal(q.fields.nombre, "Online draft"); assert.equal(writes, 0); q.setOnline(true); await Promise.resolve(); await Promise.resolve();
  assert.equal(q.state, "conflict"); assert.equal(writes, 0); await q.reconcile(true); assert.equal(q.pending.size, 0);
});

test("failed focus revalidation retains the online draft and blocks a stale reapply", async t => {
  let writes = 0; let available = false;
  const q = new SaveQueue(projection(), async () => { writes++; return projection("r3"); }, async () => { if (!available) throw new TypeError("network interrupted"); return projection("r2"); }, () => {}, 100000);
  t.after(() => q.dispose()); q.edit("nombre", "Keep my online draft"); await q.refresh();
  assert.equal(q.fields.nombre, "Keep my online draft"); assert.equal(q.canEdit, false);
  await q.flush(); assert.equal(writes, 0);
  await q.reconcile(false); assert.equal(writes, 0); available = true; await q.retry();
  assert.equal(q.state, "conflict"); assert.equal(q.fields.nombre, "Keep my online draft"); assert.equal(writes, 0);
});

test("logout/disposal erases pending data and ignores a late response", async () => {
  const response = deferred<ApiSheetProjection>(); let notifications = 0;
  const q = new SaveQueue(projection(), () => response.promise, async () => projection(), () => notifications++, 100000);
  q.edit("nombre", "Old account draft"); const promise = q.flush(); q.dispose(); const count = notifications;
  response.resolve(projection("r2", { nombre: "Old account data" })); await promise;
  assert.equal(q.pending.size, 0); assert.equal(notifications, count); assert.equal(q.sheet.revision, "r1");
});

test("stable item drafts create only explicit content and hidden records never become full saves", async t => {
  const sent: any[] = []; const q = new SaveQueue(projection(), async body => { sent.push(body); return projection("r2"); }, async () => projection(), () => {}, 100000);
  t.after(() => q.dispose()); q.edit("notasList/new-item", { titulo: "New", contenido: "Explicit", fecha: Date.now() });
  assert.equal((q.fields as any).notasList[0].id, "new-item"); await q.flush();
  assert.equal(sent[0].changes[0].path, "notasList/new-item"); assert.equal(sent[0].changes.length, 1); assert.equal("fields" in sent[0], false);
});

test("remote HTTP uses same-origin CSRF, never local fallback, and mutation closures retain their IDs", async () => {
  const calls: { path: string; options: RequestInit }[] = [];
  const client = new RemoteClient((async (path: string, options: RequestInit) => {
    calls.push({ path, options }); return new Response(JSON.stringify(path.endsWith("csrf") ? { csrfToken: "fictional-csrf" } : { id: "result" }), { status: 200 });
  }) as typeof fetch);
  const mutation = client.mutation("familiars", { campaignId: "fixture", fields: { nombre: "Owl" } }); await mutation(); await mutation();
  assert.equal(calls[0].path, "/api/v1/auth/csrf"); assert.equal(calls[1].options.credentials, "same-origin");
  assert.equal((calls[1].options.headers as any)["X-CSRFToken"], "fictional-csrf"); assert.equal(calls[1].options.body, calls[2].options.body);
});

test("session revocation invokes clearing and errors do not return server bodies", async () => {
  let expired = 0; const client = new RemoteClient((async () => new Response(JSON.stringify({ error: { code: "authentication_required" } }), { status: 401 })) as typeof fetch, () => expired++);
  await assert.rejects(client.request("auth/me"), (e: ApiFailure) => e.status === 401); assert.equal(expired, 1);
});
