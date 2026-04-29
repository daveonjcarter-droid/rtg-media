-- Role permissions table for per-role toggles
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL UNIQUE,
  editor_can_publish boolean NOT NULL DEFAULT true,
  writer_can_edit_published boolean NOT NULL DEFAULT false,
  social_can_autopost boolean NOT NULL DEFAULT false,
  booking_can_override_availability boolean NOT NULL DEFAULT false,
  media_can_delete boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read role permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Head admins can insert role permissions"
  ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'head_admin'::app_role));

CREATE POLICY "Head admins can update role permissions"
  ON public.role_permissions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'head_admin'::app_role));

CREATE POLICY "Head admins can delete role permissions"
  ON public.role_permissions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'head_admin'::app_role));

-- Seed defaults
INSERT INTO public.role_permissions (role) VALUES
  ('head_admin'),('admin'),('editor'),('writer'),('social_manager'),('booking_manager'),('media_manager')
ON CONFLICT (role) DO NOTHING;

-- Staff profile upgrades
ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS production_position text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS travel_radius_miles integer,
  ADD COLUMN IF NOT EXISTS preferred_service_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

-- Bookings: assignment priority flag for queue
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS assignment_priority text NOT NULL DEFAULT 'normal';

CREATE TRIGGER set_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
