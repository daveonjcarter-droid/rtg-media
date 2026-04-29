-- Extend article_type enum
ALTER TYPE public.article_type ADD VALUE IF NOT EXISTS 'album_review';
ALTER TYPE public.article_type ADD VALUE IF NOT EXISTS 'single_review';

ALTER TABLE public.articles
  -- generic
  ADD COLUMN IF NOT EXISTS writer_name text,
  -- album / single
  ADD COLUMN IF NOT EXISTS music_artist text,
  ADD COLUMN IF NOT EXISTS music_album_title text,
  ADD COLUMN IF NOT EXISTS music_song_title text,
  ADD COLUMN IF NOT EXISTS music_label text,
  ADD COLUMN IF NOT EXISTS music_release_date date,
  ADD COLUMN IF NOT EXISTS music_genre text,
  ADD COLUMN IF NOT EXISTS music_runtime text,
  ADD COLUMN IF NOT EXISTS music_track_count integer,
  ADD COLUMN IF NOT EXISTS music_producer text,
  ADD COLUMN IF NOT EXISTS music_embed_url text,
  ADD COLUMN IF NOT EXISTS music_tracklist jsonb DEFAULT '[]'::jsonb,
  -- interview
  ADD COLUMN IF NOT EXISTS interview_interviewee text,
  ADD COLUMN IF NOT EXISTS interview_role text,
  ADD COLUMN IF NOT EXISTS interview_date date,
  ADD COLUMN IF NOT EXISTS interview_location text,
  ADD COLUMN IF NOT EXISTS interview_photographer text,
  -- breakdown
  ADD COLUMN IF NOT EXISTS breakdown_subject text,
  ADD COLUMN IF NOT EXISTS breakdown_category text,
  ADD COLUMN IF NOT EXISTS breakdown_episode text,
  ADD COLUMN IF NOT EXISTS breakdown_spoiler boolean NOT NULL DEFAULT false,
  -- news
  ADD COLUMN IF NOT EXISTS news_subheadline text,
  ADD COLUMN IF NOT EXISTS news_source text,
  ADD COLUMN IF NOT EXISTS news_date date,
  ADD COLUMN IF NOT EXISTS news_location text;