-- Generic analytics events table for granular product tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  page_path text,
  article_id uuid,
  user_id uuid,
  session_id text,
  visitor_id text,
  referrer text,
  device_type text,
  source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time
  ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_article
  ON public.analytics_events (article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path
  ON public.analytics_events (page_path);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can record an event" ON public.analytics_events;
CREATE POLICY "Anyone can record an event"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Editors and admins can read events" ON public.analytics_events;
CREATE POLICY "Editors and admins can read events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'head_admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
  );