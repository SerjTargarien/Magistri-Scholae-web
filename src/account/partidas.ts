/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The campaign's partidas (R4 b; decision 9): the Máster's own table management. They
// are campaign records, not sheet fields, so they have this adapter; a character's
// partida is set through the sheet's management call, like archiving. Players never
// see partidas (owner, 14 November 2026).
import type { ApiTable } from "../contracts/api-v1";
import type { RemoteClient } from "../remote/client";

export interface PartidasApi {
  list(): Promise<ApiTable[]>;
  create(name: string): Promise<ApiTable>;
  rename(id: string, name: string): Promise<ApiTable>;
  /** Its characters stay, «sin partida». */
  remove(id: string): Promise<void>;
}

export function remotePartidas(client: RemoteClient, campaignId: string): PartidasApi {
  const base = `campaigns/${campaignId}/tables`;
  return {
    list: async () => (await client.request<{ items: ApiTable[] }>(base)).items,
    create: name => client.request<ApiTable>(base, "POST", { name }),
    rename: (id, name) => client.request<ApiTable>(`${base}/${id}`, "PATCH", { name }),
    remove: async id => { await client.request(`${base}/${id}`, "DELETE", {}); },
  };
}
