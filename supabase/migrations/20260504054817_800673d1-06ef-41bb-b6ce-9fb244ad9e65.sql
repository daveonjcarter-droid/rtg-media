
-- ============================================================
-- PHASE 1: Projects, Tasks, Notifications foundation
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('idea','planning','active','editing','review','completed','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_priority AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_type AS ENUM ('article','shoot','music_video','film','event','campaign','client_booking','internal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('todo','in_progress','blocked','review','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type public.project_type NOT NULL DEFAULT 'internal',
  status public.project_status NOT NULL DEFAULT 'planning',
  priority public.project_priority NOT NULL DEFAULT 'normal',
  description text,
  notes text,
  due_date date,
  project_manager_id uuid,
  assigned_user_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  related_booking_id uuid,
  related_article_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_pm ON public.projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_due ON public.projects(due_date);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects ops manage" ON public.projects;
CREATE POLICY "projects ops manage" ON public.projects FOR ALL TO authenticated
  USING (public.is_pm_or_admin(auth.uid()))
  WITH CHECK (public.is_pm_or_admin(auth.uid()));

DROP POLICY IF EXISTS "projects assigned read" ON public.projects;
CREATE POLICY "projects assigned read" ON public.projects FOR SELECT TO authenticated
  USING (
    auth.uid() = project_manager_id
    OR auth.uid() = created_by
    OR auth.uid() = ANY (assigned_user_ids)
  );

DROP POLICY IF EXISTS "projects assigned update own" ON public.projects;
CREATE POLICY "projects assigned update own" ON public.projects FOR UPDATE TO authenticated
  USING (auth.uid() = project_manager_id OR auth.uid() = created_by);

CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER projects_audit AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_capture();

-- Tasks
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.project_priority NOT NULL DEFAULT 'normal',
  assigned_to uuid,
  created_by uuid NOT NULL,
  due_date timestamptz,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  related_booking_id uuid,
  related_article_id uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON public.project_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.project_tasks(status);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks ops manage" ON public.project_tasks;
CREATE POLICY "tasks ops manage" ON public.project_tasks FOR ALL TO authenticated
  USING (public.is_pm_or_admin(auth.uid()))
  WITH CHECK (public.is_pm_or_admin(auth.uid()));

DROP POLICY IF EXISTS "tasks assigned read" ON public.project_tasks;
CREATE POLICY "tasks assigned read" ON public.project_tasks FOR SELECT TO authenticated
  USING (
    auth.uid() = assigned_to
    OR auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_tasks.project_id
        AND (auth.uid() = p.project_manager_id OR auth.uid() = ANY (p.assigned_user_ids))
    )
  );

DROP POLICY IF EXISTS "tasks assignee update own" ON public.project_tasks;
CREATE POLICY "tasks assignee update own" ON public.project_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = assigned_to);

CREATE TRIGGER project_tasks_set_updated_at BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER project_tasks_audit AFTER INSERT OR UPDATE OR DELETE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_capture();

-- Auto-set completed_at when status becomes completed
CREATE OR REPLACE FUNCTION public.fn_task_completed_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at := now();
  ELSIF NEW.status <> 'completed' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER project_tasks_completed_at
  BEFORE INSERT OR UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_task_completed_at();

-- Task comments
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(task_id);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_comments read" ON public.task_comments;
CREATE POLICY "task_comments read" ON public.task_comments FOR SELECT TO authenticated
  USING (
    public.is_pm_or_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.project_tasks t WHERE t.id = task_comments.task_id
      AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid()))
  );

DROP POLICY IF EXISTS "task_comments insert own" ON public.task_comments;
CREATE POLICY "task_comments insert own" ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND (
      public.is_pm_or_admin(auth.uid())
      OR EXISTS (SELECT 1 FROM public.project_tasks t WHERE t.id = task_comments.task_id
        AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "task_comments delete own" ON public.task_comments;
CREATE POLICY "task_comments delete own" ON public.task_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_pm_or_admin(auth.uid()));

-- Notifications (per-user)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link_url text,
  related_type text,
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications own read" ON public.notifications;
CREATE POLICY "notifications own read" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications own update" ON public.notifications;
CREATE POLICY "notifications own update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications own delete" ON public.notifications;
CREATE POLICY "notifications own delete" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- No public INSERT — only triggers (security definer) write notifications.

-- Notification helper
CREATE OR REPLACE FUNCTION public.fn_notify(_user_id uuid, _kind text, _title text, _body text, _link text, _related_type text, _related_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, kind, title, body, link_url, related_type, related_id)
  VALUES (_user_id, _kind, _title, _body, _link, _related_type, _related_id);
END $$;

-- Task assignment notification
CREATE OR REPLACE FUNCTION public.fn_notify_task_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL
     AND NEW.assigned_to <> COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
     AND (TG_OP = 'INSERT' OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    PERFORM public.fn_notify(
      NEW.assigned_to, 'task_assigned',
      'Task assigned: ' || NEW.title,
      NEW.description,
      '/dashboard/my-tasks',
      'task', NEW.id
    );
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER project_tasks_notify_assignment
  AFTER INSERT OR UPDATE OF assigned_to ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_task_assigned();

-- Project status change notification
CREATE OR REPLACE FUNCTION public.fn_notify_project_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.project_manager_id IS NOT NULL THEN
      PERFORM public.fn_notify(NEW.project_manager_id, 'project_status',
        'Project ' || NEW.status::text || ': ' || NEW.title, NULL,
        '/dashboard/projects', 'project', NEW.id);
    END IF;
    FOREACH u IN ARRAY COALESCE(NEW.assigned_user_ids, '{}'::uuid[]) LOOP
      PERFORM public.fn_notify(u, 'project_status',
        'Project ' || NEW.status::text || ': ' || NEW.title, NULL,
        '/dashboard/projects', 'project', NEW.id);
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER projects_notify_status AFTER UPDATE OF status ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_project_status();

-- Booking assignment notification (notifies assigned crew user)
CREATE OR REPLACE FUNCTION public.fn_notify_booking_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE staff_user uuid;
BEGIN
  IF NEW.assigned_staff_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.assigned_staff_id IS DISTINCT FROM NEW.assigned_staff_id) THEN
    SELECT user_id INTO staff_user FROM public.staff_profiles WHERE id = NEW.assigned_staff_id;
    IF staff_user IS NOT NULL THEN
      PERFORM public.fn_notify(staff_user, 'booking_assigned',
        'New booking: ' || COALESCE(NEW.service_type, NEW.project_type, 'Booking'),
        'Client: ' || COALESCE(NEW.name, ''),
        '/dashboard/my-bookings', 'booking', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bookings_notify_assignment AFTER INSERT OR UPDATE OF assigned_staff_id ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_booking_assignment();
