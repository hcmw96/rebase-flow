-- Edge functions use the service_role key; ensure full DML on cache tables.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mindbody_staff_token TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mindbody_api_cache TO service_role;

-- Lock down client roles (tables are edge-only).
REVOKE ALL ON TABLE public.mindbody_staff_token FROM anon, authenticated;
REVOKE ALL ON TABLE public.mindbody_api_cache FROM anon, authenticated;
