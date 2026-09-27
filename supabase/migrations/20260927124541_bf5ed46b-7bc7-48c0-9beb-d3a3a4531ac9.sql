CREATE TABLE public.weekly_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time without time zone NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (weekday, start_time)
);
GRANT SELECT ON public.weekly_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_availability TO authenticated;
GRANT ALL ON public.weekly_availability TO service_role;
ALTER TABLE public.weekly_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weekly times are publicly readable" ON public.weekly_availability FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Only admins manage weekly times" ON public.weekly_availability FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER weekly_availability_set_updated_at BEFORE UPDATE ON public.weekly_availability FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.weekly_availability (weekday, start_time) VALUES
(1,'09:00'),(1,'10:00'),(1,'11:00'),(1,'14:00'),(1,'15:00'),(1,'16:00'),
(2,'09:00'),(2,'10:00'),(2,'11:00'),(2,'14:00'),(2,'15:00'),(2,'16:00'),
(3,'12:00'),(3,'13:00'),(3,'14:00'),(3,'15:00'),(3,'16:00'),(3,'17:00'),
(4,'09:00'),(4,'10:00'),(4,'11:00'),(4,'14:00'),(4,'15:00'),
(5,'09:00'),(5,'10:00'),(5,'11:00');
UPDATE public.services SET is_online = true,
 description = CASE slug
 WHEN 'intro-call' THEN 'A relaxed 15-minute online video call to see whether we are a good fit. No commitment.'
 WHEN 'individual-session' THEN 'A 50-minute one-to-one therapy session online.'
 WHEN 'couples-session' THEN 'An 80-minute online session for couples working through connection, conflict or change.'
 ELSE description END;