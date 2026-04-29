-- Article type enum
DO $$ BEGIN
  CREATE TYPE public.article_type AS ENUM ('standard','film_review','interview','opinion','breakdown','news');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Verdict enum
DO $$ BEGIN
  CREATE TYPE public.film_verdict AS ENUM ('recommended','mixed','not_recommended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS article_type public.article_type NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS body_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Film metadata
  ADD COLUMN IF NOT EXISTS film_title text,
  ADD COLUMN IF NOT EXISTS film_release_date date,
  ADD COLUMN IF NOT EXISTS film_runtime text,
  ADD COLUMN IF NOT EXISTS film_director text,
  ADD COLUMN IF NOT EXISTS film_studio text,
  ADD COLUMN IF NOT EXISTS film_genre text,
  ADD COLUMN IF NOT EXISTS film_mpaa_rating text,
  ADD COLUMN IF NOT EXISTS film_reviewer text,
  ADD COLUMN IF NOT EXISTS film_review_date date,
  -- Ratings
  ADD COLUMN IF NOT EXISTS rtg_rating numeric(2,1) CHECK (rtg_rating IS NULL OR (rtg_rating >= 0 AND rtg_rating <= 5)),
  ADD COLUMN IF NOT EXISTS audience_score integer CHECK (audience_score IS NULL OR (audience_score >= 0 AND audience_score <= 100)),
  ADD COLUMN IF NOT EXISTS rotten_tomatoes_score integer CHECK (rotten_tomatoes_score IS NULL OR (rotten_tomatoes_score >= 0 AND rotten_tomatoes_score <= 100)),
  ADD COLUMN IF NOT EXISTS metacritic_score integer CHECK (metacritic_score IS NULL OR (metacritic_score >= 0 AND metacritic_score <= 100)),
  ADD COLUMN IF NOT EXISTS imdb_score numeric(3,1) CHECK (imdb_score IS NULL OR (imdb_score >= 0 AND imdb_score <= 10)),
  ADD COLUMN IF NOT EXISTS is_official_rtg_review boolean NOT NULL DEFAULT false,
  -- Verdict
  ADD COLUMN IF NOT EXISTS verdict_headline text,
  ADD COLUMN IF NOT EXISTS verdict_paragraph text,
  ADD COLUMN IF NOT EXISTS verdict_recommendation public.film_verdict;

CREATE INDEX IF NOT EXISTS idx_articles_article_type ON public.articles(article_type);