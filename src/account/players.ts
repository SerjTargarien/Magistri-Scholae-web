/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The Máster's «Jugadores» (R4 d): his campaign's members, player invitations shown once
// as links, pending invitations and removing a player. Campaign records, not sheet
// fields, so they have this adapter; the server allows the Máster player invitations
// only (GM invitations stay with the administrator).
import type { ApiInvitation, ApiMember } from "../contracts/api-v1";
import type { RemoteClient } from "../remote/client";
import { linkFor, type IssuedLink } from "./admin";

export interface PlayersApi {
  members(): Promise<ApiMember[]>;
  invitations(): Promise<ApiInvitation[]>;
  invite(): Promise<IssuedLink>;
  cancel(invitationId: string): Promise<void>;
  /** Removes an account from the campaign; its sheets are kept. */
  remove(userId: string): Promise<void>;
}

export function remotePlayers(client: RemoteClient, campaignId: string): PlayersApi {
  const base = `campaigns/${campaignId}`;
  return {
    members: async () => (await client.request<{ items: ApiMember[] }>(`${base}/members?limit=100`)).items,
    invitations: async () => (await client.request<{ items: ApiInvitation[] }>(`${base}/invitations?limit=100`)).items,
    invite: async () => {
      const { token, expiresAt } = await client.request<{ token: string; expiresAt: string }>("auth/invitations", "POST", { campaignId, role: "player" });
      return { link: linkFor("invitacion", token), expiresAt };
    },
    cancel: async id => { await client.request(`${base}/invitations/${id}`, "DELETE", {}); },
    remove: async userId => { await client.request(`${base}/members`, "POST", { userId, role: null }); },
  };
}
