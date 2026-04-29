
-- Extend article_status with scheduled + archived
ALTER TYPE public.article_status ADD VALUE IF NOT EXISTS 'scheduled';
ALTER TYPE public.article_status ADD VALUE IF NOT EXISTS 'archived';

-- Extend article_type with game_review
ALTER TYPE public.article_type ADD VALUE IF NOT EXISTS 'game_review';
