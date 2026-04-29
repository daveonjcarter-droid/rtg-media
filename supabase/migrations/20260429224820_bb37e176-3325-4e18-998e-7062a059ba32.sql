-- Extend staff_profiles with crew-specific fields
ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS equipment text,
  ADD COLUMN IF NOT EXISTS reel_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS hourly_rate numeric,
  ADD COLUMN IF NOT EXISTS day_rate numeric,
  ADD COLUMN IF NOT EXISTS booking_notes text,
  ADD COLUMN IF NOT EXISTS show_email_publicly boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_phone_publicly boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS is_crew boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Portfolio approval workflow
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS submitted_by uuid;

-- Booking crew response
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS crew_response_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS crew_response_notes text;

-- Allow crew (any signed-in user with their user_id on a staff_profile) to manage their own profile
DROP POLICY IF EXISTS "Crew can read own profile" ON public.staff_profiles;
CREATE POLICY "Crew can read own profile"
ON public.staff_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Crew can update own profile" ON public.staff_profiles;
CREATE POLICY "Crew can update own profile"
ON public.staff_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Crew can manage their own availability
DROP POLICY IF EXISTS "Crew manage own availability" ON public.staff_availability;
CREATE POLICY "Crew manage own availability"
ON public.staff_availability FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = staff_availability.staff_id AND s.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = staff_availability.staff_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Crew manage own blackouts" ON public.staff_blackouts;
CREATE POLICY "Crew manage own blackouts"
ON public.staff_blackouts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = staff_blackouts.staff_id AND s.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = staff_blackouts.staff_id AND s.user_id = auth.uid()));

-- Crew can manage their own portfolio items (uploads start unapproved)
DROP POLICY IF EXISTS "Crew manage own portfolio" ON public.portfolio_items;
CREATE POLICY "Crew manage own portfolio"
ON public.portfolio_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = portfolio_items.staff_id AND s.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = portfolio_items.staff_id AND s.user_id = auth.uid()));

-- Crew can view bookings assigned to them
DROP POLICY IF EXISTS "Crew view assigned bookings" ON public.bookings;
CREATE POLICY "Crew view assigned bookings"
ON public.bookings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = bookings.assigned_staff_id AND s.user_id = auth.uid()));

-- Crew can respond (accept/decline) on bookings assigned to them
DROP POLICY IF EXISTS "Crew respond on assigned bookings" ON public.bookings;
CREATE POLICY "Crew respond on assigned bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = bookings.assigned_staff_id AND s.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = bookings.assigned_staff_id AND s.user_id = auth.uid()));

-- Public can only see approved portfolio items
DROP POLICY IF EXISTS "Public portfolio items viewable" ON public.portfolio_items;
CREATE POLICY "Public portfolio items viewable"
ON public.portfolio_items FOR SELECT TO anon, authenticated
USING (is_public = true AND approval_status = 'approved');