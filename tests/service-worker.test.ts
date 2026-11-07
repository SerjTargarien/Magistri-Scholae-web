import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";

function worker(cacheControl = "") {
  const handlers: Record<string, (event: any) => void> = {};
  let writes = 0;
  const response = new Response("fictional fixture", { headers: { "Cache-Control": cacheControl } });
  vm.runInNewContext(readFileSync("public/sw.js", "utf8"), {
    URL, Response,
    self: { location: { origin: "https://demo.invalid" }, addEventListener: (name: string, callback: (event: any) => void) => { handlers[name] = callback; } },
    fetch: async () => response,
    caches: { open: async () => ({ put: () => { writes += 1; } }), match: async () => response },
  });
  return {
    dispatch(url: string) {
      let result: Promise<Response> | undefined;
      handlers.fetch({ request: { url, method: "GET" }, respondWith: (value: Promise<Response>) => { result = value; } });
      return result;
    },
    writes: () => writes,
  };
}

test("service worker bypasses API and private media instead of using any cached response", () => {
  const sw = worker();
  for (const url of ["https://demo.invalid/api/v1/characters", "https://demo.invalid/media/private.png", "https://demo.invalid/api", "https://demo.invalid/media"]) {
    assert.equal(sw.dispatch(url), undefined);
  }
  assert.equal(sw.writes(), 0);
});

test("service worker honors no-store/private responses", async () => {
  for (const policy of ["no-store", "private, max-age=0"]) {
    const sw = worker(policy);
    await sw.dispatch("https://demo.invalid/custom-data");
    assert.equal(sw.writes(), 0);
  }
});

test("service worker retains successful static asset caching", async () => {
  const sw = worker("public, max-age=60");
  await sw.dispatch("https://demo.invalid/assets/app.js");
  assert.equal(sw.writes(), 1);
});

test("service worker ignores unregistered GETs, foreign assets and query-bearing requests", () => {
  const sw = worker();
  for (const url of ["https://demo.invalid/custom-data", "https://other.invalid/assets/app.js", "https://demo.invalid/assets/app.js?private=1"])
    assert.equal(sw.dispatch(url), undefined);
});
