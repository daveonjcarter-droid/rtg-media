-- =====================================================
-- MASTER AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor_email text,
  actor_name text,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  changed_fields text[] NOT NULL DEFAULT '{}',
  before_data jsonb,
  after_data jsonb,
  summary text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log (action);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only head admins / owners / co_ceo can read
CREATE POLICY "Head admins can read audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'head_admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'co_ceo')
  );

-- No direct inserts / updates / deletes from clients.
-- Triggers run as definer and bypass RLS, so no INSERT policy is needed.

-- =====================================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- =====================================================
-- Captures who changed what, before/after snapshots (sensitive fields stripped),
-- and the list of changed fields. Runs as security definer to write to audit_log
-- regardless of caller's RLS.

CREATE OR REPLACE FUNCTION public.fn_audit_capture()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text;
  v_name text;
  v_before jsonb;
  v_after jsonb;
  v_changed text[] := '{}';
  v_action text;
  v_entity_id uuid;
  v_summary text;
  v_strip text[] := ARRAY[
    'password','password_hash','encrypted_password','token','invite_token',
    'invite_code','api_key','secret','access_token','refresh_token',
    'service_role_key','captcha_token','session_token'
  ];
  k text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'insert';
    v_after := to_jsonb(NEW);
    v_before := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  ELSE
    v_action := 'delete';
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;

  -- Strip sensitive keys
  FOREACH k IN ARRAY v_strip LOOP
    IF v_before ? k THEN v_before := v_before - k; END IF;
    IF v_after  ? k THEN v_after  := v_after  - k; END IF;
  END LOOP;

  -- Compute changed fields on UPDATE
  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(array_agg(key), '{}')
      INTO v_changed
    FROM (
      SELECT key
      FROM jsonb_each(v_after)
      WHERE v_after -> key IS DISTINCT FROM v_before -> key
        AND key NOT IN ('updated_at')
    ) s;

    -- Skip noise: if nothing meaningful changed, don't write a row
    IF array_length(v_changed, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Best-effort entity id
  BEGIN
    v_entity_id := COALESCE((v_after ->> 'id')::uuid, (v_before ->> 'id')::uuid);
  EXCEPTION WHEN OTHERS THEN
    v_entity_id := NULL;
  END;

  -- Resolve actor identity
  IF v_actor IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_actor;
    SELECT display_name INTO v_name FROM public.profiles WHERE id = v_actor;
  END IF;

  -- Tiny human summary
  v_summary := TG_TABLE_NAME || ' ' || v_action ||
               CASE WHEN v_entity_id IS NOT NULL THEN ' · ' || left(v_entity_id::text, 8) ELSE '' END;

  INSERT INTO public.audit_log (
    actor_id, actor_email, actor_name,
    entity_type, entity_id, action, changed_fields,
    before_data, after_data, summary
  ) VALUES (
    v_actor, v_email, COALESCE(v_name, v_email),
    TG_TABLE_NAME, v_entity_id, v_action, v_changed,
    v_before, v_after, v_summary
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- ATTACH TRIGGERS TO CORE TABLES
-- =====================================================

DO $$
DECLARE
  t text;
  audited text[] := ARRAY[
    'articles',
    'bookings',
    'crew_assignments',
    'staff_profiles',
    'profile_meta',
    'services',
    'portfolio_items',
    'user_roles',
    'calendar_events'
  ];
BEGIN
  FOREACH t IN ARRAY audited LOOP
    -- Only attach if the table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I;', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit_%I
           AFTER INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.fn_audit_capture();',
        t, t
      );
    END IF;
  END LOOP;
END$$;