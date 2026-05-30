-- Numeric Mindbody client Id at the Rebase site (for booking APIs).
-- OAuth mindbody_client_id is the public UniqueId / Custom ID; this is the site-local Id.
ALTER TABLE public.mb_sessions
  ADD COLUMN IF NOT EXISTS mindbody_site_client_id TEXT;

CREATE INDEX IF NOT EXISTS idx_mb_sessions_site_client_id
  ON public.mb_sessions (mindbody_site_client_id)
  WHERE mindbody_site_client_id IS NOT NULL;
