-- Mindbody no longer returns refresh_token without offline_access scope.
ALTER TABLE public.mb_sessions
  ALTER COLUMN refresh_token DROP NOT NULL;
