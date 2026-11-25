CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_title text NOT NULL,
  title text NOT NULL,
  author text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources are public" ON public.resources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage resources" ON public.resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  format text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workshops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workshops are public" ON public.workshops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage workshops" ON public.workshops FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.resources (group_title,title,author,note,url,sort_order) VALUES
('Anxiety & the nervous system','When the Body Says No','Gabor Maté','On stress, boundaries and the body.',NULL,1),
('Anxiety & the nervous system','Unwinding Anxiety','Judson Brewer','Practical, kind and habit-focused.',NULL,2),
('Grief & change','The Year of Magical Thinking','Joan Didion','Grief, told plainly.',NULL,3),
('Grief & change','Transitions','William Bridges','Useful when a life stage is ending.',NULL,4),
('Support in Ireland','Samaritans — 116 123','Free, 24 hours','For any moment that feels too much.','https://www.samaritans.org/ireland/',5),
('Support in Ireland','IAHIP.ie','Irish Association of Humanistic & Integrative Psychotherapy','Find an accredited therapist.','https://iahip.org',6);

INSERT INTO public.workshops (title,format,body,sort_order) VALUES
('Burnout at work','90 minutes · online','For teams noticing exhaustion and slipping boundaries. What burnout actually is, and what helps.',1),
('Supporting an anxious colleague or friend','Half day · online','How to listen well, when to worry, and how to hold your own limits while helping.',2),
('Talks & training groups','By arrangement','Guest lectures and CPD sessions for trainee therapists, schools and community organisations.',3);