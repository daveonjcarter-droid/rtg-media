CREATE OR REPLACE FUNCTION public.sync_booking_calendar_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_ts TIMESTAMPTZ;
  end_ts   TIMESTAMPTZ;
  assignees UUID[] := '{}'::UUID[];
  staff_user UUID;
  existing  public.calendar_events%ROWTYPE;
  ev_status calendar_event_status;
  ev_title  text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status::text = 'declined' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE public.calendar_events
       SET status = 'canceled'::calendar_event_status, updated_at = now()
     WHERE related_type = 'booking' AND related_id = NEW.id;
    RETURN NEW;
  END IF;

  IF NEW.project_date IS NULL THEN
    RETURN NEW;
  END IF;

  start_ts := (NEW.project_date::TIMESTAMP + COALESCE(NEW.project_time, '10:00:00'::TIME)) AT TIME ZONE 'UTC';
  end_ts   := start_ts + INTERVAL '2 hours';

  IF NEW.assigned_staff_id IS NOT NULL THEN
    SELECT s.user_id INTO staff_user FROM public.staff_profiles s WHERE s.id = NEW.assigned_staff_id;
    IF staff_user IS NOT NULL THEN
      assignees := ARRAY[staff_user];
    END IF;
  END IF;

  ev_status := CASE WHEN NEW.status::text = 'completed' THEN 'completed'
                    ELSE 'scheduled' END::calendar_event_status;

  ev_title := COALESCE(NEW.service_type, NEW.project_type, 'Client Booking') || ' — ' || COALESCE(NEW.name, 'Client');

  SELECT * INTO existing FROM public.calendar_events
   WHERE related_type = 'booking' AND related_id = NEW.id
   LIMIT 1;

  IF existing.id IS NULL THEN
    INSERT INTO public.calendar_events (
      title, type, start_time, end_time, location, description,
      assigned_user_ids, related_type, related_id, status, created_by
    ) VALUES (
      ev_title, 'client_booking', start_ts, end_ts,
      NEW.location_detail, NEW.description,
      assignees, 'booking', NEW.id, ev_status,
      COALESCE(NEW.assigned_staff_id, NEW.requested_staff_id, gen_random_uuid())
    );
  ELSE
    UPDATE public.calendar_events
       SET title = ev_title,
           start_time = start_ts,
           end_time = end_ts,
           location = NEW.location_detail,
           description = NEW.description,
           assigned_user_ids = CASE WHEN array_length(assignees,1) IS NULL THEN existing.assigned_user_ids ELSE assignees END,
           status = ev_status,
           updated_at = now()
     WHERE id = existing.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_to_calendar ON public.bookings;
DROP TRIGGER IF EXISTS trg_booking_sync_calendar_ins ON public.bookings;
DROP TRIGGER IF EXISTS trg_booking_sync_calendar_upd ON public.bookings;

CREATE TRIGGER trg_booking_sync_calendar_ins
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_calendar_event();

CREATE TRIGGER trg_booking_sync_calendar_upd
AFTER UPDATE OF project_date, project_time, status, assigned_staff_id, location_detail, description
ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_calendar_event();

INSERT INTO public.calendar_events (
  title, type, start_time, end_time, location, description,
  assigned_user_ids, related_type, related_id, status, created_by
)
SELECT
  COALESCE(b.service_type, b.project_type, 'Client Booking') || ' — ' || COALESCE(b.name, 'Client'),
  'client_booking',
  (b.project_date::timestamp + COALESCE(b.project_time, '10:00:00'::time)) AT TIME ZONE 'UTC',
  (b.project_date::timestamp + COALESCE(b.project_time, '10:00:00'::time)) AT TIME ZONE 'UTC' + INTERVAL '2 hours',
  b.location_detail,
  b.description,
  CASE WHEN sp.user_id IS NOT NULL THEN ARRAY[sp.user_id] ELSE '{}'::uuid[] END,
  'booking',
  b.id,
  CASE WHEN b.status::text = 'completed' THEN 'completed'::calendar_event_status
       WHEN b.status::text = 'declined'  THEN 'canceled'::calendar_event_status
       ELSE 'scheduled'::calendar_event_status END,
  COALESCE(b.assigned_staff_id, b.requested_staff_id, gen_random_uuid())
FROM public.bookings b
LEFT JOIN public.staff_profiles sp ON sp.id = b.assigned_staff_id
WHERE b.project_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.calendar_events ce
     WHERE ce.related_type = 'booking' AND ce.related_id = b.id
  );