-- Backfill: every existing admin also gets head_admin
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'head_admin'::public.app_role
FROM public.user_roles
WHERE role = 'admin'
ON CONFLICT DO NOTHING;

-- Update new-user trigger so founder emails get head_admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  if lower(new.email) in ('daveonjcarter@gmail.com', 'brendynshields20@gmail.com') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
    insert into public.user_roles (user_id, role) values (new.id, 'head_admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'writer');
  end if;

  return new;
end;
$function$;

-- ===== Bookings: extend to head_admin + booking_manager =====
DROP POLICY IF EXISTS "Editors and admins can read bookings" ON public.bookings;
CREATE POLICY "Booking team can read bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR has_role(auth.uid(), 'booking_manager'::app_role)
);

DROP POLICY IF EXISTS "Editors and admins can update bookings" ON public.bookings;
CREATE POLICY "Booking team can update bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR has_role(auth.uid(), 'booking_manager'::app_role)
);

-- ===== Leads: extend similarly =====
DROP POLICY IF EXISTS "Editors and admins can read leads" ON public.leads;
CREATE POLICY "Booking team can read leads"
ON public.leads FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR has_role(auth.uid(), 'booking_manager'::app_role)
);

DROP POLICY IF EXISTS "Editors and admins can update leads" ON public.leads;
CREATE POLICY "Booking team can update leads"
ON public.leads FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR has_role(auth.uid(), 'booking_manager'::app_role)
);

-- ===== site_content: head_admin can do what admin can =====
DROP POLICY IF EXISTS "Admins can update site content" ON public.site_content;
CREATE POLICY "Owners can update site content"
ON public.site_content FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'media_manager'::app_role)
);

DROP POLICY IF EXISTS "Admins can insert site content" ON public.site_content;
CREATE POLICY "Owners can insert site content"
ON public.site_content FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'media_manager'::app_role)
);

-- ===== articles: head_admin can update/delete any article =====
DROP POLICY IF EXISTS "Editors and admins can update any article" ON public.articles;
CREATE POLICY "Editors and admins can update any article"
ON public.articles FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
);

DROP POLICY IF EXISTS "Editors and admins can delete articles" ON public.articles;
CREATE POLICY "Editors and admins can delete articles"
ON public.articles FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
);

-- ===== editor_notes table =====
CREATE TABLE IF NOT EXISTS public.editor_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS editor_notes_article_idx ON public.editor_notes(article_id, created_at DESC);
ALTER TABLE public.editor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editorial team can read notes"
ON public.editor_notes FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR EXISTS (SELECT 1 FROM public.articles a WHERE a.id = editor_notes.article_id AND a.author_id = auth.uid())
);

CREATE POLICY "Editorial team can write notes"
ON public.editor_notes FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid() AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'head_admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
  )
);

CREATE POLICY "Authors can delete their own notes"
ON public.editor_notes FOR DELETE TO authenticated
USING (author_id = auth.uid() OR has_role(auth.uid(), 'head_admin'::app_role));

-- ===== article_revisions table (lightweight history) =====
CREATE TABLE IF NOT EXISTS public.article_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  saved_by uuid NOT NULL,
  snapshot jsonb NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS article_revisions_article_idx ON public.article_revisions(article_id, created_at DESC);
ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editorial team can read revisions"
ON public.article_revisions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'head_admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
  OR EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_revisions.article_id AND a.author_id = auth.uid())
);

CREATE POLICY "Editorial team can save revisions"
ON public.article_revisions FOR INSERT TO authenticated
WITH CHECK (
  saved_by = auth.uid() AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'head_admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
    OR has_role(auth.uid(), 'writer'::app_role)
  )
);