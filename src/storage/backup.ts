import type { BackupData, Character, Familiar } from "../types";

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const timestamp = (value: unknown) => typeof value === "number" && Number.isFinite(value);

// Validate before any destructive transaction. Preserve unknown/legacy fields,
// embedded media and optional collections rather than rebuilding from defaults.
export function validateBackup(value: unknown): asserts value is BackupData {
  if (!record(value) || value.app !== "Magistri Scholae" || value.backupVersion !== "1.0" ||
      !Array.isArray(value.characters) ||
      (value.familiars !== undefined && !Array.isArray(value.familiars))) {
    throw new Error("Unsupported backup format");
  }
  const characterIds = new Set<number>();
  for (const c of value.characters) {
    if (!record(c) || typeof c.nombre !== "string" || typeof c.casa !== "string" ||
        !timestamp(c.createdAt) || !timestamp(c.updatedAt) ||
        (c.id !== undefined && (typeof c.id !== "number" || !Number.isSafeInteger(c.id))) ||
        (c.familiarId !== undefined && typeof c.familiarId !== "string")) {
      throw new Error("Invalid character in backup");
    }
    if (c.id !== undefined) {
      if (characterIds.has(c.id as number)) throw new Error("Duplicate character ID in backup");
      characterIds.add(c.id as number);
    }
  }
  const familiarIds = new Set<string>();
  for (const f of (value.familiars ?? []) as unknown[]) {
    if (!record(f) || typeof f.id !== "string" || !f.id || typeof f.nombre !== "string" ||
        typeof f.especie !== "string" || !timestamp(f.createdAt) || !timestamp(f.updatedAt) ||
        (f.studentId !== undefined && typeof f.studentId !== "number" && typeof f.studentId !== "string")) {
      throw new Error("Invalid familiar in backup");
    }
    if (familiarIds.has(f.id)) throw new Error("Duplicate familiar ID in backup");
    familiarIds.add(f.id);
  }
}

export function parseBackup(json: string): BackupData {
  const value: unknown = JSON.parse(json);
  validateBackup(value);
  return value;
}

// Exact canonical numeric-string backlinks are supported without rewriting
// stored legacy references on reads or startup (e.g. 41 and "41").
export const referencesCharacter = (reference: Familiar["studentId"], id: number) =>
  reference !== undefined && String(reference) === String(id);

export function backupEnvelope(characters: Character[], familiars: Familiar[]): BackupData {
  return { backupVersion: "1.0", app: "Magistri Scholae", exportedAt: new Date().toISOString(), characters, familiars };
}
