import type { ApiSheetProjection } from "../contracts/api-v1";

/** Which rule a refused value broke, when the server names it (field rules, R3.2). */
export interface FailureDetails { path?: string; rule?: string; limit?: unknown }

export class ApiFailure extends Error {
  constructor(public status: number, public code: string, public details?: FailureDetails) { super(code); }
}

export class RemoteClient {
  private csrf = "";
  private controllers = new Set<AbortController>();
  private generation = 0;
  constructor(private transport: typeof fetch = fetch, private expired = () => {}) {}
  async request<T>(path: string, method = "GET", body?: unknown, quiet401 = false): Promise<T> {
    const generation = this.generation;
    if (method !== "GET" && !this.csrf) await this.token();
    if (generation !== this.generation) throw new DOMException("Session changed", "AbortError");
    const controller = new AbortController();
    this.controllers.add(controller);
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await this.transport.call(globalThis, `/api/v1/${path}`, {
        method, credentials: "same-origin", cache: "no-store", signal: controller.signal,
        headers: method === "GET" ? {} : { "Content-Type": "application/json", "X-CSRFToken": this.csrf },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await response.json();
      if (generation !== this.generation) throw new DOMException("Session changed", "AbortError");
      if (!response.ok) {
        if (response.status === 401 && !quiet401) this.expired();
        const { code, path, rule, limit } = data.error ?? {};
        throw new ApiFailure(response.status, code || "request_failed", path === undefined && rule === undefined ? undefined : { path, rule, limit });
      }
      if (data.csrfToken) this.csrf = data.csrfToken;
      return data as T;
    } finally { clearTimeout(timer); this.controllers.delete(controller); }
  }
  async token() { await this.request("auth/csrf"); }
  mutation<T>(path: string, body: object, method = "POST"): () => Promise<T> {
    const request = { ...body, operationId: crypto.randomUUID() };
    return () => this.request<T>(path, method, request);
  }
  clear() { this.generation++; for (const c of this.controllers) c.abort(); this.controllers.clear(); this.csrf = ""; }
}

export function entityPath(sheet: Pick<ApiSheetProjection, "entityType" | "id">) {
  return `${sheet.entityType === "character" ? "characters" : "familiars"}/${sheet.id}`;
}
