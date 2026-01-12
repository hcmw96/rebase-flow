-- Create table to store hidden services
CREATE TABLE public.hidden_services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id TEXT NOT NULL UNIQUE,
    service_name TEXT,
    hidden_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hidden_services ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for edge functions/admin)
CREATE POLICY "Service role can manage hidden_services"
ON public.hidden_services
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read hidden services (to filter them out)
CREATE POLICY "Authenticated users can read hidden_services"
ON public.hidden_services
FOR SELECT
TO authenticated
USING (true);

-- Allow anon users to read hidden services (for public filtering)
CREATE POLICY "Anon users can read hidden_services"
ON public.hidden_services
FOR SELECT
TO anon
USING (true);