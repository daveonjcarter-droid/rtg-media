-- 1) Simplify handle_new_user: ONLY insert into profiles. No role assignment, no email-based logic.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  ON CONFLICT (id) DO UPDATE
    SET display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
        updated_at = now();
  RETURN new;
END;
$function$;

-- 2) Broaden user_roles write policies to allow head_admin, owner, co_ceo, admin
DROP POLICY IF EXISTS "Only head admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only head admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only head admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

CREATE POLICY "Privileged admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'head_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'co_ceo')
);

CREATE POLICY "Privileged admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'head_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'co_ceo')
)
WITH CHECK (
  public.has_role(auth.uid(), 'head_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'co_ceo')
);

CREATE POLICY "Privileged admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'head_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'co_ceo')
);

-- 3) Sync confirmed bookings to calendar_events
CREATE OR REPLACE FUNCTION public.sync_booking_to_calendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  start_ts timestamptz;
  end_ts timestamptz;
  evt_title text;
BEGIN
  IF NEW.project_date IS NULL THEN
    RETURN NEW;
  END IF;

  start_ts := (NEW.project_date::timestamp + COALESCE(NEW.project_time, '10:00'::time)) AT TIME ZONE 'UTC';
  end_ts := start_ts + INTERVAL '2 hours';
  evt_title := COALESCE(NEW.service, 'Booking') || ' — ' || COALESCE(NEW.name, 'Client');

  INSERT INTO public.calendar_events (
    title, type, start_time, end_time, related_type, related_id, created_by, status
  )
  VALUES (
    evt_title,
    'client_booking',
    start_ts,
    end_ts,
    'booking',
    NEW.id,
    COALESCE(NEW.assigned_staff_id, NEW.requested_staff_id, auth.uid()),
    'scheduled'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_booking_to_calendar_trg ON public.bookings;
CREATE TRIGGER sync_booking_to_calendar_trg
AFTER UPDATE ON public.bookings
FOR EACH ROW
WHEN (NEW.status = 'booked' AND (OLD.status IS DISTINCT FROM 'booked'))
EXECUTE FUNCTION public.sync_booking_to_calendar();