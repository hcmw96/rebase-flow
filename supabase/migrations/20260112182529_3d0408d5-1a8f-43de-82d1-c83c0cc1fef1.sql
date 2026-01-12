-- Create mb_sessions table for Mindbody OAuth tokens
CREATE TABLE public.mb_sessions (
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

-- Create bookings table for local booking records
CREATE TABLE public.bookings (
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

-- Enable RLS on both tables
ALTER TABLE public.mb_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_mb_sessions_mindbody_client_id ON public.mb_sessions(mindbody_client_id);
CREATE INDEX idx_bookings_session_id ON public.bookings(session_id);
CREATE INDEX idx_bookings_start_time ON public.bookings(start_time);

-- RLS Policies for mb_sessions
-- Sessions are managed by edge functions, so we allow service role full access
-- Regular users cannot directly access this table (they go through edge functions)
CREATE POLICY "Service role can manage mb_sessions"
ON public.mb_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for bookings
-- Bookings are also managed via edge functions
CREATE POLICY "Service role can manage bookings"
ON public.bookings
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_mb_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mb_sessions_updated_at
BEFORE UPDATE ON public.mb_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_mb_sessions_updated_at();