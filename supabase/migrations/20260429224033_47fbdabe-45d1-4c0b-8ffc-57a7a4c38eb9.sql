-- 1. Add new role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'social_articles_lead';

-- 2. invited_users table
CREATE TABLE IF NOT EXISTS public.invited_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  roles app_role[] NOT NULL DEFAULT '{}',
  reports_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_title text,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  accepted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invited_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read invites" ON public.invited_users FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin'));
CREATE POLICY "Admins insert invites" ON public.invited_users FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin'));
CREATE POLICY "Admins update invites" ON public.invited_users FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin'));
CREATE POLICY "Admins delete invites" ON public.invited_users FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin'));

CREATE TRIGGER invited_users_updated_at BEFORE UPDATE ON public.invited_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. user_hierarchy
CREATE TABLE IF NOT EXISTS public.user_hierarchy (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reports_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_title text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_hierarchy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read hierarchy" ON public.user_hierarchy FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins write hierarchy" ON public.user_hierarchy FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin'));
CREATE POLICY "Admins update hierarchy" ON public.user_hierarchy FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin'));
CREATE POLICY "Admins delete hierarchy" ON public.user_hierarchy FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_admin'));

CREATE TRIGGER user_hierarchy_updated_at BEFORE UPDATE ON public.user_hierarchy
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. workspace_settings
CREATE TABLE IF NOT EXISTS public.workspace_settings (
  section text PRIMARY KEY,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read settings" ON public.workspace_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read settings" ON public.workspace_settings FOR SELECT TO anon USING (section IN ('brand','seo'));

CREATE POLICY "Head admin all settings insert" ON public.workspace_settings FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'head_admin') OR
    (has_role(auth.uid(),'admin') AND section IN ('email','content')) OR
    (has_role(auth.uid(),'editor') AND section = 'content') OR
    (has_role(auth.uid(),'media_manager') AND section = 'content') OR
    (has_role(auth.uid(),'social_manager') AND section = 'email') OR
    (has_role(auth.uid(),'booking_manager') AND section = 'email')
  );

CREATE POLICY "Settings update by section" ON public.workspace_settings FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'head_admin') OR
    (has_role(auth.uid(),'admin') AND section IN ('email','content')) OR
    (has_role(auth.uid(),'editor') AND section = 'content') OR
    (has_role(auth.uid(),'media_manager') AND section = 'content') OR
    (has_role(auth.uid(),'social_manager') AND section = 'email') OR
    (has_role(auth.uid(),'booking_manager') AND section = 'email')
  );

CREATE POLICY "Head admin delete settings" ON public.workspace_settings FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'head_admin'));

CREATE TRIGGER workspace_settings_updated_at BEFORE UPDATE ON public.workspace_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default settings rows
INSERT INTO public.workspace_settings (section, config) VALUES
  ('brand', '{"site_name":"Runners To Greatness","tagline":"Culture, Stories, Production.","logo_url":null,"favicon_url":null,"primary_color":"#E11D2E","secondary_color":"#0A0A0A","heading_font":"Inter","body_font":"Inter","watermark_url":null}'::jsonb),
  ('seo', '{"domain_status":"active","meta_title":"Runners To Greatness","meta_description":"Culture, stories, and production from RTG.","keywords":"culture, music, film, chicago","og_image":null,"og_title":null,"og_description":null,"google_indexing":true,"sitemap_enabled":true,"robots_txt":"User-agent: *\nAllow: /"}'::jsonb),
  ('email', '{"editorial_alert_emails":[],"booking_auto_reply":"Thanks for reaching out to RTG. We''ll be in touch within 24 hours.","newsletter_sender_name":"RTG","newsletter_sender_email":"hello@runnerstogreatness.com","new_booking_recipients":[],"new_submission_recipients":[],"staff_invite_template":"You''ve been invited to join the RTG team.","client_booking_template":"Your booking with RTG has been confirmed."}'::jsonb),
  ('security', '{"require_2fa":false,"session_timeout_minutes":480,"password_min_length":8,"login_attempt_limit":5,"trusted_devices_enabled":true,"force_logout_on_role_change":false}'::jsonb),
  ('content', '{"default_categories":["News","Reviews","Interviews","Breakdowns"],"tag_taxonomy":[],"review_templates":[],"approval_workflow":"draft_review_publish","fallback_featured_image":null,"required_seo_before_publish":true,"default_status":"draft","style_guide":""}'::jsonb),
  ('billing', '{"plan":"Pro","billing_contact_email":"hello@runnerstogreatness.com","note":"Subscription, invoices, and payment method are managed in your Lovable workspace settings."}'::jsonb)
ON CONFLICT (section) DO NOTHING;

-- 5. Update handle_new_user to apply invites
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite record;
  r app_role;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  -- Hardcoded owners
  IF lower(new.email) IN ('daveonjcarter@gmail.com', 'brendynshields20@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'head_admin') ON CONFLICT DO NOTHING;
    RETURN new;
  END IF;

  -- Check invited_users
  SELECT * INTO invite FROM public.invited_users WHERE lower(email) = lower(new.email) AND status = 'pending' LIMIT 1;

  IF invite.id IS NOT NULL THEN
    FOREACH r IN ARRAY invite.roles LOOP
      INSERT INTO public.user_roles (user_id, role) VALUES (new.id, r) ON CONFLICT DO NOTHING;
    END LOOP;

    INSERT INTO public.user_hierarchy (user_id, reports_to, internal_title)
    VALUES (new.id, invite.reports_to, invite.internal_title)
    ON CONFLICT (user_id) DO UPDATE SET reports_to = EXCLUDED.reports_to, internal_title = EXCLUDED.internal_title;

    UPDATE public.invited_users
      SET status = 'active', accepted_at = now(), accepted_user_id = new.id
      WHERE id = invite.id;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'writer') ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Seed Brendyn -> Daveon hierarchy if both exist
INSERT INTO public.user_hierarchy (user_id, reports_to, internal_title)
SELECT b.id, d.id, 'Co-CEO / Admin'
FROM auth.users b, auth.users d
WHERE lower(b.email) = 'brendynshields20@gmail.com'
  AND lower(d.email) = 'daveonjcarter@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET reports_to = EXCLUDED.reports_to, internal_title = EXCLUDED.internal_title;

-- 7. Seed Daveon's title
INSERT INTO public.user_hierarchy (user_id, reports_to, internal_title)
SELECT id, NULL, 'Owner / Head Admin' FROM auth.users WHERE lower(email) = 'daveonjcarter@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET internal_title = EXCLUDED.internal_title;