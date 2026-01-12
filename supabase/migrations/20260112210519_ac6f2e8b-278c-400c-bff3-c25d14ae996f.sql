-- Allow anon users to insert hidden_services
CREATE POLICY "Anon users can insert hidden_services"
ON public.hidden_services
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to delete hidden_services  
CREATE POLICY "Anon users can delete hidden_services"
ON public.hidden_services
FOR DELETE
TO anon
USING (true);

-- Allow authenticated users to insert hidden_services
CREATE POLICY "Authenticated users can insert hidden_services"
ON public.hidden_services
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to delete hidden_services
CREATE POLICY "Authenticated users can delete hidden_services"
ON public.hidden_services
FOR DELETE
TO authenticated
USING (true);