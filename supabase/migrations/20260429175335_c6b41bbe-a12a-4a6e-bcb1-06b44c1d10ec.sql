-- Expand site-content bucket write access to editorial team & media managers.
DROP POLICY IF EXISTS "Admins can upload site-content images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update site-content images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete site-content images" ON storage.objects;

CREATE POLICY "Editorial team can upload site-content"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-content' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'head_admin'::app_role) OR
    has_role(auth.uid(), 'editor'::app_role) OR
    has_role(auth.uid(), 'media_manager'::app_role)
  )
);

CREATE POLICY "Editorial team can update site-content"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-content' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'head_admin'::app_role) OR
    has_role(auth.uid(), 'editor'::app_role) OR
    has_role(auth.uid(), 'media_manager'::app_role)
  )
);

CREATE POLICY "Editorial team can delete site-content"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-content' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'head_admin'::app_role) OR
    has_role(auth.uid(), 'editor'::app_role) OR
    has_role(auth.uid(), 'media_manager'::app_role)
  )
);