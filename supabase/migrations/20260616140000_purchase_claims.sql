CREATE TABLE IF NOT EXISTS public.purchase_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mb_sessions(id) ON DELETE CASCADE,
  mindbody_site_client_id TEXT NOT NULL,
  product_key TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount_gbp NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT purchase_claims_status CHECK (status IN ('pending', 'confirmed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS purchase_claims_client_product_uidx
  ON public.purchase_claims (mindbody_site_client_id, product_key);

ALTER TABLE public.purchase_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage purchase_claims" ON public.purchase_claims;
CREATE POLICY "Service role can manage purchase_claims"
  ON public.purchase_claims
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_claims TO service_role;
