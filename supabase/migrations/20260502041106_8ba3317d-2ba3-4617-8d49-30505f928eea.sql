ALTER TABLE public.admin_invites
  ADD COLUMN IF NOT EXISTS email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_error text;