import type { BackupData, Character, Familiar } from "../types";

// Complete legacy local data. These are never viewer-filtered network records.
export type LocalCharacter = Character;
export type LocalFamiliar = Familiar;
export type StoredCharacter = LocalCharacter & { id: number };
export type StorageMode = "local" | "mock";

export interface CharacterRepository {
  list(): Promise<StoredCharacter[]>;
  get(id: number): Promise<StoredCharacter | undefined>;
  save(data: LocalCharacter): Promise<StoredCharacter>;
  remove(id: number): Promise<void>;
}

export interface FamiliarRepository {
  list(): Promise<LocalFamiliar[]>;
  get(id: string): Promise<LocalFamiliar | undefined>;
  save(data: LocalFamiliar): Promise<LocalFamiliar>;
  remove(id: string): Promise<void>;
}

export interface ImportWarning {
  code: "missing-familiar" | "missing-character";
  entityId: number | string;
}

export interface ImportResult {
  characterIds: Map<number, number>;
  familiarIds: Map<string, string>;
  warnings: ImportWarning[];
}

export interface StorageServices {
  readonly mode: StorageMode;
  characters: CharacterRepository;
  familiars: FamiliarRepository;
  bonds: {
    assignCharacter(characterId: number, familiarId: string | null): Promise<void>;
    assignFamiliar(familiarId: string, characterId: number | null): Promise<void>;
  };
  backups: {
    parse(json: string): BackupData;
    export(characterIds?: readonly number[]): Promise<BackupData>;
    import(data: BackupData, action: "add" | "replace"): Promise<ImportResult>;
  };
  maintenance: {
    close(): void;
    reset(): Promise<void>;
    estimate(): Promise<{ usedMB: string; quotaMB: string }>;
  };
}

// Proposed future remote contract, deliberately wrapped so it cannot be passed
// to a complete-record local save. Hidden fields are absent, never defaulted.
export interface ViewerProjection<T> {
  kind: "viewer-projection";
  id: string;
  revision: string;
  fields: Partial<T>;
  capabilities: { readablePaths: readonly string[]; writablePaths: readonly string[] };
}

export interface ProjectedMutation {
  expectedRevision: string;
  operationId: string;
  changes: readonly { path: string; value: unknown }[];
}
