/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { Table } from "dexie";
import { Character } from "./types";

export class MagistriScholaeDB extends Dexie {
  characters!: Table<Character, number>;

  constructor() {
    super("MagistriScholaeDB");
    this.version(1).stores({
      characters: "++id, nombre, casa, jugador, concepto, createdAt, updatedAt",
    });
  }
}

export const db = new MagistriScholaeDB();

// Helper to retrieve storage info
export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedMB = estimate.usage ? (estimate.usage / (1024 * 1024)).toFixed(2) : "0";
      const quotaMB = estimate.quota ? (estimate.quota / (1024 * 1024)).toFixed(2) : "0";
      return { usedMB, quotaMB };
    } catch {
      return { usedMB: "Unknown", quotaMB: "Unknown" };
    }
  }
  return { usedMB: "IndexedDB", quotaMB: "Navigator Support Not Found" };
}
