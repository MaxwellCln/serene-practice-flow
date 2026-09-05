REVOKE EXECUTE ON FUNCTION public.accept_admin_invite(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_admin_invite(text, text, timestamptz) FROM anon;