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
  schemaVersion: 1;
  revision: string;
  fields: ServerFields<K>;
  capabilities: { readablePaths: string[]; writablePaths: string[]; collectionPaths: string[]; removablePaths: string[]; bondWritable: boolean; isGM: boolean };
  bondId?: string;
  assignedPlayerId?: string | null;
  archived?: boolean;
}

export interface ApiPatch {
  operationId: string;
  expectedRevision: string;
  changes: { path: string; value: unknown }[];
}
export interface ApiError { error: { code: string } }
export interface ApiUser { id: string; username: string; displayName: string; isAdministrator: boolean }
export interface PersonalNoteView {
  id: string;
  sheetId: string | null;
  label: string;
  title: string;
  content: string;
  revision: number;
}
