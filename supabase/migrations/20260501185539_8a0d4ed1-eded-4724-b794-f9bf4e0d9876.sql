
-- =========================================================
-- PROFILE_META
-- =========================================================
CREATE TABLE IF NOT EXISTS public.profile_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  full_name text,
  display_name text,
  profile_type text NOT NULL DEFAULT 'staff'
    CHECK (profile_type IN ('admin','staff','crew','public_creator','client')),
  role_type text
    CHECK (role_type IS NULL OR role_type IN (
      'owner','co_ceo','admin','editor','journalist','photographer',
      'videographer','designer','producer','crew','intern','client'
    )),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','disabled','archived','unlinked')),
  profile_photo_url text,
  bio text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_meta_user ON public.profile_meta(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_meta_status ON public.profile_meta(status);
CREATE INDEX IF NOT EXISTS idx_profile_meta_type ON public.profile_meta(profile_type);

ALTER TABLE public.profile_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_meta read all signed in" ON public.profile_meta;
CREATE POLICY "profile_meta read all signed in"
  ON public.profile_meta FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profile_meta admins manage" ON public.profile_meta;
CREATE POLICY "profile_meta admins manage"
  ON public.profile_meta FOR ALL TO authenticated
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

DROP POLICY IF EXISTS "profile_meta self update" ON public.profile_meta;
CREATE POLICY "profile_meta self update"
  ON public.profile_meta FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    -- self can't elevate their own role/status/profile_type
    AND profile_type = (SELECT profile_type FROM public.profile_meta WHERE user_id = auth.uid())
    AND status = (SELECT status FROM public.profile_meta WHERE user_id = auth.uid())
    AND COALESCE(role_type,'') = COALESCE((SELECT role_type FROM public.profile_meta WHERE user_id = auth.uid()),'')
  );

DROP TRIGGER IF EXISTS trg_profile_meta_updated ON public.profile_meta;
CREATE TRIGGER trg_profile_meta_updated
  BEFORE UPDATE ON public.profile_meta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- ADMIN_INVITES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  role_type text NOT NULL
    CHECK (role_type IN ('owner','co_ceo','admin','editor','journalist','designer','producer')),
  app_roles app_role[] NOT NULL DEFAULT '{}'::app_role[],
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','used','revoked','expired')),
  expires_at timestamptz,
  created_by uuid,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON public.admin_invites(lower(email));
CREATE INDEX IF NOT EXISTS idx_admin_invites_code ON public.admin_invites(invite_code);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_invites admins manage" ON public.admin_invites;
CREATE POLICY "admin_invites admins manage"
  ON public.admin_invites FOR ALL TO authenticated
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

-- =========================================================
-- HELPER: redeem admin invite (called from handle_new_user via metadata)
-- =========================================================
CREATE OR REPLACE FUNCTION public.redeem_admin_invite(_email text, _code text, _user_id uuid)
RETURNS app_role[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
BEGIN
  SELECT * INTO inv
  FROM public.admin_invites
  WHERE invite_code = _code
    AND lower(email) = lower(_email)
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF inv.id IS NULL THEN
    RETURN '{}'::app_role[];
  END IF;

  UPDATE public.admin_invites
    SET status = 'used', used_by = _user_id, used_at = now()
    WHERE id = inv.id;

  RETURN inv.app_roles;
END;
$$;

-- =========================================================
-- HELPER: admin-only manual link of staff_profile to user account
-- =========================================================
CREATE OR REPLACE FUNCTION public.link_staff_profile_to_user(_profile_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'head_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'co_ceo')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.staff_profiles
    SET user_id = _user_id, status = 'active', updated_at = now()
    WHERE id = _profile_id;
END;
$$;

-- =========================================================
-- UPDATED handle_new_user — supports admin invite codes
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite record;
  r app_role;
  admin_code text;
  granted_roles app_role[];
  initial_status text := 'pending';
  initial_profile_type text := 'client';
  initial_role_type text := 'client';
BEGIN
  -- Base profile row
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  -- 1) Hardcoded owners
  IF lower(new.email) IN ('daveonjcarter@gmail.com', 'brendynshields20@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'head_admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'owner') ON CONFLICT DO NOTHING;
    initial_status := 'active';
    initial_profile_type := 'admin';
    initial_role_type := 'owner';
    INSERT INTO public.profile_meta (user_id, email, full_name, display_name, profile_type, role_type, status)
      VALUES (new.id, new.email,
              coalesce(new.raw_user_meta_data->>'display_name', new.email),
              coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
              initial_profile_type, initial_role_type, initial_status)
      ON CONFLICT (user_id) DO NOTHING;
    RETURN new;
  END IF;

  -- 2) Admin invite code (passed via signUp metadata as 'admin_invite_code')
  admin_code := new.raw_user_meta_data->>'admin_invite_code';
  IF admin_code IS NOT NULL AND length(admin_code) > 0 THEN
    granted_roles := public.redeem_admin_invite(new.email, admin_code, new.id);
    IF array_length(granted_roles, 1) > 0 THEN
      FOREACH r IN ARRAY granted_roles LOOP
        INSERT INTO public.user_roles (user_id, role) VALUES (new.id, r) ON CONFLICT DO NOTHING;
      END LOOP;
      initial_status := 'active';
      initial_profile_type := 'admin';
      initial_role_type := granted_roles[1]::text;
    END IF;
  END IF;

  -- 3) Staff/crew invited_users token
  IF initial_status = 'pending' THEN
    SELECT * INTO invite FROM public.invited_users
      WHERE lower(email) = lower(new.email) AND status = 'pending'
      LIMIT 1;

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

  -- 4) profile_meta row always created (status reflects whether they have access)
  INSERT INTO public.profile_meta (user_id, email, full_name, display_name, profile_type, role_type, status)
    VALUES (new.id, new.email,
            coalesce(new.raw_user_meta_data->>'display_name', new.email),
            coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
            initial_profile_type, initial_role_type, initial_status)
    ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- Make sure the auth signup trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- Backfill profile_meta for existing users
-- =========================================================
INSERT INTO public.profile_meta (user_id, email, full_name, display_name, profile_type, status)
SELECT
  u.id,
  u.email,
  COALESCE(p.display_name, u.email),
  COALESCE(p.display_name, split_part(u.email, '@', 1)),
  CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role IN ('head_admin','admin','owner','co_ceo')) THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role IN ('crew','photographer','videographer','video_editor','director','producer','audio_engineer','grip_lighting','makeup_artist','production_assistant','studio_staff')) THEN 'crew'
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id) THEN 'staff'
    ELSE 'client'
  END,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id) THEN 'active'
    ELSE 'pending'
  END
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ON CONFLICT (user_id) DO NOTHING;
