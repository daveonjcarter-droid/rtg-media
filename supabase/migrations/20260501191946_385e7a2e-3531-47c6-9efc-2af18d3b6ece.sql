-- Public bucket for profile + portfolio media (images, video, pdf)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-media', 'profile-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "profile-media public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-media');

-- Users can upload into their own folder: <user_id>/...
CREATE POLICY "profile-media users insert own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "profile-media users update own folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "profile-media users delete own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
