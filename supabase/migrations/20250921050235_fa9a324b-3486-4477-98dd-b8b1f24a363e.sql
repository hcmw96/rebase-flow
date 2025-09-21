INSERT INTO public.user_roles (user_id, role) 
VALUES ('70b47523-9b06-44b5-97b3-cb0290d5ed58', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;