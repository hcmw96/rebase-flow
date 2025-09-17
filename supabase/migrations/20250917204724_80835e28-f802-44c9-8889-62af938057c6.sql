-- Fix RLS policies to allow demo mode access to services
-- Update services policies to allow unauthenticated users to view services (for demo mode)
DROP POLICY IF EXISTS "Staff can view services" ON public.services;

-- Create a new policy that allows viewing services for authenticated users OR demo mode
CREATE POLICY "Allow viewing services for staff and demo" 
ON public.services 
FOR SELECT 
USING (
  -- Allow if user has proper role (normal mode)
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'receptionist'::app_role, 'practitioner'::app_role])
  OR 
  -- Allow if no auth (demo mode)
  auth.uid() IS NULL
);