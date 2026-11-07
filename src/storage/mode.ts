import type { StorageMode } from "./contracts";

export const MOCK_DATABASE_NAME = "MagistriScholaeMockDB";

export function resolveStorageMode(value: string | undefined): StorageMode {
  if (value === undefined || value === "" || value === "local") return "local";
  if (value === "mock") return "mock";
  throw new Error(`Unsupported VITE_STORAGE_MODE: ${value}. Use local or mock.`);
}
