-- Fix mutable search_path on trigger fn
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Lock down SECURITY DEFINER function execution
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

revoke execute on function public.get_user_roles(uuid) from public, anon, authenticated;
grant execute on function public.get_user_roles(uuid) to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;