-- Allow 'pending_staff' as a valid role_type so signup trigger doesn't fail
ALTER TABLE public.profile_meta DROP CONSTRAINT IF EXISTS profile_meta_role_type_check;
ALTER TABLE public.profile_meta ADD CONSTRAINT profile_meta_role_type_check
  CHECK (role_type IS NULL OR role_type = ANY (ARRAY[
    'owner','co_ceo','admin','editor','journalist','photographer',
    'videographer','designer','producer','crew','intern','client','pending_staff'
  ]));