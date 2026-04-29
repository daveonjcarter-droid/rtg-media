
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_timezone text,
  ADD COLUMN IF NOT EXISTS featured_until date,
  ADD COLUMN IF NOT EXISTS game_title text,
  ADD COLUMN IF NOT EXISTS game_developer text,
  ADD COLUMN IF NOT EXISTS game_publisher text,
  ADD COLUMN IF NOT EXISTS game_release_date date,
  ADD COLUMN IF NOT EXISTS game_platforms text,
  ADD COLUMN IF NOT EXISTS game_genre text,
  ADD COLUMN IF NOT EXISTS game_esrb_rating text,
  ADD COLUMN IF NOT EXISTS game_reviewer text,
  ADD COLUMN IF NOT EXISTS steam_score integer,
  ADD COLUMN IF NOT EXISTS game_trailer_url text,
  ADD COLUMN IF NOT EXISTS game_screenshots jsonb NOT NULL DEFAULT '[]'::jsonb;
