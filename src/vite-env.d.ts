/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  /** Mindbody studio site ID (public) — used for new-client registration links */
  readonly VITE_MINDBODY_SITE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
