-- Add crew roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'crew';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'photographer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'videographer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'video_editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'producer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'audio_engineer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'grip_lighting';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'makeup_artist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'production_assistant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'studio_staff';