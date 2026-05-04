-- 1) Add project_manager role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';