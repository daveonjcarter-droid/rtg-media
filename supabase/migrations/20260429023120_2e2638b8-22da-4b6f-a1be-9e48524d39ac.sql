ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS project_type text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS instagram text;