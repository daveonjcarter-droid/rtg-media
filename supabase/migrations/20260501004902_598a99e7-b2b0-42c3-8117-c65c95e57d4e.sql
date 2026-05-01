-- 1) Lock down user_roles: only head_admin can write; users may read their own
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'head_admin'));

DROP POLICY IF EXISTS "Only head admins can insert roles" ON public.user_roles;
CREATE POLICY "Only head admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'head_admin'));

DROP POLICY IF EXISTS "Only head admins can update roles" ON public.user_roles;
CREATE POLICY "Only head admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'head_admin'))
WITH CHECK (public.has_role(auth.uid(), 'head_admin'));

DROP POLICY IF EXISTS "Only head admins can delete roles" ON public.user_roles;
CREATE POLICY "Only head admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'head_admin'));

-- 2) Replace handle_new_user: no default 'writer' role for uninvited signups.
-- Hardcoded owners and valid invites still assign roles via SECURITY DEFINER (bypasses RLS).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Pending invite (case-insensitive)
  SELECT * INTO invite FROM public.invited_users
    WHERE lower(email) = lower(new.email) AND status = 'pending'
    LIMIT 1;

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
  END IF;
  -- IMPORTANT: no fallback role. Uninvited signups receive zero roles
  -- and are treated as pending until a head_admin assigns access.

  RETURN new;
END;
$function$;