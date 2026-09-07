CREATE TABLE public.availability_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamptz NOT NULL UNIQUE,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.availability_extras TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_extras TO authenticated;
GRANT ALL ON public.availability_extras TO service_role;

ALTER TABLE public.availability_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Extra times are publicly viewable"
  ON public.availability_extras FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage extra times"
  ON public.availability_extras FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX availability_extras_starts_at_idx ON public.availability_extras (starts_at);