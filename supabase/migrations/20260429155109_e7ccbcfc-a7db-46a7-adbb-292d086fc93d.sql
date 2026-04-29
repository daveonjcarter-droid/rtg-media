-- 1) Extend the app_role enum (cannot ADD VALUE inside a tx with usage; do plain ALTERs)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'booking_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'media_manager';