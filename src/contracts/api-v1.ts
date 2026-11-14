import { API_SCHEMA } from "./fieldRegistry.generated";

export type EntityKind = keyof typeof API_SCHEMA.entities;
type Registry = typeof API_SCHEMA.entities;
type ValueOf<F> =
  F extends { readonly choices: readonly (infer C)[] } ? C :
  F extends { readonly type: "string" } ? string :
  F extends { readonly type: "number" } ? number :
  F extends { readonly type: "boolean" } ? boolean :
  F extends { readonly type: "media" } ? string | null :
  F extends { readonly type: "object"; readonly fields: infer S } ? Fields<S> :
  F extends { readonly type: "items"; readonly fields: infer S } ? ({ id: string } & Fields<S>)[] : never;
type Fields<S> = { [K in keyof S]?: ValueOf<S[K]> };

// Remote collections have stable item IDs. No local schema/ID conversion is
// implied, and these projected values must not enter whole-record local saves.
export type ServerFields<K extends EntityKind> = K extends EntityKind ? Fields<Registry[K]> : never;
export interface ApiSheetProjection<K extends EntityKind = EntityKind> {
  kind: "viewer-projection";
  id: string;
  entityType: K;
  campaignId: string;
  schemaVersion: 4;
  revision: string;
  fields: ServerFields<K>;
  capabilities: { readablePaths: string[]; writablePaths: string[]; collectionPaths: string[]; removablePaths: string[]; bondWritable: boolean; isGM: boolean };
  bondId?: string;
  assignedPlayerId?: string | null;
  archived?: boolean;
  /** GM only, characters only: the character's partida (R4 b); familiars follow their bond. */
  tableId?: string | null;
}

export interface ApiPatch {
  operationId: string;
  expectedRevision: string;
  changes: { path: string; value: unknown }[];
}
export interface ApiError { error: { code: string } }
export interface ApiUser { id: string; username: string; displayName: string; isAdministrator: boolean }
export type ApiRole = "gm" | "player";
/** GET campaigns: the viewer's own role, or null for an administrator who is not a member. */
export interface ApiCampaign { id: string; name: string; policyRevision: number; role: ApiRole | null }
/** GET campaigns/<id>/members (the campaign's GM, or the site administrator). */
export interface ApiMember { userId: string; username: string; displayName: string; role: ApiRole }
/** A partida, one table of the campaign (R4 b): GET campaigns/<id>/tables, GM only. */
export interface ApiTable { id: string; name: string }
/** GET admin/users (site administrator): accounts with their campaigns and roles, no sheet content. */
export interface ApiAdminUser extends ApiUser { isActive: boolean; campaigns: { id: string; name: string; role: ApiRole }[] }
/** GET admin/invitations (site administrator): unused invitations that have not expired; the code is never shown again. */
export interface ApiInvitation { id: string; campaignId: string; campaignName: string; role: ApiRole; issuer: string; expiresAt: string }
/** A private note (author only). Its title may be empty; createdAt is when it was written and never changes. */
export interface PersonalNoteView {
  id: string;
  sheetId: string | null;
  label: string;
  title: string;
  content: string;
  revision: number;
  /** When the note was written, in milliseconds (owner, 12 November 2026). */
  createdAt: number;
  updatedAt: number;
}
/** POST personal-notes/<id>/promote/preview: who will read the journal entry, and its date. */
export interface NotePromotionPreview {
  previewToken: string;
  audiences: Record<"titulo" | "contenido" | "fecha", "gm" | "assigned" | "shared">;
  sourceWillBeDeleted: true;
  title: string;
  content: string;
  /** The entry's date: the one sent, or when the note was written. */
  fecha: number;
}
