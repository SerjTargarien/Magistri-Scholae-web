// The sheet store (R3.3): permissions and rules before sending, path-only
// saves, exact retries, automatic merging of edits to different fields,
// choices for edits to the same field, and edits kept through connection drops.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { ApiPatch, ApiSheetProjection } from "../src/contracts/api-v1";
import { ApiFailure } from "../src/remote/client";
import { setPath } from "../src/store/paths";
import { SheetStore } from "../src/store/sheetStore";

const WRITABLE = ["nombre", "linaje", "concepto", "puntosDestino", "estresFisico", "estresFisicoMax", "notasList/n1/titulo", "notasList/n1/contenido"];

/** A small stand-in for the server: revisions, path changes, injected failures. */
class FakeServer {
  revision = 1;
  fields: Record<string, unknown> = { nombre: "Original", linaje: "Herbolarias", concepto: "Curiosa", puntosDestino: 3,
    estresFisico: 2, estresFisicoMax: 3, notasList: [{ id: "n1", titulo: "Diario", contenido: "Primera entrada", fecha: 1 }] };
  writable = [...WRITABLE];
  sent: ApiPatch[] = [];
  reads = 0;
  failures: (Error | undefined)[] = [];
  hold?: Promise<void>;
  projection(): ApiSheetProjection {
    return { kind: "viewer-projection", id: "sheet", entityType: "character", campaignId: "campaign", schemaVersion: 2, revision: `r${this.revision}`,
      fields: structuredClone(this.fields) as any,
      capabilities: { readablePaths: Object.keys(this.fields), writablePaths: [...this.writable], collectionPaths: ["notasList", "aspectosPersonales"],
        removablePaths: ["notasList/n1"], bondWritable: false, isGM: false } };
  }
  /** Someone else saves a change. */
  otherEdit(path: string, value: unknown) { this.fields = setPath(this.fields, path, value); this.revision++; }
  transport = {
    read: async () => { this.reads++; return this.projection(); },
    patch: async (body: ApiPatch) => {
      this.sent.push(structuredClone(body));
      if (this.hold) await this.hold;
      const failure = this.failures.shift();
      if (failure) throw failure;
      if (body.expectedRevision !== `r${this.revision}`) throw new ApiFailure(409, "revision_conflict");
      for (const change of body.changes) this.fields = setPath(this.fields, change.path, change.value);
      this.revision++;
      return this.projection();
    },
  };
}

function setup(t: { after: (fn: () => void) => void }) {
  const server = new FakeServer();
  const store = new SheetStore(server.projection(), server.transport, () => {}, { delay: 100000 });
  t.after(() => store.dispose());
  return { server, store };
}

/** Lets scheduled saves, retries and reads run. */
async function settle(rounds = 20) { for (let i = 0; i < rounds; i++) await new Promise(resolve => setTimeout(resolve, 0)); }

test("rapid edits are grouped, and a newer draft typed during a save is sent next on the returned revision", async t => {
  const { server, store } = setup(t);
  let release!: () => void;
  server.hold = new Promise(resolve => { release = resolve; });
  store.edit("nombre", "First");
  const saving = store.flush();
  store.edit("nombre", "Newest");
  assert.equal(store.fields.nombre, "Newest");
  assert.equal(server.sent.length, 1);
  server.hold = undefined; release(); await saving; await settle();
  assert.equal(server.sent.length, 2);
  assert.equal(server.sent[1].expectedRevision, "r2");
  assert.deepEqual(server.sent[1].changes, [{ path: "nombre", value: "Newest" }]);
  assert.equal(store.state, "saved");
  assert.equal(server.fields.nombre, "Newest");
});

test("only changed paths are sent, never a whole record", async t => {
  const { server, store } = setup(t);
  store.edit("concepto", "Rastreadora");
  await store.flush();
  assert.deepEqual(server.sent[0].changes, [{ path: "concepto", value: "Rastreadora" }]);
  assert.equal("fields" in server.sent[0], false);
});

