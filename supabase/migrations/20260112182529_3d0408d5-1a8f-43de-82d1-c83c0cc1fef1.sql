-- Mindbody OAuth sessions + booking records (separate from legacy CRM bookings table)

-- Rename legacy CRM bookings if present so we can use `bookings` for Mindbody records
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.bookings RENAME TO spa_bookings;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.mb_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mindbody_client_id TEXT NOT NULL,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(mindbody_client_id)
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.mb_sessions(id) ON DELETE CASCADE NOT NULL,
    mindbody_appointment_id TEXT,
    mindbody_class_id TEXT,
    service_name TEXT NOT NULL,
    service_id TEXT,
    staff_name TEXT,
    location_name TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'confirmed',
    booking_type TEXT NOT NULL DEFAULT 'appointment',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    CONSTRAINT valid_booking_type CHECK (booking_type IN ('appointment', 'class'))
);

ALTER TABLE public.mb_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mb_sessions_mindbody_client_id ON public.mb_sessions(mindbody_client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session_id ON public.bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON public.bookings(start_time);

DROP POLICY IF EXISTS "Service role can manage mb_sessions" ON public.mb_sessions;
CREATE POLICY "Service role can manage mb_sessions"
ON public.mb_sessions
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage bookings" ON public.bookings;
CREATE POLICY "Service role can manage bookings"
ON public.bookings
FOR ALL
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_mb_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_mb_sessions_updated_at ON public.mb_sessions;
CREATE TRIGGER update_mb_sessions_updated_at
BEFORE UPDATE ON public.mb_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_mb_sessions_updated_at();
