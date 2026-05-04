
-- 1) signup_codes — admin-issued codes that simply unlock staff account creation
CREATE TABLE IF NOT EXISTS public.signup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active', -- active | revoked
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signup_codes admins manage"
  ON public.signup_codes FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'head_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'co_ceo')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'head_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'co_ceo')
  );

CREATE TRIGGER trg_signup_codes_updated
  BEFORE UPDATE ON public.signup_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Redemption log
CREATE TABLE IF NOT EXISTS public.signup_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.signup_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signup_code_redemptions admins read"
  ON public.signup_code_redemptions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'head_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'co_ceo')
  );

-- 3) Validator (used by /signup before submitting)
CREATE OR REPLACE FUNCTION public.validate_signup_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec record;
BEGIN
  SELECT * INTO rec FROM public.signup_codes
    WHERE upper(code) = upper(_code)
    LIMIT 1;
  IF rec.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid code.');
  END IF;
  IF rec.status <> 'active' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This code has been revoked.');
  END IF;
  IF rec.expires_at IS NOT NULL AND rec.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This code has expired.');
  END IF;
  IF rec.used_count >= rec.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This code has reached its usage limit.');
  END IF;
  RETURN jsonb_build_object('valid', true, 'label', rec.label);
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_signup_code(text) TO anon, authenticated;

-- 4) Internal redeem (called from handle_new_user) — increments used_count and logs
CREATE OR REPLACE FUNCTION public.redeem_signup_code(_code text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec record;
BEGIN
  SELECT * INTO rec FROM public.signup_codes
    WHERE upper(code) = upper(_code)
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
      AND used_count < max_uses
    FOR UPDATE
    LIMIT 1;
  IF rec.id IS NULL THEN RETURN false; END IF;

  UPDATE public.signup_codes
    SET used_count = used_count + 1,
        updated_at = now()
    WHERE id = rec.id;

  INSERT INTO public.signup_code_redemptions (code_id, user_id) VALUES (rec.id, _user_id);
  RETURN true;
END;
$$;

-- 5) Role permission access toggles (12 keys)
ALTER TABLE public.role_permissions
  ADD COLUMN IF NOT EXISTS access_dashboard       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_bookings        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_calendar        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_articles        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_production      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_staff           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_analytics       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_pricing         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_invites         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_role_management boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_audit           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_website_content boolean NOT NULL DEFAULT false;

-- Seed sensible defaults for elevated roles
UPDATE public.role_permissions SET
  access_dashboard = true, access_bookings = true, access_calendar = true,
  access_articles = true, access_production = true, access_staff = true,
  access_analytics = true, access_pricing = true, access_invites = true,
  access_role_management = true, access_audit = true, access_website_content = true
WHERE role IN ('head_admin');

UPDATE public.role_permissions SET
  access_dashboard = true, access_bookings = true, access_calendar = true,
  access_articles = true, access_production = true, access_staff = true,
  access_analytics = true, access_pricing = true, access_invites = true,
  access_audit = false, access_role_management = false, access_website_content = true
WHERE role IN ('admin');

UPDATE public.role_permissions SET
  access_dashboard = true, access_calendar = true, access_articles = true,
  access_analytics = true, access_website_content = true
WHERE role IN ('editor');

UPDATE public.role_permissions SET
  access_dashboard = true, access_bookings = true, access_calendar = true,
  access_production = true, access_staff = true, access_pricing = true
WHERE role IN ('booking_manager');

