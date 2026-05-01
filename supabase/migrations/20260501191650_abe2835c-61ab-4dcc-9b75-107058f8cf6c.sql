-- Allow any authenticated user to create their OWN staff profile row.
-- This unblocks the "My Profile" page so users can build a profile without admin linking.
CREATE POLICY "Users can create their own staff profile"
ON public.staff_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
