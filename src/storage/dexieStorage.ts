import { MagistriScholaeDB, getStorageEstimate } from "../db";
import type { Character, Familiar, BackupData } from "../types";
import type { ImportResult, StorageMode, StorageServices, StoredCharacter } from "./contracts";
import { backupEnvelope, parseBackup, referencesCharacter, validateBackup } from "./backup";

export function createDexieStorage(database: MagistriScholaeDB, mode: StorageMode): StorageServices {
  const transaction = <T>(operation: () => Promise<T>) =>
    database.transaction("rw", database.characters, database.familiars, operation);

  // Called only inside a transaction; use current stored values, never UI arrays.
  const assignCharacter = async (characterId: number, familiarId: string | null) => {
    const character = await database.characters.get(characterId);
    if (!character) throw new Error("Character not found");
    const familiar = familiarId === null ? undefined : await database.familiars.get(familiarId);
    if (familiarId !== null && !familiar) throw new Error("Familiar not found");
    const now = Date.now();
    for (const c of await database.characters.toArray()) {
      if (c.id === characterId || (familiarId !== null && c.familiarId === familiarId)) {
        await database.characters.put({ ...c, familiarId: c.id === characterId ? familiarId ?? undefined : undefined, updatedAt: now });
      }
    }
    for (const f of await database.familiars.toArray()) {
      if (referencesCharacter(f.studentId, characterId) || (familiarId !== null && f.id === familiarId)) {
        await database.familiars.put({ ...f, studentId: f.id === familiarId ? characterId : undefined, updatedAt: now });
      }
    }
  };

  const detachFamiliar = async (id: string) => {
    const now = Date.now();
    for (const c of await database.characters.toArray()) {
      if (c.familiarId === id) await database.characters.put({ ...c, familiarId: undefined, updatedAt: now });
    }
    const f = await database.familiars.get(id);
    if (f) await database.familiars.put({ ...f, studentId: undefined, updatedAt: now });
  };

  const importBackup = async (data: BackupData, action: "add" | "replace"): Promise<ImportResult> => {
    validateBackup(data);
    const input = structuredClone(data);
    if (action !== "add" && action !== "replace") throw new Error("Invalid import action");
    return transaction(async () => {
      if (action === "replace") {
        await database.characters.clear();
        await database.familiars.clear();
      }
      const result: ImportResult = { characterIds: new Map(), familiarIds: new Map(), warnings: [] };
      const importedCharacters: Character[] = [];
      const importedFamiliars: Familiar[] = [];
      const reserved = new Set((await database.familiars.toArray()).map(f => f.id));
      // Reserve every source ID so generated IDs cannot collide with later input.
      for (const f of input.familiars ?? []) reserved.add(f.id);
      for (const f of input.familiars ?? []) {
        let id = f.id;
        if (await database.familiars.get(id)) {
          do { id = `${f.id}_copy_${crypto.randomUUID()}`; } while (reserved.has(id));
        }
        reserved.add(id);
        result.familiarIds.set(f.id, id);
        importedFamiliars.push({ ...f, id, studentId: undefined });
      }
      for (const c of input.characters) {
        const { id: oldId, ...fields } = c;
        const id = await database.characters.add({ ...fields, familiarId: undefined });
        if (oldId !== undefined) result.characterIds.set(oldId, id);
        importedCharacters.push({ ...fields, id, familiarId: undefined });
      }
      const pairs = new Map<number, string>();
      const owners = new Map<string, number>();
      const pair = (characterId: number, familiarId: string) => {
        if ((pairs.has(characterId) && pairs.get(characterId) !== familiarId) ||
            (owners.has(familiarId) && owners.get(familiarId) !== characterId)) {
          throw new Error("Conflicting bonds in backup; no records imported");
        }
        pairs.set(characterId, familiarId);
        owners.set(familiarId, characterId);
      };
      input.characters.forEach((c, index) => {
        if (c.familiarId !== undefined) {
          const familiarId = result.familiarIds.get(c.familiarId);
          if (familiarId) pair(importedCharacters[index].id!, familiarId);
          else result.warnings.push({ code: "missing-familiar", entityId: c.id ?? importedCharacters[index].id! });
        }
      });
      for (const f of input.familiars ?? []) {
        if (f.studentId !== undefined) {
          const source = input.characters.find(c => c.id !== undefined && referencesCharacter(f.studentId, c.id));
          const id = source?.id === undefined ? undefined : result.characterIds.get(source.id);
          if (id !== undefined) pair(id, result.familiarIds.get(f.id)!);
          else result.warnings.push({ code: "missing-character", entityId: f.id });
        }
      }
      for (const c of importedCharacters) {
        await database.characters.put({ ...c, familiarId: pairs.get(c.id!) });
      }
      for (const f of importedFamiliars) {
        await database.familiars.add({ ...f, studentId: owners.get(f.id) });
      }
      return result;
    });
  };

  return {
    mode,
    characters: {
      list: async () => await database.characters.reverse().sortBy("createdAt") as StoredCharacter[],
      get: async id => await database.characters.get(id) as StoredCharacter | undefined,
      save: data => transaction(async () => {
        const input = structuredClone(data);
        if (input.id !== undefined) {
          const current = await database.characters.get(input.id);
          if (!current) throw new Error("Character not found");
          // Bonds have their own operation; a stale editor cannot undo a bond.
          await database.characters.put({ ...input, familiarId: current.familiarId });
        } else {
          input.id = await database.characters.add({ ...input, familiarId: undefined });
          if (input.familiarId !== undefined) await assignCharacter(input.id, input.familiarId);
        }
        return await database.characters.get(input.id) as StoredCharacter;
      }),
      remove: id => transaction(async () => {
        for (const f of await database.familiars.toArray()) {
          if (referencesCharacter(f.studentId, id)) {
            await database.familiars.put({ ...f, studentId: undefined, updatedAt: Date.now() });
          }
        }
        await database.characters.delete(id);
      }),
    },
    familiars: {
      list: () => database.familiars.orderBy("createdAt").reverse().toArray(),
      get: id => database.familiars.get(id),
      save: data => transaction(async () => {
        const input = structuredClone(data);
        const current = await database.familiars.get(input.id);
        await database.familiars.put({ ...input, studentId: current?.studentId });
        if (!current && input.studentId !== undefined) {
          const character = (await database.characters.toArray()).find(c => referencesCharacter(input.studentId, c.id!));
          if (!character) throw new Error("Character not found");
          await assignCharacter(character.id!, input.id);
        }
        return (await database.familiars.get(input.id))!;
      }),
      remove: id => transaction(async () => {
        await detachFamiliar(id);
        await database.familiars.delete(id);
      }),
    },
    bonds: {
      assignCharacter: (id, familiarId) => transaction(() => assignCharacter(id, familiarId)),
      assignFamiliar: (id, characterId) => transaction(async () => {
        if (!await database.familiars.get(id)) throw new Error("Familiar not found");
        if (characterId === null) await detachFamiliar(id);
        else await assignCharacter(characterId, id);
      }),
    },
    backups: {
      parse: parseBackup,
      export: characterIds => database.transaction("r", database.characters, database.familiars, async () => {
        const characters = (await database.characters.toArray()).filter(c => characterIds === undefined || characterIds.includes(c.id!));
        const familiars = (await database.familiars.toArray()).filter(f => characterIds === undefined ||
          characters.some(c => c.familiarId === f.id || referencesCharacter(f.studentId, c.id!)));
        return backupEnvelope(characters, familiars);
      }),
      import: importBackup,
    },
    maintenance: {
      close: () => database.close(),
      reset: () => transaction(async () => {
        await database.characters.clear();
        await database.familiars.clear();
      }),
      estimate: getStorageEstimate,
    },
  };
}
