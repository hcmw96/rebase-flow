-- Shared Mindbody staff token + public API response cache (edge functions only via service role).

CREATE TABLE IF NOT EXISTS public.mindbody_staff_token (
  id text PRIMARY KEY DEFAULT 'default',
  access_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mindbody_api_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mindbody_api_cache_expires_at_idx
  ON public.mindbody_api_cache (expires_at);

ALTER TABLE public.mindbody_staff_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindbody_api_cache ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: only service_role (bypasses RLS) may read/write.
COMMENT ON TABLE public.mindbody_staff_token IS
  'Cached Mindbody staff AccessToken; written by edge functions with service role.';
COMMENT ON TABLE public.mindbody_api_cache IS
  'Cached Mindbody public read responses (services/classes/availability).';
