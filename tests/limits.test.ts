// Every text box's limit comes from the server's rules (R3.4, counters near limits).
// This checks that each field path the screens pass to limitAttrs / maxLengthOf
// resolves to a real limit, so a typo cannot leave a box without one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { limitAttrs, maxLengthOf } from "../src/components/LimitHint";

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sources(join(dir, entry.name)) : entry.name.endsWith(".tsx") ? [join(dir, entry.name)] : []);
}

test("every limited box names a field with a text limit", () => {
  const uses = sources("src").flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/(?:limitAttrs|maxLengthOf)\("(character|familiar)", "([^"]+)"/g)].map((m) => ({ file, kind: m[1] as "character" | "familiar", path: m[2] })));
  assert.ok(uses.length > 40, `expected the screens to use the limits, found ${uses.length}`);
  for (const { file, kind, path } of uses) assert.ok(maxLengthOf(kind, path), `${file}: ${kind} ${path} has no text limit`);
});

test("a box that adds to a list carries the list's size and limit", () => {
  assert.deepEqual(limitAttrs("character", "aspectosPersonales/x/value", { path: "aspectosPersonales", count: 27 }),
    { maxLength: 300, "data-list-count": 27, "data-list-max": 30 });
  assert.equal(maxLengthOf("character", "concepto"), 200);
  assert.equal(maxLengthOf("familiar", "especie"), 60);
});
