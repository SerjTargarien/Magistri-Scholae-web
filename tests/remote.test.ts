// The account API client: same-origin CSRF, no local fallback, session
// revocation, and the rule details of refused values. The sheet store's
// behaviour is tested in store.test.ts (R3.3).
import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiFailure, RemoteClient } from "../src/remote/client";

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


test("a refused value keeps the rule the server names", async () => {
  const client = new RemoteClient((async () => new Response(JSON.stringify({ error: { code: "field_too_long", path: "nombre", rule: "maxLength", limit: 80 } }), { status: 400 })) as typeof fetch);
  await assert.rejects(client.request("characters/x"), (e: ApiFailure) => e.code === "field_too_long" && e.details?.path === "nombre" && e.details?.limit === 80);
  const plain = new RemoteClient((async () => new Response(JSON.stringify({ error: { code: "stored_sheet_invalid" } }), { status: 409 })) as typeof fetch);
  await assert.rejects(plain.request("characters/x"), (e: ApiFailure) => e.details === undefined);
});
