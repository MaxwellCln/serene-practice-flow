CREATE TABLE public.practice_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  notification_email text NOT NULL DEFAULT '',
  meeting_link text NOT NULL DEFAULT '',
  meeting_note text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.practice_settings TO authenticated;
GRANT ALL ON public.practice_settings TO service_role;

ALTER TABLE public.practice_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage practice settings"
ON public.practice_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER practice_settings_set_updated_at
BEFORE UPDATE ON public.practice_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.practice_settings (id) VALUES (true);

ALTER TABLE public.services ADD COLUMN is_online boolean NOT NULL DEFAULT false;