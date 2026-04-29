-- Booking-level crew request fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS crew_request_type text NOT NULL DEFAULT 'videographer_only',
  ADD COLUMN IF NOT EXISTS crew_price_modifier numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_assignment_locked boolean NOT NULL DEFAULT true;

-- Service-level allowed crew packages
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS available_crew_packages text[] NOT NULL DEFAULT ARRAY['videographer_only','small_crew','full_crew']::text[],
  ADD COLUMN IF NOT EXISTS default_crew_package text NOT NULL DEFAULT 'videographer_only';

-- Crew assignment slots (one row per crew slot per booking)
CREATE TABLE IF NOT EXISTS public.crew_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  role_label text NOT NULL,
  call_time time,
  pay_rate numeric,
  status text NOT NULL DEFAULT 'pending', -- pending|confirmed|declined|replaced
  is_backup boolean NOT NULL DEFAULT false,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_crew_assignments_booking ON public.crew_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_crew_assignments_staff ON public.crew_assignments(staff_id);

ALTER TABLE public.crew_assignments ENABLE ROW LEVEL SECURITY;

-- Admins, head admins, editors, booking managers full control
CREATE POLICY "Booking team manage crew assignments"
ON public.crew_assignments FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR has_role(auth.uid(), 'booking_manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR has_role(auth.uid(), 'booking_manager'::app_role)
);

-- Crew can view their own assigned slots
CREATE POLICY "Crew view own assignments"
ON public.crew_assignments FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = crew_assignments.staff_id AND s.user_id = auth.uid())
);

-- Crew can update only their own slot's status field via this policy
CREATE POLICY "Crew respond on own assignment"
ON public.crew_assignments FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = crew_assignments.staff_id AND s.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = crew_assignments.staff_id AND s.user_id = auth.uid())
);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_crew_assignments_updated_at ON public.crew_assignments;
CREATE TRIGGER trg_crew_assignments_updated_at
BEFORE UPDATE ON public.crew_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();