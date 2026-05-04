
-- =========================================================
-- Phase 2 (steps 1-4): Clients, Messaging, Quotes/Invoices
-- =========================================================

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE public.client_status AS ENUM ('lead','active','past','vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.quote_status AS ENUM ('draft','sent','approved','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft','sent','partial','paid','overdue','void','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_provider AS ENUM ('manual','stripe');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('unpaid','partial','paid','failed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.thread_kind AS ENUM ('project','booking','client','direct','team');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- CLIENTS (CRM) ----------
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,                           -- linked auth user (nullable)
  name text NOT NULL,
  email text,
  phone text,
  company text,
  artist_name text,
  notes text,
  status client_status NOT NULL DEFAULT 'lead',
  total_spend numeric NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clients_user ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(lower(email));
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

CREATE TRIGGER clients_set_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER clients_audit AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_capture();

-- Link clients <-> projects (many-to-many, but usually 1)
CREATE TABLE IF NOT EXISTS public.project_clients (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, client_id)
);

-- Link clients <-> bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_id uuid;
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(client_id);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_clients ENABLE ROW LEVEL SECURITY;

-- Helper: is staff (any internal role)
CREATE OR REPLACE FUNCTION public.is_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role IN ('head_admin','admin','owner','co_ceo','editor','writer','journalist',
                   'social_manager','booking_manager','media_manager','social_articles_lead',
                   'project_manager','designer','intern','crew','photographer','videographer',
                   'video_editor','director','producer','audio_engineer','grip_lighting',
                   'makeup_artist','production_assistant','studio_staff')
  );
$$;

-- CRM RLS: staff (booking-team & up) manage; clients see own
CREATE POLICY "clients staff manage" ON public.clients
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'head_admin') OR public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'co_ceo') OR
    public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'booking_manager') OR
    public.has_role(auth.uid(),'project_manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'head_admin') OR public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'co_ceo') OR
    public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'booking_manager') OR
    public.has_role(auth.uid(),'project_manager')
  );

CREATE POLICY "clients self read" ON public.clients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "project_clients staff manage" ON public.project_clients
  FOR ALL TO authenticated
  USING (public.is_pm_or_admin(auth.uid()) OR public.has_role(auth.uid(),'booking_manager'))
  WITH CHECK (public.is_pm_or_admin(auth.uid()) OR public.has_role(auth.uid(),'booking_manager'));

CREATE POLICY "project_clients client read" ON public.project_clients
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = project_clients.client_id AND c.user_id = auth.uid()));

-- Client read policy on projects for projects they're linked to
CREATE POLICY "projects client read" ON public.projects
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_clients pc
    JOIN public.clients c ON c.id = pc.client_id
    WHERE pc.project_id = projects.id AND c.user_id = auth.uid()
  ));

-- ---------- MESSAGING ----------
CREATE TABLE IF NOT EXISTS public.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind thread_kind NOT NULL DEFAULT 'team',
  subject text,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  booking_id uuid,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  participant_ids uuid[] NOT NULL DEFAULT '{}',  -- auth user ids
  client_visible boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_threads_project ON public.message_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_threads_client ON public.message_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_threads_participants ON public.message_threads USING GIN(participant_ids);

CREATE TRIGGER message_threads_set_updated_at BEFORE UPDATE ON public.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  mentions uuid[] NOT NULL DEFAULT '{}',
  attachments jsonb NOT NULL DEFAULT '[]',
  read_by uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id, created_at DESC);

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Thread access: ops/admins, creator, participants, or linked client
CREATE OR REPLACE FUNCTION public.can_access_thread(_thread_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.message_threads t
    WHERE t.id = _thread_id
      AND (
        public.is_pm_or_admin(_uid)
        OR t.created_by = _uid
        OR _uid = ANY(t.participant_ids)
        OR (t.client_visible AND EXISTS (
              SELECT 1 FROM public.clients c WHERE c.id = t.client_id AND c.user_id = _uid))
      )
  );
$$;

