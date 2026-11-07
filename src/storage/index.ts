import { createStorage } from "./createStorage";
import { resolveStorageMode } from "./mode";

export const storage = createStorage(resolveStorageMode(import.meta.env.VITE_STORAGE_MODE));
