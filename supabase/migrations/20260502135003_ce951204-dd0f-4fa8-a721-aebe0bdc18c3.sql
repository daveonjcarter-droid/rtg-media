-- Extend availability with notes + accepting_bookings
ALTER TABLE public.staff_availability
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS accepting_bookings boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS availability_notes text,
  ADD COLUMN IF NOT EXISTS availability_updated_at timestamptz;

-- Trigger to bump availability_updated_at when staff_availability changes
CREATE OR REPLACE FUNCTION public.touch_staff_availability_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid uuid;
BEGIN
  sid := COALESCE(NEW.staff_id, OLD.staff_id);
  UPDATE public.staff_profiles SET availability_updated_at = now() WHERE id = sid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_avail_updated ON public.staff_availability;
CREATE TRIGGER trg_touch_avail_updated
AFTER INSERT OR UPDATE OR DELETE ON public.staff_availability
FOR EACH ROW EXECUTE FUNCTION public.touch_staff_availability_updated();

DROP TRIGGER IF EXISTS trg_touch_blackouts_updated ON public.staff_blackouts;
CREATE TRIGGER trg_touch_blackouts_updated
AFTER INSERT OR UPDATE OR DELETE ON public.staff_blackouts
FOR EACH ROW EXECUTE FUNCTION public.touch_staff_availability_updated();
