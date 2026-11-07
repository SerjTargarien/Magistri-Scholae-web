// Run against the untouched application handlers before extracting persistence.
// Reads actual source bodies, transpiles TS, and executes only those operations
// against a uniquely named fixture DB. No React mount or user DB access.
import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import { MagistriScholaeDB } from "../src/db";
import { previewData } from "../src/fixtures/preview";

const baseline = "2518abd50809c3f59fab3dbb4e412ac6cc50a911";
const source = execFileSync("git", ["show", `${baseline}:src/App.tsx`], { encoding: "utf8" });
const database = new MagistriScholaeDB(`test-baseline-${crypto.randomUUID()}`);
const fixtures = previewData();
const noop = () => {};
async function execute(name: string, bindings: Record<string, unknown>, args: unknown[] = []) {
  const start = source.indexOf(`  const ${name} = async`);
  assert(start >= 0, `Baseline handler ${name} must still exist`);
  const end = source.indexOf("\n  };", start) + 5;
  const body = ts.transpileModule(source.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const handler = new Function(...Object.keys(bindings), `${body}\nreturn ${name};`)(...Object.values(bindings));
  await handler(...args);
}
try {
  await database.characters.bulkAdd(fixtures.characters);
  await database.familiars.bulkAdd(fixtures.familiars);
  await execute("handleBondFamiliar", {
    db: database, ...structuredClone(fixtures), loadCharacters: noop, setToastMessage: noop, t: {},
  }, [87, "demo-owl"]);
  assert.equal((await database.characters.get(41))?.familiarId, "demo-owl");
  assert.equal((await database.characters.get(87))?.familiarId, "demo-owl");
  console.log("REPRODUCED: character-side reassignment leaves two character links to one familiar");

  await database.characters.clear();
  await database.familiars.clear();
  await execute("handleImportAdd", {
    db: database, pendingBackup: { characters: fixtures.characters, familiars: fixtures.familiars },
    setShowImportModal: noop, setPendingBackup: noop, loadCharacters: noop, setToastMessage: noop, t: {},
  });
  assert.equal((await database.familiars.get("demo-owl"))?.studentId, 41);
  assert.equal(await database.characters.get(41), undefined);
  console.log("REPRODUCED: import rekeys character 41 but leaves familiar.studentId = 41");

  const settings = execFileSync("git", ["show", `${baseline}:src/components/SettingsScreen.tsx`], { encoding: "utf8" });
  assert(settings.includes("isFullBackup ? await db.familiars.toArray() : undefined"));
  assert(settings.includes("if (allCharacters.length === 0)"));
  console.log("SOURCE CHARACTERIZED: selective exports omit familiars; full export rejects familiar-only collections");
} finally {
  await database.delete();
}