test("an unknown result (connection lost, server error) retries the exact same operation", async t => {
  for (const failure of [new TypeError("connection lost after commit"), new ApiFailure(500, "server_error")]) {
    const { server, store } = setup(t);
    server.failures = [failure];
    store.edit("nombre", "Once");
    await store.flush();
    assert.equal(store.state, "error");
    await store.flush();
    assert.deepEqual(server.sent[0], server.sent[1]);
    assert.equal(store.state, "saved");
  }
});

test("edits that break a rule are refused locally and never sent", async t => {
  const { server, store } = setup(t);
  assert.deepEqual(store.edit("nombre", " ").map(p => p.rule), ["required"]);
  assert.deepEqual(store.edit("puntosDestino", 11).map(p => p.rule), ["range"]);
  assert.deepEqual(store.edit("estresFisico", 4).map(p => p.rule), ["notAboveMaximum"]);
  assert.deepEqual(store.edit("estresFisicoMax", 1).map(p => p.rule), ["notAboveMaximum"]);  // current stress is 2
  assert.deepEqual(store.edit("nombre", "x".repeat(81)).map(p => p.rule), ["maxLength"]);
  assert.equal(store.problems[0].rule, "maxLength");
  assert.equal(store.fields.nombre, "Original");
  assert.equal(store.pending.size, 0);
  await store.flush();
  assert.equal(server.sent.length, 0);
  assert.deepEqual(store.edit("nombre", "Valid"), []);
  assert.deepEqual(store.problems, []);
});

test("paths the viewer cannot write are refused: hidden fields are never sent as blank or removed", async t => {
  const { server, store } = setup(t);
  assert.deepEqual(store.edit("economia", ""), [{ path: "economia", rule: "notWritable" }]);
  assert.deepEqual(store.edit("complicaciones/c1", null), [{ path: "complicaciones/c1", rule: "notWritable" }]);
  await store.flush();
  assert.equal(server.sent.length, 0);
});

test("someone else's change to a different field merges automatically, with no conflict (M3)", async t => {
  const { server, store } = setup(t);
  store.edit("nombre", "Mine");
  server.otherEdit("linaje", "Changed by the GM");
  await store.flush(); await settle();
  assert.equal(server.reads, 1);
  assert.equal(server.sent.length, 2);
  assert.equal(server.sent[1].expectedRevision, "r2");
  assert.notEqual(server.sent[1].operationId, server.sent[0].operationId);
  assert.deepEqual(store.conflicts, []);
  assert.equal(store.state, "saved");
  assert.deepEqual([server.fields.nombre, server.fields.linaje], ["Mine", "Changed by the GM"]);
});

test("someone else's change to the same field waits for the viewer's choice", async t => {
  for (const keep of ["mine", "theirs"] as const) {
    const { server, store } = setup(t);
    store.edit("nombre", "Mine");
    store.edit("concepto", "Also mine");
    server.otherEdit("nombre", "Theirs");
    await store.flush(); await settle();
    assert.deepEqual(store.conflicts, [{ path: "nombre", mine: "Mine", theirs: "Theirs" }]);
    assert.equal(server.fields.concepto, "Also mine");  // the other change was saved
    assert.equal(store.state, "conflict");
    assert.equal(store.fields.nombre, "Theirs");
    store.resolve("nombre", keep); await settle();
    assert.equal(server.fields.nombre, keep === "mine" ? "Mine" : "Theirs");
    assert.equal(store.state, "saved");
  }
});

test("an identical change made by someone else is not a conflict", async t => {
  const { server, store } = setup(t);
  store.edit("nombre", "Same");
  server.otherEdit("nombre", "Same");
  await store.flush(); await settle();
  assert.deepEqual(store.conflicts, []);
  assert.equal(store.pending.size, 0);
  assert.equal(store.state, "saved");
});

