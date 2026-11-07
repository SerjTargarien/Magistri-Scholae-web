import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import type { LocalCharacter, LocalFamiliar, ViewerProjection } from "../src/storage/contracts";

// Compile-time guard: a partial network envelope is never a full local entity.
const characterIsSeparated: ViewerProjection<LocalCharacter> extends LocalCharacter ? false : true = true;
const familiarIsSeparated: ViewerProjection<LocalFamiliar> extends LocalFamiliar ? false : true = true;

test("UI/application modules cannot import Dexie or directly access entity tables", () => {
  function check(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (path !== join("src", "storage")) check(path);
      } else if (/\.tsx?$/.test(entry.name) && path !== join("src", "db.ts")) {
        const source = readFileSync(path, "utf8");
        assert.doesNotMatch(source, /from\s+["'][^"']*(?:\/db|dexie(?:-react-hooks)?)["']/, path);
        assert.doesNotMatch(source, /\b(?:db|database)\.(?:characters|familiars)\b|\bindexedDB\b/, path);
      }
    }
  }
  check("src");
  assert(characterIsSeparated && familiarIsSeparated);
});
