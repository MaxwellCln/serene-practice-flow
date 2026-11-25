DROP POLICY IF EXISTS "Weekly times are publicly readable" ON public.weekly_availability;
DROP POLICY IF EXISTS "Resources are public" ON public.resources;
DROP POLICY IF EXISTS "Workshops are public" ON public.workshops;
REVOKE SELECT ON public.weekly_availability FROM anon;
REVOKE SELECT ON public.resources FROM anon;
REVOKE SELECT ON public.workshops FROM anon;