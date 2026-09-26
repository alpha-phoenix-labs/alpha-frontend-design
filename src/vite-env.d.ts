/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Factory implementation: leer/nicht gesetzt oder `mock` = MockFactoryService, `http` = Orchestrator-HTTP-API. */
  readonly VITE_FACTORY_MODE?: string;
  /** Basis-URL der Factory-API (nur bei VITE_FACTORY_MODE=http). HTTPS, außer localhost; ohne Query, Hash und Zugangsdaten. */
  readonly VITE_FACTORY_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
