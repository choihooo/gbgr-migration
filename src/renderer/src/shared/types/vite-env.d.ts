/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="../../preload/exposedInMainWorld" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL?: string
  readonly VITE_APP_VERSION?: string
}
