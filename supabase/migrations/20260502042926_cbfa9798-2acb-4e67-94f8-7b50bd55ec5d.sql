-- Calendar event types
DO $$ BEGIN
  CREATE TYPE public.calendar_event_type AS ENUM (
    'shoot', 'interview', 'article_deadline', 'edit_deadline',
    'client_booking', 'team_meeting', 'release_date', 'content_drop', 'personal_block'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.calendar_event_status AS ENUM ('scheduled', 'completed', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.calendar_related_type AS ENUM ('article', 'booking', 'project', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type public.calendar_event_type NOT NULL DEFAULT 'team_meeting',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  description TEXT,
  assigned_user_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  related_type public.calendar_related_type NOT NULL DEFAULT 'none',
  related_id UUID,
  status public.calendar_event_status NOT NULL DEFAULT 'scheduled',
  color TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON public.calendar_events (start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end ON public.calendar_events (end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON public.calendar_events (created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned ON public.calendar_events USING GIN (assigned_user_ids);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Helper: ops team can manage everything
CREATE OR REPLACE FUNCTION public.is_calendar_ops(_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_uid, 'head_admin')
      OR public.has_role(_uid, 'admin')
      OR public.has_role(_uid, 'owner')
      OR public.has_role(_uid, 'co_ceo')
      OR public.has_role(_uid, 'editor')
      OR public.has_role(_uid, 'booking_manager');
$$;

-- SELECT: ops team OR you created it OR you're assigned
CREATE POLICY "calendar_events read"
ON public.calendar_events FOR SELECT
TO authenticated
USING (
  public.is_calendar_ops(auth.uid())
  OR created_by = auth.uid()
  OR auth.uid() = ANY (assigned_user_ids)
);

-- INSERT: any signed-in user can create (must set self as creator)
CREATE POLICY "calendar_events insert"
ON public.calendar_events FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- UPDATE: ops team or creator
CREATE POLICY "calendar_events update"
ON public.calendar_events FOR UPDATE
TO authenticated
USING (public.is_calendar_ops(auth.uid()) OR created_by = auth.uid())
WITH CHECK (public.is_calendar_ops(auth.uid()) OR created_by = auth.uid());

-- DELETE: ops team or creator
CREATE POLICY "calendar_events delete"
ON public.calendar_events FOR DELETE
TO authenticated
USING (public.is_calendar_ops(auth.uid()) OR created_by = auth.uid());

-- Updated-at trigger
DROP TRIGGER IF EXISTS trg_calendar_events_updated ON public.calendar_events;
CREATE TRIGGER trg_calendar_events_updated
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create event when booking moves to "approved" with a project_date
CREATE OR REPLACE FUNCTION public.create_event_for_approved_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_ts TIMESTAMPTZ;
  end_ts TIMESTAMPTZ;
  assignees UUID[] := '{}'::UUID[];
  staff_user UUID;
BEGIN
  IF NEW.status::text = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) AND NEW.project_date IS NOT NULL THEN
    -- Skip if a calendar event already references this booking
    IF EXISTS (SELECT 1 FROM public.calendar_events
               WHERE related_type = 'booking' AND related_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    start_ts := (NEW.project_date::TIMESTAMP + COALESCE(NEW.project_time, '10:00:00'::TIME)) AT TIME ZONE 'UTC';
    end_ts := start_ts + INTERVAL '2 hours';

    -- Pull assigned staff's user_id if any
    IF NEW.assigned_staff_id IS NOT NULL THEN
      SELECT s.user_id INTO staff_user FROM public.staff_profiles s WHERE s.id = NEW.assigned_staff_id;
      IF staff_user IS NOT NULL THEN
        assignees := ARRAY[staff_user];
      END IF;
    END IF;

    INSERT INTO public.calendar_events (
      title, type, start_time, end_time, location, description,
      assigned_user_ids, related_type, related_id, status, created_by
    ) VALUES (
      COALESCE(NEW.project_type, 'Client Booking') || ' — ' || COALESCE(NEW.name, 'Client'),
      'client_booking',
      start_ts, end_ts,
      NEW.location_detail,
      NEW.description,
      assignees,
      'booking', NEW.id,
      'scheduled',
      COALESCE(NEW.assigned_staff_id, NEW.requested_staff_id, gen_random_uuid())
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_to_calendar ON public.bookings;
CREATE TRIGGER trg_booking_to_calendar
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.create_event_for_approved_booking();