/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Administrator access with the Máster's permission (R4 e): the Máster's side. Campaign
// records, not sheet fields, so they have this adapter.
import type { ApiAdminAccess } from "../contracts/api-v1";
import type { RemoteClient } from "../remote/client";

export interface AccessApi {
  /** The current or last access, with what the administrator opened or changed. */
  latest(): Promise<ApiAdminAccess | null>;
  grant(reason: string): Promise<ApiAdminAccess>;
  withdraw(): Promise<ApiAdminAccess>;
}

export function remoteAccess(client: RemoteClient, campaignId: string): AccessApi {
  const path = `campaigns/${campaignId}/admin-access`;
  return {
    latest: async () => (await client.request<{ access: ApiAdminAccess | null }>(path)).access,
    grant: async reason => (await client.request<{ access: ApiAdminAccess }>(path, "POST", { reason })).access,
    withdraw: async () => (await client.request<{ access: ApiAdminAccess }>(path, "DELETE", {})).access,
  };
}
