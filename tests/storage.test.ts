import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { test } from "node:test";
import { MagistriScholaeDB } from "../src/db";
import { previewData, sharedReaderExample } from "../src/fixtures/preview";
import { createDexieStorage } from "../src/storage/dexieStorage";
import { createStorage } from "../src/storage/createStorage";
import { MOCK_DATABASE_NAME, resolveStorageMode } from "../src/storage/mode";
import { backupEnvelope } from "../src/storage/backup";
import type { Character } from "../src/types";

const pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
function fixtures() {
  const data = previewData();
  data.characters[0].avatarImage = pixel;
  data.characters[0].galleryImages = [pixel];
  data.characters[1].adultWizardProfile!.reputation = "Fictional reputation";
  data.familiars[0].imagen = pixel;
  data.familiars[0].galleryImages = [pixel];
  data.familiars[0].notasList = [{ id: "f-note", titulo: "Demo", contenido: "Fictional familiar journal", fecha: 10 }];
  return data;
}
async function setup(t: { after: (fn: () => Promise<void>) => void }, seed = true) {
  const database = new MagistriScholaeDB(`test-storage-${crypto.randomUUID()}`);
  t.after(() => database.delete());
  const data = fixtures();
  if (seed) {
    await database.characters.bulkAdd(data.characters);
    await database.familiars.bulkAdd(data.familiars);
  }
  return { database, storage: createDexieStorage(database, "local"), data };
}

test("existing v2 records, numeric/string IDs, legacy backlinks and media survive open/read", async t => {
  const { database, storage, data } = await setup(t);
  await database.familiars.update("demo-owl", { studentId: "41" });
  database.close();
  await database.open();
  assert.equal(database.name.startsWith("test-storage-"), true);
  assert.equal(database.verno, 2);
  assert.deepEqual(await storage.characters.get(41), data.characters[0]);
  assert.deepEqual(await storage.familiars.get("demo-owl"), { ...data.familiars[0], studentId: "41" });
  assert.equal((await storage.characters.list())[0].id, 87);
});

test("create, complete edits, reload and deletion preserve both entity kinds", async t => {
  const { database, storage, data } = await setup(t, false);
  const { id, familiarId, ...draft } = data.characters[1];
  const saved = await storage.characters.save(draft);
  assert.equal(typeof saved.id, "number");
  await storage.characters.save({ ...saved, notas: "edited" });
  await storage.familiars.save(data.familiars[1]);
  await storage.familiars.save({ ...data.familiars[1], descripcion: "edited familiar" });
  database.close();
  await database.open();
  assert.equal((await storage.characters.get(saved.id))?.notas, "edited");
  assert.equal((await storage.familiars.get("demo-fox"))?.descripcion, "edited familiar");
  await storage.characters.remove(saved.id);
  await storage.familiars.remove("demo-fox");
  assert.equal((await storage.characters.list()).length, 0);
  assert.equal((await storage.familiars.list()).length, 0);
});

test("bond reassignment in both directions clears displaced partners; unbond is symmetric", async t => {
  const { storage } = await setup(t);
  await storage.bonds.assignCharacter(87, "demo-owl");
  assert.equal((await storage.characters.get(41))?.familiarId, undefined);
  assert.equal((await storage.familiars.get("demo-owl"))?.studentId, 87);
  await storage.bonds.assignFamiliar("demo-fox", 87);
  assert.equal((await storage.familiars.get("demo-owl"))?.studentId, undefined);
  assert.equal((await storage.characters.get(87))?.familiarId, "demo-fox");
  await storage.bonds.assignFamiliar("demo-fox", null);
  assert.equal((await storage.characters.get(87))?.familiarId, undefined);
  await storage.bonds.assignCharacter(41, "demo-owl");
  await storage.bonds.assignCharacter(41, null);
  assert.equal((await storage.familiars.get("demo-owl"))?.studentId, undefined);
});

test("deletion from either repository clears opposite links, including legacy string backlinks", async t => {
  const { database, storage } = await setup(t);
  await database.familiars.update("demo-owl", { studentId: "41" });
  await storage.characters.remove(41);
  assert.equal((await storage.familiars.get("demo-owl"))?.studentId, undefined);
  await storage.bonds.assignCharacter(87, "demo-fox");
  await storage.familiars.remove("demo-fox");
  assert.equal((await storage.characters.get(87))?.familiarId, undefined);
});

