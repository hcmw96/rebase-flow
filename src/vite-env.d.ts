/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  /** Mindbody studio site ID (public) — used for new-client registration links */
  readonly VITE_MINDBODY_SITE_ID?: string;
  /** Optional override for Mindbody new-client registration URL */
  readonly VITE_MINDBODY_SIGNUP_URL?: string;
  /** Optional override for Mindbody account page (add card / profile) */
  readonly VITE_MINDBODY_ACCOUNT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
