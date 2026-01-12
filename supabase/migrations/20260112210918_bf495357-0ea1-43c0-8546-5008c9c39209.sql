-- Create featured_services table for "Most Popular" section
CREATE TABLE public.featured_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id TEXT NOT NULL UNIQUE,
    service_name TEXT,
    display_order INTEGER DEFAULT 0,
    label TEXT,  -- "Bestseller", "New", "Popular"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.featured_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for featured_services
CREATE POLICY "Anyone can read featured_services"
ON public.featured_services
FOR SELECT
USING (true);

CREATE POLICY "Anon users can insert featured_services"
ON public.featured_services
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon users can delete featured_services"
ON public.featured_services
FOR DELETE
TO anon
USING (true);

CREATE POLICY "Authenticated users can insert featured_services"
ON public.featured_services
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete featured_services"
ON public.featured_services
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Anon users can update featured_services"
ON public.featured_services
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can update featured_services"
ON public.featured_services
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);