test("failed bond transaction rolls back all writes and missing endpoints do not detach", async t => {
  const { database, storage } = await setup(t);
  const before = await storage.backups.export();
  const fail = () => { throw new Error("simulated write failure"); };
  database.familiars.hook("updating", fail);
  await assert.rejects(storage.bonds.assignCharacter(87, "demo-owl"), /simulated write failure/);
  database.familiars.hook("updating").unsubscribe(fail);
  await assert.rejects(storage.bonds.assignCharacter(41, "missing"), /not found/);
  await assert.rejects(storage.bonds.assignFamiliar("missing", 41), /not found/);
  const after = await storage.backups.export();
  assert.deepEqual(after.characters, before.characters);
  assert.deepEqual(after.familiars, before.familiars);
});

test("stale complete editors cannot undo newer bonds and character save cannot resurrect a deletion", async t => {
  const { storage, data } = await setup(t);
  await storage.bonds.assignCharacter(87, "demo-owl");
  const c = await storage.characters.save({ ...data.characters[0], nombre: "edited name" });
  const f = await storage.familiars.save({ ...data.familiars[0], descripcion: "edited description" });
  assert.equal(c.familiarId, undefined);
  assert.equal(f.studentId, 87);
  await storage.characters.remove(41);
  await assert.rejects(storage.characters.save(c), /not found/);
});

test("creating a character with a familiar selected in its form creates both links", async t => {
  const { storage, data } = await setup(t);
  const { id, ...draft } = data.characters[0];
  const saved = await storage.characters.save(draft);
  assert.equal((await storage.characters.get(41))?.familiarId, undefined);
  assert.equal((await storage.familiars.get("demo-owl"))?.studentId, saved.id);
});

test("full JSON round trip remaps IDs and retains all content, media and unbound records", async t => {
  const { storage, data } = await setup(t);
  const backup = storage.backups.parse(JSON.stringify(await storage.backups.export()));
  const result = await storage.backups.import(backup, "replace");
  const newId = result.characterIds.get(41)!;
  assert.notEqual(newId, 41);
  assert.deepEqual(await storage.characters.get(newId), { ...data.characters[0], id: newId });
  assert.deepEqual(await storage.familiars.get("demo-owl"), { ...data.familiars[0], studentId: newId });
  assert.deepEqual(await storage.familiars.get("demo-fox"), { ...data.familiars[1], studentId: undefined });
  assert.equal(result.warnings.length, 0);
});

test("adding a backup preserves destination records and remaps colliding familiar IDs", async t => {
  const { storage, data } = await setup(t);
  const original = await storage.backups.export();
  const result = await storage.backups.import(original, "add");
  const importedFamiliar = result.familiarIds.get("demo-owl")!;
  assert.notEqual(importedFamiliar, "demo-owl");
  assert.deepEqual(await storage.characters.get(41), data.characters[0]);
  assert.deepEqual(await storage.familiars.get("demo-owl"), data.familiars[0]);
  assert.equal((await storage.characters.get(result.characterIds.get(41)!))?.familiarId, importedFamiliar);
  assert.equal((await storage.familiars.get(importedFamiliar))?.studentId, result.characterIds.get(41));
  assert.equal((await storage.familiars.list()).length, 4);
});

test("selected/single exports include linked familiar content but exclude standalone/unselected data", async t => {
  const { storage } = await setup(t);
  const backup = await storage.backups.export([41]);
  assert.deepEqual(backup.characters.map(c => c.id), [41]);
  assert.deepEqual(backup.familiars?.map(f => f.id), ["demo-owl"]);
  const result = await storage.backups.import(storage.backups.parse(JSON.stringify(backup)), "add");
  assert.equal((await storage.familiars.get(result.familiarIds.get("demo-owl")!))?.studentId, result.characterIds.get(41));
  assert.deepEqual((await storage.backups.export([])).characters, []);
});

test("familiar-only and empty backups round trip", async t => {
  const { storage, data } = await setup(t, false);
  await storage.familiars.save(data.familiars[1]);
  const backup = await storage.backups.export();
  assert.equal(backup.characters.length, 0);
  assert.equal(backup.familiars?.length, 1);
  await storage.backups.import(storage.backups.parse(JSON.stringify(backup)), "replace");
  assert.equal((await storage.familiars.list()).length, 1);
  await storage.backups.import(backupEnvelope([], []), "replace");
  assert.equal((await storage.familiars.list()).length, 0);
});