CREATE POLICY "threads read" ON public.message_threads
  FOR SELECT TO authenticated
  USING (
    public.is_pm_or_admin(auth.uid())
    OR created_by = auth.uid()
    OR auth.uid() = ANY(participant_ids)
    OR (client_visible AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = message_threads.client_id AND c.user_id = auth.uid()))
  );

CREATE POLICY "threads insert" ON public.message_threads
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "threads update participants/ops" ON public.message_threads
  FOR UPDATE TO authenticated
  USING (public.is_pm_or_admin(auth.uid()) OR created_by = auth.uid() OR auth.uid() = ANY(participant_ids))
  WITH CHECK (public.is_pm_or_admin(auth.uid()) OR created_by = auth.uid() OR auth.uid() = ANY(participant_ids));

CREATE POLICY "messages read" ON public.messages
  FOR SELECT TO authenticated
  USING (public.can_access_thread(thread_id, auth.uid()));

CREATE POLICY "messages insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.can_access_thread(thread_id, auth.uid()));

CREATE POLICY "messages update own read_by" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.can_access_thread(thread_id, auth.uid()))
  WITH CHECK (public.can_access_thread(thread_id, auth.uid()));

-- Notify mentions + recipients on new message; bump thread last_message_at
CREATE OR REPLACE FUNCTION public.fn_message_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.message_threads%ROWTYPE;
  uid uuid;
  preview text;
BEGIN
  SELECT * INTO t FROM public.message_threads WHERE id = NEW.thread_id;
  UPDATE public.message_threads SET last_message_at = NEW.created_at, updated_at = now() WHERE id = NEW.thread_id;
  preview := left(NEW.body, 140);

  -- Notify mentioned users
  FOREACH uid IN ARRAY COALESCE(NEW.mentions, '{}'::uuid[]) LOOP
    IF uid <> NEW.sender_id THEN
      PERFORM public.fn_notify(uid, 'mention', 'You were mentioned',
        preview, '/dashboard/messages?thread=' || NEW.thread_id::text,
        'message', NEW.id);
    END IF;
  END LOOP;

  -- Notify other participants
  FOREACH uid IN ARRAY COALESCE(t.participant_ids, '{}'::uuid[]) LOOP
    IF uid <> NEW.sender_id AND NOT (uid = ANY(COALESCE(NEW.mentions,'{}'::uuid[]))) THEN
      PERFORM public.fn_notify(uid, 'message', 'New message: ' || COALESCE(t.subject,'thread'),
        preview, '/dashboard/messages?thread=' || NEW.thread_id::text,
        'message', NEW.id);
    END IF;
  END LOOP;

  RETURN NEW;
END $$;

CREATE TRIGGER messages_after_insert AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.fn_message_after_insert();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ---------- QUOTES ----------
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE,                       -- e.g. Q-2026-0001
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  booking_id uuid,
  status quote_status NOT NULL DEFAULT 'draft',
  title text NOT NULL DEFAULT 'New Quote',
  notes text,
  base_price numeric NOT NULL DEFAULT 0,
  addons_total numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  valid_until date,
  sent_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON public.quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project ON public.quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

CREATE TABLE IF NOT EXISTS public.quote_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  qty numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'addon',     -- base | addon | discount
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON public.quote_line_items(quote_id);

CREATE TRIGGER quotes_set_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER quotes_audit AFTER INSERT OR UPDATE OR DELETE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_capture();

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;

-- Discount cap helper for project_manager (max 15%)
CREATE OR REPLACE FUNCTION public.fn_quote_pm_discount_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pm_only boolean;
  base numeric;
  pct numeric;
BEGIN
  -- Only enforce for non-admin/owner project_manager users
  pm_only := public.has_role(auth.uid(), 'project_manager')
         AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'head_admin')
                  OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'co_ceo'));
  IF pm_only THEN
    base := COALESCE(NEW.base_price,0) + COALESCE(NEW.addons_total,0);
    IF base > 0 THEN
      pct := COALESCE(NEW.discount,0) / base;
      IF pct > 0.15 THEN
        RAISE EXCEPTION 'Project Manager discount limit is 15%% (you tried %).', round(pct*100,1);
      END IF;
    END IF;
  END IF;
  -- Always recompute total
  NEW.total := COALESCE(NEW.base_price,0) + COALESCE(NEW.addons_total,0) - COALESCE(NEW.discount,0) + COALESCE(NEW.tax,0);
  RETURN NEW;
