/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" in demo builds: the in-browser mock server answers /api (always marked DEMO). */
  readonly VITE_MOCK_SERVER?: string;
}
