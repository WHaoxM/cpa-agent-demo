/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string
  /** `mock` (default) | `http` */
  readonly VITE_API_MODE?: 'mock' | 'http' | string
  /**
   * Backend origin for direct calls, e.g. http://host:port
   * Empty string → same-origin `/api` via Vite proxy
   */
  readonly VITE_API_BASE_URL?: string
  /** Dev-server proxy target (any host:port); only used by vite.config.ts */
  readonly VITE_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
