import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// The retired local mode (R3.6) leaves no browser database behind: screens reach
// records only through the sheet store and its adapters (AGENTS.md). The offline
// store (R7) will add its own module and update this guard.
test("no source file uses Dexie or IndexedDB", () => {
  function check(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) check(path);
      else if (/\.tsx?$/.test(entry.name)) {
        const source = readFileSync(path, "utf8");
        assert.doesNotMatch(source, /from\s+["']dexie(?:-react-hooks)?["']/, path);
        assert.doesNotMatch(source, /\bindexedDB\b|MagistriScholaeDB/, path);
      }
    }
  }
  check("src");
});
