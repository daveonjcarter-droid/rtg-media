
-- 1. Add backup code + expiry columns
ALTER TABLE public.invited_users
  ADD COLUMN IF NOT EXISTS invite_code text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Helper to generate short readable codes (12 alphanumeric, uppercase, dash-grouped)
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN substr(result,1,4) || '-' || substr(result,5,4) || '-' || substr(result,9,4);
END;
$$;

-- Backfill missing codes / expiries
UPDATE public.invited_users
   SET invite_code = public.generate_invite_code()
 WHERE invite_code IS NULL;

UPDATE public.invited_users
   SET expires_at = COALESCE(expires_at, created_at + interval '7 days');

-- Unique index on invite_code (where present)
CREATE UNIQUE INDEX IF NOT EXISTS invited_users_invite_code_key
  ON public.invited_users (invite_code) WHERE invite_code IS NOT NULL;

-- Default expiry of 7 days for new rows
ALTER TABLE public.invited_users
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '7 days');

-- 2. Update handle_new_user to also accept staff_invite_code metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invite record;
  r app_role;
  admin_code text;
  staff_code text;
  granted_roles app_role[];
  initial_status text := 'pending';
  initial_profile_type text := 'client';
  initial_role_type text := 'client';
BEGIN
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

  -- 2) Admin invite code
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

  -- 3) Staff/crew invited_users (token OR backup code OR email match)
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

  INSERT INTO public.profile_meta (user_id, email, full_name, display_name, profile_type, role_type, status)
    VALUES (new.id, new.email,
            coalesce(new.raw_user_meta_data->>'display_name', new.email),
            coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
            initial_profile_type, initial_role_type, initial_status)
    ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$function$;