test("legacy characters-only imports detach missing bonds with warnings without binding existing entities", async t => {
  const { storage, data } = await setup(t);
  const result = await storage.backups.import({ ...backupEnvelope(data.characters, []), familiars: undefined }, "add");
  assert.equal(result.warnings[0].code, "missing-familiar");
  assert.equal((await storage.characters.get(result.characterIds.get(41)!))?.familiarId, undefined);
  assert.equal((await storage.familiars.get("demo-owl"))?.studentId, 41);
});

test("one-sided import links are reconstructed; missing masters are reported and detached", async t => {
  const { storage, data } = await setup(t, false);
  data.characters[0].familiarId = undefined;
  data.familiars[0].studentId = "41";
  data.familiars[1].studentId = "missing";
  const result = await storage.backups.import(backupEnvelope(data.characters, data.familiars), "add");
  assert.equal((await storage.characters.get(result.characterIds.get(41)!))?.familiarId, "demo-owl");
  assert.equal((await storage.familiars.get("demo-fox"))?.studentId, undefined);
  assert.equal(result.warnings[0].code, "missing-character");
});

test("invalid and contradictory replace imports preserve the entire destination transactionally", async t => {
  const { storage, data } = await setup(t);
  const before = await storage.backups.export();
  assert.throws(() => storage.backups.parse('{"app":"Magistri Scholae","characters":[]}'), /format/);
  await assert.rejects(storage.backups.import({ ...before, familiars: {} } as never, "replace"), /format/);
  await assert.rejects(storage.backups.import(backupEnvelope([data.characters[0], data.characters[0]], []), "replace"), /Duplicate/);
  data.characters[1].familiarId = "demo-owl";
  await assert.rejects(storage.backups.import(backupEnvelope(data.characters, data.familiars), "replace"), /Conflicting/);
  const after = await storage.backups.export();
  assert.deepEqual(after.characters, before.characters);
  assert.deepEqual(after.familiars, before.familiars);
});

test("confirmed reset clears both tables atomically; a failure restores both", async t => {
  const { database, storage } = await setup(t);
  const fail = () => { throw new Error("simulated reset failure"); };
  database.familiars.hook("deleting", fail);
  await assert.rejects(storage.maintenance.reset(), /reset failure/);
  database.familiars.hook("deleting").unsubscribe(fail);
  assert.equal((await storage.characters.list()).length, 2);
  assert.equal((await storage.familiars.list()).length, 2);
  await storage.maintenance.reset();
  assert.equal((await storage.characters.list()).length, 0);
  assert.equal((await storage.familiars.list()).length, 0);
});

test("mode resolution is explicit, defaults local, and rejects remote/typos without fallback", () => {
  assert.equal(resolveStorageMode(undefined), "local");
  assert.equal(resolveStorageMode("local"), "local");
  assert.equal(resolveStorageMode("mock"), "mock");
  assert.throws(() => resolveStorageMode("remote"), /Unsupported/);
  assert.throws(() => resolveStorageMode("mocks"), /Unsupported/);
  assert.equal(sharedReaderExample.fields.notas, undefined);
  assert.deepEqual(sharedReaderExample.capabilities.writablePaths, []);
});

test("the actual mock factory seeds isolated fictional data; edits, imports and reset never touch local", async () => {
  // fake-indexeddb replaces the browser API for this process. Even these exact
  // production names refer only to ephemeral in-process fixture databases.
  const local = new MagistriScholaeDB();
  const mockHandle = new MagistriScholaeDB(MOCK_DATABASE_NAME);
  const mock = createStorage("mock");
  try {
    await local.characters.add({ ...fixtures().characters[0], nombre: "Local fixture sentinel" });
    const before = await local.characters.toArray();
    assert.equal((await mock.characters.list()).length, 2);
    const first = (await mock.characters.list())[0];
    await mock.characters.save({ ...first, nombre: "Mock edit" });
    await mock.bonds.assignCharacter(87, "demo-fox");
    await mock.backups.import(await mock.backups.export(), "add");
    await mock.maintenance.reset();
    assert.deepEqual(await local.characters.toArray(), before);
    assert.equal((await local.familiars.toArray()).length, 0);
    assert.equal((await mock.characters.list()).length, 0);
  } finally {
    mock.maintenance.close();
    await mockHandle.delete();
    await local.delete();
  }
});
