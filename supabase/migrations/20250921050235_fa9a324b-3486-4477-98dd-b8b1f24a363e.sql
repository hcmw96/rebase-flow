-- Only seed admin role if that user exists (fresh projects may not have this user yet)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE u.id = '70b47523-9b06-44b5-97b3-cb0290d5ed58'
ON CONFLICT (user_id, role) DO NOTHING;