-- 6) Update handle_new_user to support signup_code (code-only, no email lock)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite record;
  r app_role;
  admin_code text;
  staff_code text;
  signup_code text;
  granted_roles app_role[];
  initial_status text := 'pending';
  initial_profile_type text := 'client';
  initial_role_type text := 'client';
  redeemed boolean := false;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  -- 1) Hardcoded owners
  IF lower(new.email) IN ('daveonjcarter@gmail.com', 'brendynshields20@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'head_admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'owner') ON CONFLICT DO NOTHING;
    initial_status := 'active'; initial_profile_type := 'admin'; initial_role_type := 'owner';
    INSERT INTO public.profile_meta (user_id, email, full_name, display_name, profile_type, role_type, status)
      VALUES (new.id, new.email,
              coalesce(new.raw_user_meta_data->>'display_name', new.email),
              coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
              initial_profile_type, initial_role_type, initial_status)
      ON CONFLICT (user_id) DO NOTHING;
    RETURN new;
  END IF;

  -- 2) Admin invite code
  admin_code := new.raw_user_meta_data->>'admin_invite_code';
  IF admin_code IS NOT NULL AND length(admin_code) > 0 THEN
    granted_roles := public.redeem_admin_invite(new.email, admin_code, new.id);
    IF array_length(granted_roles, 1) > 0 THEN
      FOREACH r IN ARRAY granted_roles LOOP
        INSERT INTO public.user_roles (user_id, role) VALUES (new.id, r) ON CONFLICT DO NOTHING;
      END LOOP;
      initial_status := 'active'; initial_profile_type := 'admin';
      initial_role_type := granted_roles[1]::text;
    END IF;
  END IF;

  -- 3) Email-based legacy invited_users (kept for backward compat)
  IF initial_status = 'pending' THEN
    staff_code := new.raw_user_meta_data->>'staff_invite_code';
    IF staff_code IS NOT NULL AND length(staff_code) > 0 THEN
      SELECT * INTO invite FROM public.invited_users
        WHERE upper(invite_code) = upper(staff_code)
          AND lower(email) = lower(new.email)
          AND status = 'pending'
          AND (expires_at IS NULL OR expires_at > now())
        LIMIT 1;
    END IF;
    IF invite.id IS NULL THEN
      SELECT * INTO invite FROM public.invited_users
        WHERE lower(email) = lower(new.email)
          AND status = 'pending'
          AND (expires_at IS NULL OR expires_at > now())
        LIMIT 1;
    END IF;
    IF invite.id IS NOT NULL THEN
      FOREACH r IN ARRAY invite.roles LOOP
        INSERT INTO public.user_roles (user_id, role) VALUES (new.id, r) ON CONFLICT DO NOTHING;
      END LOOP;
      INSERT INTO public.user_hierarchy (user_id, reports_to, internal_title)
        VALUES (new.id, invite.reports_to, invite.internal_title)
        ON CONFLICT (user_id) DO UPDATE
          SET reports_to = EXCLUDED.reports_to, internal_title = EXCLUDED.internal_title;
      UPDATE public.invited_users
        SET status = 'active', accepted_at = now(), accepted_user_id = new.id
        WHERE id = invite.id;
      initial_status := 'active';
      initial_profile_type := COALESCE(invite.invite_type, 'staff');
      IF initial_profile_type NOT IN ('admin','staff','crew','public_creator','client') THEN
        initial_profile_type := 'staff';
      END IF;
      IF array_length(invite.roles, 1) > 0 THEN
        initial_role_type := invite.roles[1]::text;
      END IF;
    END IF;
  END IF;

  -- 4) NEW: simple signup_code (no email match, just unlocks staff account)
  IF initial_status = 'pending' THEN
    signup_code := new.raw_user_meta_data->>'signup_code';
    IF signup_code IS NOT NULL AND length(signup_code) > 0 THEN
      redeemed := public.redeem_signup_code(signup_code, new.id);
      IF redeemed THEN
        -- Pending staff: no roles assigned yet, admin must promote
        initial_status := 'pending';
        initial_profile_type := 'staff';
        initial_role_type := 'pending_staff';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.profile_meta (user_id, email, full_name, display_name, profile_type, role_type, status)
    VALUES (new.id, new.email,
            coalesce(new.raw_user_meta_data->>'display_name', new.email),
            coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
            initial_profile_type, initial_role_type, initial_status)
    ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;
