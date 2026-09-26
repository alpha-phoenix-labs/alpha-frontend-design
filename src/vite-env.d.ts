/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Basis-URL der Factory-API. Leer oder nicht gesetzt: MockFactoryService greift. */
  readonly VITE_FACTORY_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
