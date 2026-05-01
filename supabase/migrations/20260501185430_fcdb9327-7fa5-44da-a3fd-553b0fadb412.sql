
-- 1) Extend app_role enum with leadership/creative roles requested
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'co_ceo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'journalist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'designer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'intern';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
