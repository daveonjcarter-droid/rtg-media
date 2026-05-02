-- Add service_type + service_details to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS service_details jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON public.bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_service_details_gin ON public.bookings USING gin (service_details);

-- Best-effort backfill from existing free-text fields
UPDATE public.bookings
SET service_type = CASE
  WHEN service_type IS NOT NULL AND length(service_type) > 0 THEN service_type
  WHEN lower(coalesce(service,'') || ' ' || coalesce(project_type,'')) ~ 'music\s*video|mv\b' THEN 'music_video'
  WHEN lower(coalesce(service,'') || ' ' || coalesce(project_type,'')) ~ 'photo|portrait|headshot|fashion|product shoot' THEN 'photography'
  WHEN lower(coalesce(service,'') || ' ' || coalesce(project_type,'')) ~ 'film|production|short|feature|narrative' THEN 'film_production'
  WHEN lower(coalesce(service,'') || ' ' || coalesce(project_type,'')) ~ 'edit|post[- ]?prod|color\s*grade' THEN 'editing'
  WHEN lower(coalesce(service,'') || ' ' || coalesce(project_type,'')) ~ 'event|wedding|coverage|live' THEN 'event_coverage'
  WHEN lower(coalesce(service,'') || ' ' || coalesce(project_type,'')) ~ 'creative\s*direction|art direction|consult' THEN 'creative_direction'
  ELSE 'custom'
END
WHERE service_type IS NULL;

-- Mild constraint: keep service_type within known values (allow new ones via app code, this is just a soft guardrail)
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_service_type_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_service_type_check
  CHECK (service_type IS NULL OR service_type IN (
    'music_video','photography','film_production','editing','event_coverage','creative_direction','custom'
  ));