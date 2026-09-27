CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  video_url text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts are public" ON public.blog_posts FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER blog_posts_set_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX blog_posts_published_idx ON public.blog_posts (is_published, published_at DESC);

INSERT INTO public.blog_posts (slug, title, excerpt, body, is_published, published_at) VALUES
('starting-therapy', 'Starting therapy: what the first session is really like',
 'Most people arrive a little nervous and leave a little lighter. Here''s what actually happens when we first sit down together.',
 E'Almost everyone who comes to therapy for the first time tells me they nearly didn''t. The most common worry is simple: not knowing what to say. The good news is that you don''t need to prepare anything. The first session is mostly me listening, and you talking about whatever feels most present.\n\nWe''ll cover some practical things — confidentiality, how often we might meet, what you''d like to be different — but there''s no test and no right way to do it. Some people talk for the whole hour; others sit quietly for a while first. Both are completely fine.\n\nIf you''re weighing it up, a free 15-minute call is a gentle place to start. You can ask anything, and there''s no obligation to book.',
 true, '2026-09-20'),
('grief-has-no-timeline', 'Grief has no timeline',
 'Well-meaning people often ask if you''re ''over it yet''. Grief doesn''t work that way — and it doesn''t need to.',
 E'One of the most painful things grieving people tell me is the sense that they''re taking too long. Friends mean well, but after a few months the invitations to talk about it quietly stop, and the bereaved person can feel they''re supposed to be finished.\n\nGrief isn''t a task to complete. It''s a relationship continuing in a new form, and it moves at its own pace — sometimes quiet for weeks, then suddenly very present again on an ordinary Tuesday.\n\nTherapy offers a place where you don''t have to be ''doing better'' for anyone. We make room for the loss exactly as it is, and find ways to carry it that let the rest of life keep growing around it.',
 true, '2026-09-13'),
('anxiety-and-the-body', 'Anxiety lives in the body, not just the mind',
 'Racing heart, tight chest, restless sleep — anxiety is a physical experience. Understanding that changes how we work with it.',
 E'People often describe anxiety as a thinking problem: too many worries, too much rumination. But anxiety is also deeply physical. The racing heart, the shallow breath, the stomach in knots — these are your nervous system doing its ancient job of trying to protect you.\n\nThat''s why simply telling yourself to ''calm down'' rarely works, and why our work together involves the body as much as the conversation. Slowing the breath, noticing where tension sits, and gently widening your window of tolerance all help the mind follow.\n\nIf panic attacks or constant worry are part of your life, you''re not broken and you''re not alone. It''s one of the most common reasons people come to see me, and it responds well to support.',
 true, '2026-09-06');