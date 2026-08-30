/// <reference types="vite/client" />

declare const __BASE_PATH__: string;

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_URL?: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
