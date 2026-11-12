/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Private notes (R3.5; product-design.md, Notes): the screens' only way to read and
// change them. Notes are the author's own records, not sheet fields, so they have
// this adapter instead of the sheet store; it talks to the server, or to the demo's
// mock server through the same client. Moving a note into a sheet's Bitácora hands
// the sheet's new copy to that sheet's store.
import type { ApiSheetProjection, NotePromotionPreview, PersonalNoteView } from "../contracts/api-v1";
import type { RemoteClient } from "../remote/client";
import type { SheetStore } from "../store/sheetStore";

export type PrivateNote = PersonalNoteView;

export interface NotesApi {
  /** The viewer's notes, newest written first; only those about `sheetId` when given. */
  list(sheetId?: string): Promise<PrivateNote[]>;
  /** A new note (title and text may start empty); `sheetId` ties it to a sheet. */
  create(sheetId: string | null, fields?: { title?: string; content?: string }): Promise<PrivateNote>;
  /** Saves the changed fields; rejects with revision_conflict if it changed elsewhere. */
  update(note: PrivateNote, fields: { title?: string; content?: string }): Promise<PrivateNote>;
  remove(note: PrivateNote): Promise<void>;
  /** Who will read the entry and its date; refuses a note that does not fit the journal. */
  preview(note: PrivateNote, store: SheetStore, fecha?: number): Promise<NotePromotionPreview>;
  /** Moves the note into the sheet's journal with the chosen date; the store takes the sheet's new copy. */
  move(note: PrivateNote, store: SheetStore, preview: NotePromotionPreview, fecha: number): Promise<void>;
}

const PAGE = 100;

/**
 * `settle` waits until the sheet's store has nothing left to send, so the move
 * is based on the sheet's current revision (as uploads and bonds do).
 */
export function remoteNotes(client: RemoteClient, settle: (store: SheetStore) => Promise<void>): NotesApi {
  const body = (note: PrivateNote, store: SheetStore, fecha?: number) => ({
    sheetId: store.sheet.id, expectedRevision: store.sheet.revision, noteRevision: note.revision,
    ...(fecha === undefined ? {} : { fecha }),
  });
  return {
    async list(sheetId) {
      const items: PrivateNote[] = [];
      for (let offset = 0; ; offset += PAGE) {
        const query = `limit=${PAGE}&offset=${offset}${sheetId ? `&sheetId=${encodeURIComponent(sheetId)}` : ""}`;
        const page = await client.request<{ items: PrivateNote[] }>(`personal-notes?${query}`);
        items.push(...page.items);
        if (page.items.length < PAGE) return items;
      }
    },
    create: (sheetId, fields = {}) =>
      client.mutation<PrivateNote>("personal-notes", { title: fields.title ?? "", content: fields.content ?? "", ...(sheetId ? { sheetId } : {}) })(),
    update: (note, fields) =>
      client.mutation<PrivateNote>(`personal-notes/${note.id}`, { expectedRevision: note.revision, ...fields }, "PATCH")(),
    remove: async note => { await client.mutation(`personal-notes/${note.id}`, { expectedRevision: note.revision }, "DELETE")(); },
    async preview(note, store, fecha) {
      await settle(store);
      // A signed preview: no operation ID (the server refuses one here).
      return client.request<NotePromotionPreview>(`personal-notes/${note.id}/promote/preview`, "POST", body(note, store, fecha));
    },
    async move(note, store, preview, fecha) {
      const sheet = await client.mutation<ApiSheetProjection>(`personal-notes/${note.id}/promote`, { ...body(note, store, fecha), previewToken: preview.previewToken })();
      store.accept(sheet);
    },
  };
}
