
-- 1. picks table
CREATE TABLE public.picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('mainstream','independent')),
  artist_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_picks_category_current ON public.picks (category, is_current);
CREATE INDEX idx_picks_published_at ON public.picks (published_at DESC);

-- Grants — public-readable, writes are role-gated via RLS
GRANT SELECT ON public.picks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.picks TO authenticated;
GRANT ALL ON public.picks TO service_role;

ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

-- Read: public
CREATE POLICY "Picks are viewable by everyone"
  ON public.picks FOR SELECT
  USING (true);

-- Write: admins/owners/head_admin/co_ceo only
CREATE POLICY "Admins can insert picks"
  ON public.picks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'co_ceo')
  );

CREATE POLICY "Admins can update picks"
  ON public.picks FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'co_ceo')
  );

CREATE POLICY "Admins can delete picks"
  ON public.picks FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'co_ceo')
  );

-- Updated-at trigger
CREATE TRIGGER trg_picks_updated_at
BEFORE UPDATE ON public.picks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Atomic publish helper — archives previous current in category, inserts new
CREATE OR REPLACE FUNCTION public.publish_pick(
  _category TEXT,
  _artist_name TEXT,
  _description TEXT,
  _image_url TEXT,
  _link TEXT
) RETURNS public.picks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_row public.picks;
BEGIN
  IF NOT (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'co_ceo')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _category NOT IN ('mainstream','independent') THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;

  UPDATE public.picks
     SET is_current = false, updated_at = now()
   WHERE category = _category AND is_current = true;

  INSERT INTO public.picks (
    category, artist_name, description, image_url, link,
    published_at, is_current, created_by
  ) VALUES (
    _category, _artist_name, _description, _image_url, _link,
    now(), true, auth.uid()
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

-- 3. Storage bucket for artist photos
INSERT INTO storage.buckets (id, name, public)
  VALUES ('artist-picks', 'artist-picks', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Artist pick photos are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artist-picks');

-- Admin uploads/updates/deletes
CREATE POLICY "Admins can upload artist pick photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'artist-picks'
    AND (
      public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'head_admin')
      OR public.has_role(auth.uid(),'owner')
      OR public.has_role(auth.uid(),'co_ceo')
    )
  );

CREATE POLICY "Admins can update artist pick photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'artist-picks'
    AND (
      public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'head_admin')
      OR public.has_role(auth.uid(),'owner')
      OR public.has_role(auth.uid(),'co_ceo')
    )
  );

CREATE POLICY "Admins can delete artist pick photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'artist-picks'
    AND (
      public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'head_admin')
      OR public.has_role(auth.uid(),'owner')
      OR public.has_role(auth.uid(),'co_ceo')
    )
  );
