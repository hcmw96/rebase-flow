-- Edge functions (service_role) and API roles need table-level grants on mb_sessions.
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mb_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bookings TO service_role;

-- RLS policies were missing TO service_role (unlike hidden_services).
DROP POLICY IF EXISTS "Service role can manage mb_sessions" ON public.mb_sessions;
CREATE POLICY "Service role can manage mb_sessions"
ON public.mb_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage bookings" ON public.bookings;
CREATE POLICY "Service role can manage bookings"
ON public.bookings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
