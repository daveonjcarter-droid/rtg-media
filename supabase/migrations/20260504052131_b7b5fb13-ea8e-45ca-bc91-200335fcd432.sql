-- Helper: project_manager-or-higher operator
CREATE OR REPLACE FUNCTION public.is_pm_or_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_uid, 'head_admin')
      OR public.has_role(_uid, 'admin')
      OR public.has_role(_uid, 'owner')
      OR public.has_role(_uid, 'co_ceo')
      OR public.has_role(_uid, 'editor')
      OR public.has_role(_uid, 'project_manager');
$$;

-- BOOKINGS: allow project_manager to read, update, assign (no delete)
DROP POLICY IF EXISTS "Booking team can read bookings" ON public.bookings;
CREATE POLICY "Booking team can read bookings" ON public.bookings
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin')
  OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'co_ceo')
  OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'booking_manager')
  OR has_role(auth.uid(),'project_manager')
);

DROP POLICY IF EXISTS "Booking team can update bookings" ON public.bookings;
CREATE POLICY "Booking team can update bookings" ON public.bookings
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin')
  OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'co_ceo')
  OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'booking_manager')
  OR has_role(auth.uid(),'project_manager')
);

-- LEADS: allow PM
DROP POLICY IF EXISTS "Booking team can read leads" ON public.leads;
CREATE POLICY "Booking team can read leads" ON public.leads
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin')
  OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'booking_manager')
  OR has_role(auth.uid(),'project_manager')
);
DROP POLICY IF EXISTS "Booking team can update leads" ON public.leads;
CREATE POLICY "Booking team can update leads" ON public.leads
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin')
  OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'booking_manager')
  OR has_role(auth.uid(),'project_manager')
);

-- CREW ASSIGNMENTS: allow PM to manage
DROP POLICY IF EXISTS "Booking team manage crew assignments" ON public.crew_assignments;
CREATE POLICY "Booking team manage crew assignments" ON public.crew_assignments
FOR ALL TO authenticated
USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin')
  OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'booking_manager')
  OR has_role(auth.uid(),'project_manager')
)
WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin')
  OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'booking_manager')
  OR has_role(auth.uid(),'project_manager')
);

-- CALENDAR_EVENTS: extend is_calendar_ops to include project_manager
CREATE OR REPLACE FUNCTION public.is_calendar_ops(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_uid, 'head_admin')
      OR public.has_role(_uid, 'admin')
      OR public.has_role(_uid, 'owner')
      OR public.has_role(_uid, 'co_ceo')
      OR public.has_role(_uid, 'editor')
      OR public.has_role(_uid, 'booking_manager')
      OR public.has_role(_uid, 'project_manager');
$$;

-- ARTICLES (drafts): allow PM to update non-published drafts
DROP POLICY IF EXISTS "PM can read drafts" ON public.articles;
CREATE POLICY "PM can read drafts" ON public.articles
FOR SELECT TO authenticated
USING (has_role(auth.uid(),'project_manager'));

DROP POLICY IF EXISTS "PM can update drafts" ON public.articles;
CREATE POLICY "PM can update drafts" ON public.articles
FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'project_manager') AND status <> 'published')
WITH CHECK (has_role(auth.uid(),'project_manager'));

-- Ensure audit triggers exist on user_roles & profile_meta (already present per check).
-- Add audit trigger on leads if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trg_audit_leads') THEN
    CREATE TRIGGER trg_audit_leads
      AFTER INSERT OR UPDATE OR DELETE ON public.leads
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_capture();
  END IF;
END $$;