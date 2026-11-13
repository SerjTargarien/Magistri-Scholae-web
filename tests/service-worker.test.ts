import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";

function worker(cacheControl = "", cacheNames: string[] = []) {
  const handlers: Record<string, (event: any) => void> = {};
  let writes = 0;
  const deleted: string[] = [];
  const response = new Response("fictional fixture", { headers: { "Cache-Control": cacheControl } });
  vm.runInNewContext(readFileSync("public/sw.js", "utf8"), {
    URL, Response,
    self: { location: { origin: "https://demo.invalid" }, clients: { claim: async () => undefined }, addEventListener: (name: string, callback: (event: any) => void) => { handlers[name] = callback; } },
    fetch: async () => response,
    caches: { open: async () => ({ put: () => { writes += 1; } }), match: async () => response, keys: async () => cacheNames, delete: async (name: string) => { deleted.push(name); return true; } },
  });
  return {
    dispatch(url: string) {
      let result: Promise<Response> | undefined;
      handlers.fetch({ request: { url, method: "GET" }, respondWith: (value: Promise<Response>) => { result = value; } });
      return result;
    },
    writes: () => writes,
    async activate() {
      let done: Promise<unknown> | undefined;
      handlers.activate({ waitUntil: (value: Promise<unknown>) => { done = value; } });
      await done;
      return deleted;
    },
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

test("activation drops the old apps' caches and keeps the current one and other sites' caches", async () => {
  const sw = worker("", ["magistri-scholae-v1", "magistri-scholae-static-v2", "magistri-scholae-account-v3", "someone-else"]);
  assert.deepEqual(await sw.activate(), ["magistri-scholae-v1", "magistri-scholae-static-v2"]);
});
