
-- 1) article_engagement: drop permissive UPDATE, expose share bump RPC
DROP POLICY IF EXISTS "Anyone can bump engagement" ON public.article_engagement;
DROP POLICY IF EXISTS "Anyone can insert engagement row" ON public.article_engagement;

REVOKE INSERT, UPDATE, DELETE ON public.article_engagement FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.bump_article_share(article_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.articles WHERE id = article_uuid AND status = 'published') THEN
    RETURN;
  END IF;
  INSERT INTO public.article_engagement (article_id, shares)
  VALUES (article_uuid, 1)
  ON CONFLICT (article_id) DO UPDATE
    SET shares = public.article_engagement.shares + 1,
        updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.bump_article_share(uuid) TO anon, authenticated;

-- Harden the existing view bumper search_path (already SECURITY DEFINER)
ALTER FUNCTION public.bump_article_view(uuid) SET search_path = public;

-- 2) user_roles: remove the permissive read-all policy
DROP POLICY IF EXISTS "Roles readable by authenticated users" ON public.user_roles;

-- 3) staff_profiles: revoke email/phone from anon column access
REVOKE SELECT ON public.staff_profiles FROM anon;
GRANT SELECT (
  id, user_id, slug, display_name, role_title, bio, photo_url, cover_image_url,
  location, specialties, service_ids, instagram, twitter, website,
  is_public, is_bookable, sort_order, created_at, updated_at,
  production_position, status, travel_radius_miles, preferred_service_ids,
  equipment, reel_links, skills, hourly_rate, day_rate,
  show_email_publicly, show_phone_publicly,
  is_crew, is_featured, accepting_bookings, availability_notes, availability_updated_at
) ON public.staff_profiles TO anon;

-- Controlled lookup for the public team profile page
CREATE OR REPLACE FUNCTION public.get_public_staff_contact(_slug text)
RETURNS TABLE(email text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN show_email_publicly THEN email ELSE NULL END,
    CASE WHEN show_phone_publicly THEN phone ELSE NULL END
  FROM public.staff_profiles
  WHERE slug = _slug AND is_public = true
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_staff_contact(text) TO anon, authenticated;
