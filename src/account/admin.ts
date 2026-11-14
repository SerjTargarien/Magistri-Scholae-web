/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// «Administración» (R4 a): the site administrator's accounts, campaigns, members,
// invitations and recovery links. These are account records, not sheet fields, so
// they have this adapter instead of the sheet store; it talks to the server, or to
// the demo's mock server through the same client. Invitation and recovery codes
// come back once and are turned into links the sign-in screen understands
// (`#invitacion=` and `#recuperacion=`, product-design.md section 2).
import type { ApiAdminAccess, ApiAdminUser, ApiCampaign, ApiInvitation, ApiMember, ApiRole } from "../contracts/api-v1";
import type { RemoteClient } from "../remote/client";

const PAGE = 100; // the server's maximum page size

/** A code shown once, as the link to send and its expiry. */
export interface IssuedLink { link: string; expiresAt: string }

export interface AdminApi {
  users(): Promise<ApiAdminUser[]>;
  campaigns(): Promise<ApiCampaign[]>;
  members(campaignId: string): Promise<ApiMember[]>;
  invitations(): Promise<ApiInvitation[]>;
  createCampaign(name: string): Promise<ApiCampaign>;
  /** Adds an existing account, changes its role, or (null) removes it from the campaign. */
  setMember(campaignId: string, userId: string, role: ApiRole | null): Promise<void>;
  invite(campaignId: string, role: ApiRole): Promise<IssuedLink>;
  cancelInvitation(id: string): Promise<void>;
  /** A new recovery link; it cancels the account's previous one. */
  recoveryLink(userId: string): Promise<IssuedLink>;
  setActive(userId: string, active: boolean): Promise<void>;
  /** Live accesses a Máster granted (R4 e). */
  accesses(): Promise<ApiAdminAccess[]>;
  /** Ends an access: the issue is solved. */
  solved(accessId: string): Promise<void>;
}

/** The address the links open: this site's own (production or staging). */
export const linkFor = (kind: "invitacion" | "recuperacion", code: string, origin = window.location.origin) => `${origin}/#${kind}=${code}`;

export function remoteAdmin(client: RemoteClient): AdminApi {
  const all = async <T,>(path: string) => {
    const items: T[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const page = await client.request<{ items: T[] }>(`${path}${path.includes("?") ? "&" : "?"}limit=${PAGE}&offset=${offset}`);
      items.push(...page.items);
      if (page.items.length < PAGE) return items;
    }
  };
  return {
    users: () => all<ApiAdminUser>("admin/users"),
    campaigns: () => all<ApiCampaign>("campaigns"),
    members: id => all<ApiMember>(`campaigns/${id}/members`),
    invitations: () => all<ApiInvitation>("admin/invitations"),
    createCampaign: async name => ({ ...(await client.request<Omit<ApiCampaign, "role">>("campaigns", "POST", { name })), role: null }),
    setMember: async (campaignId, userId, role) => { await client.request(`campaigns/${campaignId}/members`, "POST", { userId, role }); },
    invite: async (campaignId, role) => {
      const { token, expiresAt } = await client.request<{ token: string; expiresAt: string }>("auth/invitations", "POST", { campaignId, role });
      return { link: linkFor("invitacion", token), expiresAt };
    },
    cancelInvitation: async id => { await client.request(`admin/invitations/${id}`, "DELETE", {}); },
    recoveryLink: async userId => {
      const { code, expiresAt } = await client.request<{ code: string; expiresAt: string }>("auth/reset-codes", "POST", { userId });
      return { link: linkFor("recuperacion", code), expiresAt };
    },
    setActive: async (userId, active) => { await client.request(`admin/users/${userId}/state`, "POST", { active }); },
    accesses: async () => (await client.request<{ items: ApiAdminAccess[] }>("admin/accesses")).items,
    solved: async id => { await client.request(`admin/accesses/${id}/solved`, "POST", {}); },
  };
}
