DROP POLICY IF EXISTS "Extra times are publicly viewable" ON public.availability_extras;
DROP POLICY IF EXISTS "Blocked times are publicly viewable" ON public.availability_blocks;
REVOKE SELECT ON public.availability_extras FROM anon;
REVOKE SELECT ON public.availability_blocks FROM anon;