test("a draft for a field that became read-only is discarded, never re-sent", async t => {
  const { server, store } = setup(t);
  store.edit("linaje", "Private draft");
  server.writable = server.writable.filter(path => path !== "linaje");
  server.otherEdit("concepto", "Intervening change");
  await store.flush(); await settle();
  assert.deepEqual(store.dropped, ["linaje"]);
  assert.equal(server.sent.length, 1);
  assert.equal(server.fields.linaje, "Herbolarias");
});

test("a change the server refuses is held for correction while other changes keep saving", async t => {
  const { server, store } = setup(t);
  server.failures = [new ApiFailure(400, "duplicate_skill", { path: "linaje", rule: "unique" })];
  store.edit("linaje", "Refused");
  await store.flush(); await settle();
  assert.deepEqual(store.error, { code: "duplicate_skill", path: "linaje", rule: "unique" });
  store.edit("concepto", "Still saves");
  await store.flush(); await settle();
  assert.equal(server.fields.concepto, "Still saves");
  assert.equal(server.fields.linaje, "Herbolarias");
  assert.equal(store.fields.linaje, "Refused");  // kept on screen for correction
  store.edit("linaje", "Corrected");
  await store.flush(); await settle();
  assert.equal(server.fields.linaje, "Corrected");
  assert.equal(store.state, "saved");
});

test("edits continue offline and are sent when the connection returns", async t => {
  const { server, store } = setup(t);
  store.setOnline(false);
  assert.equal(store.state, "offline");
  assert.deepEqual(store.edit("nombre", "Written offline"), []);
  await store.flush();
  assert.equal(server.sent.length, 0);
  server.otherEdit("linaje", "Changed meanwhile");
  store.setOnline(true); await settle();
  assert.deepEqual([server.fields.nombre, server.fields.linaje], ["Written offline", "Changed meanwhile"]);
  assert.equal(store.state, "saved");
});

test("a new list entry and edits inside it travel together, and only explicit content is sent", async t => {
  const { server, store } = setup(t);
  assert.deepEqual(store.edit("aspectosPersonales/a1", { value: "Curiosa" }), []);
  assert.deepEqual(store.edit("aspectosPersonales/a1/value", "Curiosa hasta el exceso"), []);
  assert.equal(store.pending.size, 1);
  await store.flush();
  assert.deepEqual(server.sent[0].changes, [{ path: "aspectosPersonales/a1", value: { value: "Curiosa hasta el exceso" } }]);
});

test("an entry cannot be emptied below its rules (journal content is required)", async t => {
  const { store } = setup(t);
  assert.deepEqual(store.edit("notasList/n1/contenido", " ").map(p => p.rule), ["required"]);
  assert.deepEqual(store.edit("notasList/n1", null), []);
});

test("logout erases unsent changes and ignores a late response", async () => {
  const server = new FakeServer();
  let release!: () => void;
  server.hold = new Promise(resolve => { release = resolve; });
  let notifications = 0;
  const store = new SheetStore(server.projection(), server.transport, () => notifications++, { delay: 100000 });
  store.edit("nombre", "Old account draft");
  const saving = store.flush();
  store.dispose();
  const count = notifications;
  release(); await saving;
  assert.equal(store.pending.size, 0);
  assert.equal(notifications, count);
  assert.equal(store.sheet.revision, "r1");
});

test("unsent changes go to the pending slot, which logout clears (device storage arrives in R7.2)", async t => {
  const server = new FakeServer();
  let saved: [string, unknown][] = [];
  let cleared = false;
  const slot = { load: () => [["concepto", "Restored draft"]] as [string, unknown][], save: (p: [string, unknown][]) => { saved = p; }, clear: () => { cleared = true; } };
  const store = new SheetStore(server.projection(), server.transport, () => {}, { delay: 100000, slot });
  t.after(() => store.dispose());
  assert.equal(store.fields.concepto, "Restored draft");
  store.edit("nombre", "Draft");
  assert.deepEqual(saved, [["concepto", "Restored draft"], ["nombre", "Draft"]]);
  store.dispose();
  assert.ok(cleared);
});
