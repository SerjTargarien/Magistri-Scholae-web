import { MagistriScholaeDB } from "../db";
import { previewData } from "../fixtures/preview";
import { createDexieStorage } from "./dexieStorage";
import { MOCK_DATABASE_NAME } from "./mode";
import type { StorageMode } from "./contracts";

export function createStorage(mode: StorageMode) {
  // Only the selected database is constructed. There is no fallback adapter.
  const database = new MagistriScholaeDB(mode === "mock" ? MOCK_DATABASE_NAME : undefined);
  if (mode === "mock") {
    database.on("populate", async () => {
      const fixtures = previewData();
      await database.characters.bulkAdd(fixtures.characters);
      await database.familiars.bulkAdd(fixtures.familiars);
    });
  }
  return createDexieStorage(database, mode);
}
