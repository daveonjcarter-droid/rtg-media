
-- Rebuild signup code validation: normalize input (uppercase, strip dashes/spaces)
-- and check BOTH signup_codes and invited_users (legacy staff invite codes).

CREATE OR REPLACE FUNCTION public.validate_signup_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec record;
  inv record;
  norm text;
BEGIN
  IF _code IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid code. Please check the code and try again.');
  END IF;
  norm := upper(regexp_replace(_code, '[^A-Za-z0-9]', '', 'g'));
  IF length(norm) = 0 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid code. Please check the code and try again.');
  END IF;

  -- 1) signup_codes (new system)
  SELECT * INTO rec FROM public.signup_codes
    WHERE upper(regexp_replace(code, '[^A-Za-z0-9]', '', 'g')) = norm
    LIMIT 1;

  IF rec.id IS NOT NULL THEN
    IF rec.status <> 'active' THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This code has been revoked.');
    END IF;
    IF rec.expires_at IS NOT NULL AND rec.expires_at < now() THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This code has expired.');
    END IF;
    IF rec.used_count >= rec.max_uses THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This code has reached its usage limit.');
    END IF;
    RETURN jsonb_build_object('valid', true, 'label', rec.label, 'source', 'signup_code');
  END IF;

  -- 2) invited_users.invite_code (legacy staff invite)
  SELECT * INTO inv FROM public.invited_users
    WHERE invite_code IS NOT NULL
      AND upper(regexp_replace(invite_code, '[^A-Za-z0-9]', '', 'g')) = norm
      AND status = 'pending'
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;

  IF inv.id IS NOT NULL THEN
    RETURN jsonb_build_object('valid', true, 'label', COALESCE(inv.full_name, inv.email), 'source', 'invited_user');
  END IF;

  RETURN jsonb_build_object('valid', false, 'error', 'Invalid code. Please check the code and try again.');
END;
$function$;

CREATE OR REPLACE FUNCTION public.redeem_signup_code(_code text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec record;
  inv record;
  norm text;
BEGIN
  IF _code IS NULL THEN RETURN false; END IF;
  norm := upper(regexp_replace(_code, '[^A-Za-z0-9]', '', 'g'));
  IF length(norm) = 0 THEN RETURN false; END IF;

  -- 1) signup_codes
  SELECT * INTO rec FROM public.signup_codes
    WHERE upper(regexp_replace(code, '[^A-Za-z0-9]', '', 'g')) = norm
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
      AND used_count < max_uses
    FOR UPDATE
    LIMIT 1;

  IF rec.id IS NOT NULL THEN
    UPDATE public.signup_codes
      SET used_count = used_count + 1, updated_at = now()
      WHERE id = rec.id;
    INSERT INTO public.signup_code_redemptions (code_id, user_id) VALUES (rec.id, _user_id);
    RETURN true;
  END IF;

  -- 2) invited_users (legacy) — mark accepted
  SELECT * INTO inv FROM public.invited_users
    WHERE invite_code IS NOT NULL
      AND upper(regexp_replace(invite_code, '[^A-Za-z0-9]', '', 'g')) = norm
      AND status = 'pending'
      AND (expires_at IS NULL OR expires_at > now())
    FOR UPDATE
    LIMIT 1;

  IF inv.id IS NOT NULL THEN
    UPDATE public.invited_users
      SET status = 'active', accepted_at = now(), accepted_user_id = _user_id, updated_at = now()
      WHERE id = inv.id;
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;