END $$;

CREATE TRIGGER quotes_pm_discount_check BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.fn_quote_pm_discount_check();

CREATE POLICY "quotes ops manage" ON public.quotes
  FOR ALL TO authenticated
  USING (public.is_pm_or_admin(auth.uid()) OR public.has_role(auth.uid(),'booking_manager'))
  WITH CHECK (public.is_pm_or_admin(auth.uid()) OR public.has_role(auth.uid(),'booking_manager'));

CREATE POLICY "quotes client read" ON public.quotes
  FOR SELECT TO authenticated
  USING (status IN ('sent','approved','rejected') AND EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = quotes.client_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "quote_items ops manage" ON public.quote_line_items
  FOR ALL TO authenticated
  USING (public.is_pm_or_admin(auth.uid()) OR public.has_role(auth.uid(),'booking_manager'))
  WITH CHECK (public.is_pm_or_admin(auth.uid()) OR public.has_role(auth.uid(),'booking_manager'));

CREATE POLICY "quote_items client read" ON public.quote_line_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotes q JOIN public.clients c ON c.id = q.client_id
    WHERE q.id = quote_line_items.quote_id AND c.user_id = auth.uid()
      AND q.status IN ('sent','approved','rejected')
  ));

-- ---------- INVOICES ----------
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE,                              -- INV-2026-0001
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  booking_id uuid,
  status invoice_status NOT NULL DEFAULT 'draft',
  amount_due numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  issued_at timestamptz,
  due_date date,
  -- Stripe-ready (manual today)
  payment_provider payment_provider NOT NULL DEFAULT 'manual',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  payment_url text,
  payment_method text,
  payment_notes text,
  paid_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);

CREATE TRIGGER invoices_set_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER invoices_audit AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_capture();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Only admin/owner/PM can mark paid; clients can only read
CREATE POLICY "invoices ops manage" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_pm_or_admin(auth.uid()) OR public.has_role(auth.uid(),'booking_manager'))
  WITH CHECK (public.is_pm_or_admin(auth.uid()) OR public.has_role(auth.uid(),'booking_manager'));

CREATE POLICY "invoices client read" ON public.invoices
  FOR SELECT TO authenticated
  USING (status <> 'draft' AND EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = invoices.client_id AND c.user_id = auth.uid()
  ));

-- Auto-rollup total_spend when invoice paid
CREATE OR REPLACE FUNCTION public.fn_invoice_rollup_spend()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.client_id IS NULL THEN RETURN NEW; END IF;
  UPDATE public.clients c
    SET total_spend = COALESCE((
      SELECT SUM(amount_paid) FROM public.invoices i
      WHERE i.client_id = c.id
    ),0),
    updated_at = now()
  WHERE c.id = NEW.client_id;
  RETURN NEW;
END $$;

CREATE TRIGGER invoices_rollup_spend AFTER INSERT OR UPDATE OF amount_paid, status ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.fn_invoice_rollup_spend();

-- Number generators
CREATE OR REPLACE FUNCTION public.fn_assign_quote_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF NEW.number IS NULL THEN
    SELECT COUNT(*)+1 INTO n FROM public.quotes WHERE created_at >= date_trunc('year', now());
    NEW.number := 'Q-' || to_char(now(),'YYYY') || '-' || lpad(n::text,4,'0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER quotes_assign_number BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.fn_assign_quote_number();

CREATE OR REPLACE FUNCTION public.fn_assign_invoice_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF NEW.number IS NULL THEN
    SELECT COUNT(*)+1 INTO n FROM public.invoices WHERE created_at >= date_trunc('year', now());
    NEW.number := 'INV-' || to_char(now(),'YYYY') || '-' || lpad(n::text,4,'0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER invoices_assign_number BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.fn_assign_invoice_number();
