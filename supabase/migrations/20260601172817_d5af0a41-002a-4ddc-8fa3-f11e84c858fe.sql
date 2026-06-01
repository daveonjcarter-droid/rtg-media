
-- 1) Replace always-true INSERT policies with meaningful guards
DROP POLICY IF EXISTS "Anyone can write activity" ON public.activity_log;
CREATE POLICY "Anyone can write activity" ON public.activity_log
  FOR INSERT WITH CHECK (kind IS NOT NULL AND title IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can submit an advertise inquiry" ON public.advertise_inquiries;
CREATE POLICY "Anyone can submit an advertise inquiry" ON public.advertise_inquiries
  FOR INSERT WITH CHECK (email IS NOT NULL AND brand IS NOT NULL AND length(email) <= 320);

DROP POLICY IF EXISTS "Anyone can record an event" ON public.analytics_events;
CREATE POLICY "Anyone can record an event" ON public.analytics_events
  FOR INSERT WITH CHECK (event_type IS NOT NULL AND length(event_type) <= 100);

DROP POLICY IF EXISTS "Anyone can submit an application" ON public.applications;
CREATE POLICY "Anyone can submit an application" ON public.applications
  FOR INSERT WITH CHECK (email IS NOT NULL AND full_name IS NOT NULL AND length(email) <= 320);

DROP POLICY IF EXISTS "Anyone can submit a booking" ON public.bookings;
CREATE POLICY "Anyone can submit a booking" ON public.bookings
  FOR INSERT WITH CHECK (email IS NOT NULL AND name IS NOT NULL AND length(email) <= 320);

DROP POLICY IF EXISTS "Anyone can be added as a lead" ON public.leads;
CREATE POLICY "Anyone can be added as a lead" ON public.leads
  FOR INSERT WITH CHECK (email IS NOT NULL AND length(email) <= 320);

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (email IS NOT NULL AND length(email) <= 320);

DROP POLICY IF EXISTS "Anyone can insert a page view" ON public.page_views;
CREATE POLICY "Anyone can insert a page view" ON public.page_views
  FOR INSERT WITH CHECK (path IS NOT NULL AND length(path) <= 2048);

-- 2) Tighten service-role ALL policies (remove permissive true; explicit role check)
DROP POLICY IF EXISTS "Service role manages orders" ON public.payment_orders;
CREATE POLICY "Service role manages orders" ON public.payment_orders
  FOR ALL TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.subscriptions;
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3) application_rate_limits: RLS enabled but no policies. Restrict to service role only.
CREATE POLICY "Service role manages rate limits" ON public.application_rate_limits
  FOR ALL TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4) Set immutable search_path on remaining SECURITY DEFINER / helper functions
ALTER FUNCTION public.generate_invite_code() SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
