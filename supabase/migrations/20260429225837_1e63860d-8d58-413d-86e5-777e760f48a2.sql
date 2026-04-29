ALTER TABLE public.invited_users
  ADD COLUMN IF NOT EXISTS invite_type text NOT NULL DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS default_rate numeric,
  ADD COLUMN IF NOT EXISTS portfolio_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS availability_required boolean NOT NULL DEFAULT false;