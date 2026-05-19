ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_idempotency_key_uidx
  ON public.bookings (idempotency_key)
  WHERE idempotency_key IS NOT NULL;