-- ============ RTG BREAKDOWN EPISODES ============
CREATE TABLE public.breakdown_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_number integer,
  title text NOT NULL DEFAULT 'Untitled Episode',
  slug text UNIQUE,
  category text NOT NULL DEFAULT 'Movies', -- Movies, TV, Anime, Comics, Music, Culture
  cover_image_url text,
  summary text,
  watch_url text,        -- video URL (YouTube, etc.)
  read_url text,         -- companion article URL or slug
  breakdown_body text,   -- the breakdown notes / writeup
  duration text,         -- e.g. "12 min"
  is_featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft', -- draft | published
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.breakdown_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published episodes are public"
  ON public.breakdown_episodes FOR SELECT
  USING (status = 'published');

CREATE POLICY "Editors and admins see all episodes"
  ON public.breakdown_episodes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors and admins can insert episodes"
  ON public.breakdown_episodes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors and admins can update episodes"
  ON public.breakdown_episodes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete episodes"
  ON public.breakdown_episodes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_breakdown_episodes_updated_at
  BEFORE UPDATE ON public.breakdown_episodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RTG PICKS ============
CREATE TABLE public.rtg_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'watching', -- watching | listening | matters
  title text NOT NULL,
  creator text,        -- artist / director / source
  note text,           -- short blurb
  link_url text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rtg_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active picks are public"
  ON public.rtg_picks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Editors and admins see all picks"
  ON public.rtg_picks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors and admins can insert picks"
  ON public.rtg_picks FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors and admins can update picks"
  ON public.rtg_picks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete picks"
  ON public.rtg_picks FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_rtg_picks_updated_at
  BEFORE UPDATE ON public.rtg_picks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CREATOR SPOTLIGHT ============
CREATE TABLE public.creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,           -- photographer, artist, director, etc.
  description text,
  image_url text,
  link_url text,       -- external profile or article link
  city text DEFAULT 'Chicago',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active creators are public"
  ON public.creators FOR SELECT
  USING (is_active = true);

CREATE POLICY "Editors and admins see all creators"
  ON public.creators FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors and admins can insert creators"
  ON public.creators FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors and admins can update creators"
  ON public.creators FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete creators"
  ON public.creators FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_creators_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CHICAGO FEED ============
CREATE TABLE public.chicago_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'event', -- event | moment | activity
  title text NOT NULL,
  detail text,
  location text,
  event_date date,
  link_url text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chicago_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active feed items are public"
  ON public.chicago_feed FOR SELECT
  USING (is_active = true);

CREATE POLICY "Editors and admins see all feed items"
  ON public.chicago_feed FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors and admins can insert feed items"
  ON public.chicago_feed FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors and admins can update feed items"
  ON public.chicago_feed FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete feed items"
  ON public.chicago_feed FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_chicago_feed_updated_at
  BEFORE UPDATE ON public.chicago_feed
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ INDEXES ============
CREATE INDEX idx_breakdown_published ON public.breakdown_episodes(status, published_at DESC);
CREATE INDEX idx_breakdown_featured ON public.breakdown_episodes(is_featured) WHERE is_featured = true;
CREATE INDEX idx_picks_kind ON public.rtg_picks(kind, sort_order);
CREATE INDEX idx_creators_active ON public.creators(is_active, sort_order);
CREATE INDEX idx_chicago_feed_date ON public.chicago_feed(event_date DESC NULLS LAST);