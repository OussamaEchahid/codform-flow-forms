
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_ADMIN_URL?: string;
  // Add any other environment variables you might be using
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
