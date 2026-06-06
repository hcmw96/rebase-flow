-- Audit trail for June 2-week contrast pass purchases and communal class bookings paid with a pass.

CREATE TABLE IF NOT EXISTS public.contrast_pass_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('purchase', 'class_booking')),
  session_id UUID REFERENCES public.mb_sessions(id) ON DELETE SET NULL,
  mindbody_client_id TEXT,
  mindbody_site_client_id TEXT,
  mindbody_client_service_id BIGINT,
  mindbody_sale_service_id BIGINT,
  mindbody_class_id TEXT,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount_gbp NUMERIC(10, 2),
  product_name TEXT,
  service_name TEXT,
  class_start_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contrast_pass_usage_session
  ON public.contrast_pass_usage_events (session_id);

CREATE INDEX IF NOT EXISTS idx_contrast_pass_usage_client
  ON public.contrast_pass_usage_events (mindbody_site_client_id);

CREATE INDEX IF NOT EXISTS idx_contrast_pass_usage_created
  ON public.contrast_pass_usage_events (created_at DESC);

ALTER TABLE public.contrast_pass_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage contrast_pass_usage_events"
  ON public.contrast_pass_usage_events;
CREATE POLICY "Service role can manage contrast_pass_usage_events"
  ON public.contrast_pass_usage_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contrast_pass_usage_events TO service_role;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS mindbody_client_service_id TEXT;
